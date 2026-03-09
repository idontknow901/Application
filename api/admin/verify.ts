import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function verifyAdmin(req: VercelRequest, res: VercelResponse): boolean {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (!match) {
        res.status(401).json({ error: 'Unauthorized' });
        return false;
    }
    const token = match[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { role: string };
        if (payload.role !== 'admin') throw new Error('Invalid role');
        return true;
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
        return false;
    }
}
