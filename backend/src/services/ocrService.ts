
import Tesseract from 'tesseract.js';
import { logger } from '../utils/logger';

export class OcrService {
    static async extractPrescription(imagePath: string) {
        try {
            logger.info(`Starting OCR on ${imagePath}`);
            const { data: { text } } = await Tesseract.recognize(
                imagePath,
                'eng',
                { logger: m => logger.info(m.status) }
            );

            logger.info('OCR Text extracted successfully');
            return this.parsePrescriptionText(text);
        } catch (error) {
            logger.error('OCR Error', error);
            throw new Error('Failed to read prescription image');
        }
    }

    private static parsePrescriptionText(text: string) {
        const result = {
            raw_text: text,
            parsed: {
                right: { sph: null as number | null, cyl: null as number | null, axis: null as number | null },
                left: { sph: null as number | null, cyl: null as number | null, axis: null as number | null },
                pd: null as number | null
            }
        };

        // Normalize text: replace commas with dots (common in handwritten decimals), remove degree symbols
        const cleanText = text.replace(/,/g, '.').replace(/°/g, '');
        const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        logger.info(`Cleaning and parsing OCR text...`);

        // Search for keywords and extract numbers
        // We look for patterns like "S -6.50 C -1.25 AXIS 0" or table rows
        
        let currentEye: 'right' | 'left' | null = null;

        lines.forEach(line => {
            // Determine eye context
            if (/MATA\s*KANAN|OD|R:|Right/i.test(line)) {
                currentEye = 'right';
            } else if (/MATA\s*KIRI|OS|L:|Left/i.test(line)) {
                currentEye = 'left';
            }

            // Extract values if currentEye is known or if line contains eye keywords
            const extract = (eye: 'right' | 'left', targetLine: string) => {
                // Look for S/SPH
                const sMatch = targetLine.match(/(?:S|SPH)\s*:?\s*([+-]?\d+\.?\d*)/i);
                if (sMatch) result.parsed[eye].sph = parseFloat(sMatch[1]);

                // Look for C/CYL
                const cMatch = targetLine.match(/(?:C|CYL)\s*:?\s*([+-]?\d+\.?\d*)/i);
                if (cMatch) result.parsed[eye].cyl = parseFloat(cMatch[1]);

                // Look for AXIS
                const aMatch = targetLine.match(/(?:A|AX|AXIS)\s*:?\s*(\d+)/i);
                if (aMatch) result.parsed[eye].axis = parseInt(aMatch[1]);
            };

            if (currentEye) {
                extract(currentEye, line);
            } else {
                // If eye context not set in header, try to find eye markers and values in same line
                if (/OD|KANAN/i.test(line)) extract('right', line);
                if (/OS|KIRI/i.test(line)) extract('left', line);
            }
            
            // Special case for table-like rows where values might be alone but in sequence
            // e.g. "-6.50 -1.25 0"
            const numMatches = line.match(/([+-]?\d+\.\d+)\s+([+-]?\d+\.\d+)\s+(\d+)/g);
            if (numMatches && !result.parsed.right.sph) {
                // Very basic heuristic for table rows
                const parts = line.split(/\s+/).filter(p => !isNaN(parseFloat(p.replace(/[+-]/g, ''))));
                if (parts.length >= 3) {
                     // If we are in eye context, or just found a row
                     const eye = currentEye || 'right'; // fallback
                     result.parsed[eye].sph = parseFloat(parts[0]);
                     result.parsed[eye].cyl = parseFloat(parts[1]);
                     result.parsed[eye].axis = parseInt(parts[2]);
                }
            }
        });

        // Extra check for PD (Distance Pupil)
        const pdMatch = cleanText.match(/(?:PD|DIST\s*PUP|PUPIL)\s*:?\s*(\d+)/i);
        if (pdMatch) result.parsed.pd = parseInt(pdMatch[1]);

        return result;
    }

    static async extractPatientData(imagePath: string) {
        try {
            logger.info(`Starting Patient Data OCR on ${imagePath}`);
            const { data: { text } } = await Tesseract.recognize(
                imagePath,
                'eng',
                { logger: m => logger.info(m.status) }
            );

            logger.info('OCR Text (Patient) extracted successfully');
            return this.parsePatientText(text);
        } catch (error) {
            logger.error('OCR Patient Error', error);
            throw new Error('Failed to read ID card image');
        }
    }

    private static parsePatientText(text: string) {
        const result = {
            raw_text: text,
            parsed: {
                nik: null as string | null,
                name: null as string | null,
                address: null as string | null
            }
        };

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        lines.forEach(line => {
            // NIK is usually a 16-digit number
            const nikMatch = line.match(/(\d{16})/);
            if (nikMatch && !result.parsed.nik) {
                result.parsed.nik = nikMatch[1];
            }

            // Name is usually after "Nama" or similar
            const nameMatch = line.match(/(?:Nama|Name)\s*:?\s*([A-Za-z\s]+)/i);
            if (nameMatch && !result.parsed.name) {
                result.parsed.name = nameMatch[1].trim();
            }

            // Address is usually after "Alamat" or similar
            const addressMatch = line.match(/(?:Alamat|Address)\s*:?\s*(.+)/i);
            if (addressMatch && !result.parsed.address) {
                result.parsed.address = addressMatch[1].trim();
            }
        });

        // Heuristic: if name is still null, try finding lines with many uppercase words
        if (!result.parsed.name) {
            const potentialNames = lines.filter(l => 
                /^[A-Z][A-Z\s]+$/.test(l) && 
                l.length > 5 && 
                !/PROVINSI|KABUPATEN|KECAMATAN|DESA|NIK|PENGGOLONGAN/i.test(l)
            );
            if (potentialNames.length > 0) {
                result.parsed.name = potentialNames[0];
            }
        }

        return result;
    }
}
