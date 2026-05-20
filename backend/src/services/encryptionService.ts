import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 32 characters
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || '';   // Must be 16 characters
const ALGORITHM = 'aes-256-cbc';

if (ENCRYPTION_KEY.length !== 32 || ENCRYPTION_IV.length !== 16) {
    console.error('Encryption key must be 32 characters and IV must be 16 characters.');
}

export const encrypt = (text: string | null | undefined): string | null => {
    if (!text) return text as null;
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
};

export const decrypt = (text: string | null | undefined): string | null => {
    if (!text) return text as null;
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
