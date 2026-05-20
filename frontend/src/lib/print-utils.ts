
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generateInvoicePDF = async (elementId: string, filename: string, options: { orientation?: 'p' | 'l', format?: string } = {}) => {
    const { orientation = 'p', format = 'a4' } = options;
    const input = document.getElementById(elementId);
    if (!input) return;

    // Use a higher scale for better quality
    const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A5 size in mm: 148 x 210 (Nota usually A5 or similar)
    // The InvoicePrint component is styled for 210mm (A4 width) but Nota is often landscape A5 or A4.
    // Let's use A4 as default if it's 210mm wide.
    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format as any
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
};
