import prisma from '../../config/database';
import { StockMovementService } from '../inventory/stock-movement.service';

export class OrderService {

    static async create(data: any, userId: string, branchId: string) {
        const { patient_id, prescription_id, items, dp_amount = 0, discount = 0, is_bpjs = false } = data;

        return await prisma.$transaction(async (tx) => {
            // 1. Validate Prescription (if provided)
            if (prescription_id) {
                const prescription = await tx.prescription.findFirst({
                    where: { 
                        id: prescription_id,
                        examination: { patient_id: patient_id }
                    }
                });
                if (!prescription) throw new Error('Resep tidak valid atau bukan milik pasien ini');
            }

            // 2. Calculate items total using DATABASE prices (Security fix & Stock validation)
            let itemsTotal = 0;
            const enrichedItems = [];

            for (const item of items) {
                let dbPrice = 0;
                if (item.product_type === 'frame') {
                    const frame = await tx.frame.findUnique({ where: { id: item.product_id } });
                    if (!frame) throw new Error(`Frame dengan ID ${item.product_id} tidak ditemukan`);
                    dbPrice = frame.price;

                    // Validasi stok di cabang ini
                    const branchStock = await tx.frameStock.findUnique({
                        where: { frame_id_branch_id: { frame_id: item.product_id, branch_id: branchId } }
                    });
                    const currentQty = branchStock ? branchStock.quantity : 0;
                    if (currentQty < item.qty) {
                        throw new Error(`Stok Frame "${frame.brand} ${frame.model}" tidak mencukupi di cabang ini (Tersedia: ${currentQty}, Diminta: ${item.qty})`);
                    }
                } else if (item.product_type === 'lens') {
                    const lens = await tx.lens.findUnique({ where: { id: item.product_id } });
                    if (!lens) throw new Error(`Lensa dengan ID ${item.product_id} tidak ditemukan`);
                    dbPrice = lens.price;

                    // Validasi stok di cabang ini
                    const branchStock = await tx.lensStock.findUnique({
                        where: { lens_id_branch_id: { lens_id: item.product_id, branch_id: branchId } }
                    });
                    const currentQty = branchStock ? branchStock.quantity : 0;
                    if (currentQty < item.qty) {
                        throw new Error(`Stok Lensa "${lens.brand} - ${lens.type}" tidak mencukupi di cabang ini (Tersedia: ${currentQty}, Diminta: ${item.qty})`);
                    }
                } else if (item.product_type === 'service') {
                    dbPrice = item.price || 0; // Services trust frontend for now, or use a fixed rate
                }

                itemsTotal += dbPrice * item.qty;
                enrichedItems.push({ ...item, price: dbPrice });
            }
            const netTotal = itemsTotal - discount;

            // 3. Create order
            const order = await tx.order.create({
                data: {
                    patient: { connect: { id: patient_id } },
                    prescription: prescription_id ? { connect: { id: prescription_id } } : undefined,
                    total_amount: netTotal,
                    discount: discount,
                    status: 'pending',
                },
            });

            // 4. Create order items & Update Stocks
            for (const item of enrichedItems) {
                let costPrice = 0;

                if (item.product_type === 'frame' || item.product_type === 'lens') {
                    // Update stock quantity (Global)
                    await StockMovementService.updateStock(tx, branchId, item.product_id, item.product_type, -item.qty);
                    
                    // FIFO Deduction & Cost calculation
                    const totalCost = await StockMovementService.deductFIFO(tx, branchId, item.product_id, item.product_type, item.qty);
                    costPrice = item.qty > 0 ? (totalCost / item.qty) : 0;

                    // Log movement
                    await StockMovementService.logMovement(tx, {
                        type: 'OUT',
                        source: 'SALE',
                        quantity: item.qty,
                        frame_id: item.product_type === 'frame' ? item.product_id : undefined,
                        lens_id: item.product_type === 'lens' ? item.product_id : undefined,
                        branch_id: branchId,
                        user_id: userId,
                        notes: `Penjualan - Inv: ${order.id}`
                    });
                }

                await tx.orderItem.create({
                    data: {
                        order_id: order.id,
                        product_type: item.product_type as any,
                        frame_id: item.product_type === 'frame' ? item.product_id : null,
                        lens_id: item.product_type === 'lens' ? item.product_id : null,
                        price: item.price,
                        cost_price: costPrice,
                        qty: item.qty as number,
                    } as any
                });
            }

            // 5. Generate timezone-aware invoice number: INV-YYYYMMDD-XXXX-YYY (with Concurrency row lock)
            const jakartaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
            const dateStr = jakartaTime.getFullYear() +
                            String(jakartaTime.getMonth() + 1).padStart(2, '0') +
                            String(jakartaTime.getDate()).padStart(2, '0');

            // Hari ini pukul 00:00:00 WIB
            const todayStartJakarta = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
            todayStartJakarta.setHours(0, 0, 0, 0);

            // Kunci transaksi menggunakan PG Advisory Lock untuk mencegah balapan konkurensi (race condition) saat database hari ini masih kosong
            await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtext('invoice-sequence-lock'));");

            const latestInvoices = await tx.$queryRaw<Array<{ invoice_number: string }>>`
                SELECT invoice_number FROM invoices
                WHERE created_at >= ${todayStartJakarta}
                ORDER BY created_at DESC
                LIMIT 1
            `;

            let nextCounter = 1;
            if (latestInvoices.length > 0) {
                const latestNumber = latestInvoices[0].invoice_number;
                const parts = latestNumber.split('-');
                if (parts.length >= 3) {
                    const lastCounter = parseInt(parts[2], 10);
                    if (!isNaN(lastCounter)) {
                        nextCounter = lastCounter + 1;
                    }
                }
            }

            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const invoiceNumber = `INV-${dateStr}-${String(nextCounter).padStart(4, '0')}-${randomSuffix}`;

            // 6. Create invoice
            const invoice = await tx.invoice.create({
                data: {
                    invoice_number: invoiceNumber,
                    order_id: order.id,
                    total_amount: netTotal,
                    dp_amount: dp_amount,
                    remaining: netTotal - dp_amount,
                },
            });

            // 7. If DP, create payment record
            if (dp_amount > 0) {
                await tx.payment.create({
                    data: {
                        order_id: order.id,
                        method: data.dp_method || 'cash',
                        amount: dp_amount,
                    },
                });
            }

            // 8. If BPJS transaction, create BPJS claim record
            if (is_bpjs && prescription_id) {
                await tx.bpjsClaim.create({
                    data: {
                        patient_id: patient_id,
                        prescription_id: prescription_id,
                        order_id: order.id,
                        status: 'submitted'
                    }
                });
            }

            // 7. Audit log
            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: 'CREATE',
                    table_name: 'orders',
                    record_id: order.id,
                    new_data: { order_id: order.id, total_amount: netTotal, invoice_number: invoiceNumber },
                },
            });

            return { order, invoice };
        });
    }

    static async findAll(branchId: string) {
        // Fetch orders linked to patients of this branch
        return prisma.order.findMany({
            where: { patient: { branch_id: branchId } },
            include: {
                patient: { select: { id: true, name: true, phone: true } },
                items: {
                    include: {
                        frame: true,
                        lens: true
                    }
                },
                invoices: true,
                payments: true,
            },
            orderBy: { order_date: 'desc' },
        });
    }

    static async findById(id: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                patient: true,
                prescription: { include: { details: true } },
                items: {
                    include: {
                        frame: true,
                        lens: true,
                    },
                },
                invoices: true,
                payments: true,
            },
        });
        if (!order) throw new Error('Order not found');
        return order;
    }

    static async updateStatus(id: string, status: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const old = await tx.order.findUnique({ 
                where: { id },
                include: { patient: true }
            });
            if (!old) throw new Error('Order tidak ditemukan');

            // Jika status baru adalah cancelled dan status lama sudah cancelled, abaikan
            if (status === 'cancelled' && old.status === 'cancelled') {
                return old;
            }

            const updated = await tx.order.update({
                where: { id },
                data: { status: status as any },
            });

            // LOGIKA PEMULIHAN STOK BILA STATUS DIUBAH MENJADI CANCELLED
            if (status === 'cancelled' && old.status !== 'cancelled') {
                const items = await tx.orderItem.findMany({
                    where: { order_id: id }
                });

                const branchId = old.patient.branch_id;

                for (const item of items) {
                    const productId = item.frame_id || item.lens_id;
                    const type = item.product_type; // 'frame' | 'lens' | 'service'

                    if ((type === 'frame' || type === 'lens') && productId) {
                        // 1. Kembalikan stok cabang (dan stok global lewat trigger updateStock baru)
                        await StockMovementService.updateStock(tx, branchId, productId, type, item.qty);

                        // 2. Pulihkan batch FIFO dengan membuat batch pengembalian dengan harga beli asli (cost_price)
                        await StockMovementService.createBatch(tx, {
                            productId,
                            type,
                            branchId,
                            purchasePrice: item.cost_price || 0,
                            quantity: item.qty
                        });

                        // 3. Log mutasi stok masuk dengan source RETURN
                        await StockMovementService.logMovement(tx, {
                            type: 'IN',
                            source: 'RETURN',
                            quantity: item.qty,
                            frame_id: type === 'frame' ? productId : undefined,
                            lens_id: type === 'lens' ? productId : undefined,
                            branch_id: branchId,
                            user_id: userId,
                            notes: `Pembatalan Transaksi - Inv: ${id}`
                        });
                    }
                }
            }

            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: 'UPDATE_STATUS',
                    table_name: 'orders',
                    record_id: id,
                    old_data: { status: old.status },
                    new_data: { status },
                },
            });

            return updated;
        });
    }

    static async addPayment(orderId: string, data: { amount: number, method: string, notes?: string }, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findFirst({
                where: { order_id: orderId }
            });

            if (!invoice) throw new Error('Invoice not found');
            if (invoice.remaining < data.amount) throw new Error('Payment amount exceeds remaining balance');

            // 1. Create payment
            const payment = await tx.payment.create({
                data: {
                    order_id: orderId,
                    amount: parseFloat(data.amount as any),
                    method: data.method as any,
                }
            });

            // 2. Update invoice
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    remaining: invoice.remaining - parseFloat(data.amount as any)
                }
            });

            // 3. Audit log
            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: 'ADD_PAYMENT',
                    table_name: 'payments',
                    record_id: payment.id,
                    new_data: { order_id: orderId, amount: data.amount, method: data.method }
                }
            });

            return { payment, invoice: updatedInvoice };
        });
    }
}
