// Vercel Serverless Function for admin login
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Debug: show that .env is loaded
console.log('🔑 ADMIN_PASSWORD_HASH (first 20 chars):', process.env.ADMIN_PASSWORD_HASH?.slice(0, 20));

// Load env variables (Vercel injects them at runtime)
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

    const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    console.log('🔍 bcrypt compare result:', isMatch);
    if (!isMatch) {
        res.status(401).json({ error: 'Invalid administrator password' });
        return;
    }

    // Create JWT token (expires in 2h)
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });

    // Set HttpOnly cookie
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Strict; Secure`);
    res.status(200).json({ success: true });
}
