import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { verifyAdmin } from './verify';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!verifyAdmin(req, res)) return; // will send 401 if not authorized

    try {
        const snapshot = await getDocs(collection(db, 'applications'));
        const apps = snapshot.docs.map(d => d.data());
        res.status(200).json({ applications: apps });
    } catch (e) {
        console.error('Failed to fetch applications', e);
        res.status(500).json({ error: 'Server error' });
    }
}
