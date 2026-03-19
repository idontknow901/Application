import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { password } = req.body as { password?: string };
    if (!password) {
        res.status(400).json({ error: 'Password is required' });
        return;
    }

    // Clean the hash from trailing periods or spaces (common in manual ENV entry)
    const trimmedHash = ADMIN_PASSWORD_HASH.trim().replace(/\.$/, '');

    if (!trimmedHash) {
        console.error('❌ ADMIN_PASSWORD_HASH is missing or empty!');
        res.status(500).json({ error: 'Admin password not configured on server' });
        return;
    }

    // Verify using bcrypt for secure hashing
    const isMatch = await bcrypt.compare(password.trim(), trimmedHash);

    if (!isMatch) {
        console.warn(`⚠️ Login attempt failed. Hash in ENVs starts with: ${trimmedHash.substring(0, 10)}...`);
        res.status(401).json({ error: 'Invalid administrator password' });
        return;
    }

    // Create JWT token (expires in 2h)
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });

    // Set HttpOnly cookie
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Strict; Secure`);
    res.status(200).json({ success: true });
}
