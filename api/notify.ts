import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { type, payload, messageId } = req.body;

    // Map types to environment variable URLs
    const webhookUrls: Record<string, string | undefined> = {
        'open': process.env.DISCORD_WEBHOOK_URL_OPEN,
        'results': process.env.DISCORD_WEBHOOK_URL_RESULTS,
        'logs': process.env.DISCORD_WEBHOOK_URL_LOGS,
    };

    const url = webhookUrls[type];

    if (!url) {
        // If the URL is not set in environment variables, we might want to check the payload 
        // if we still want to allow dynamic ones, but for security, we should ONLY allow env ones.
        res.status(500).json({ error: 'Webhook URL not configured on server' });
        return;
    }

    try {
        let finalUrl = url;
        let method = 'POST';

        if ((type === 'open' || type === 'logs') && messageId) {
            finalUrl = `${url}/messages/${messageId}`;
            method = 'PATCH';
        } else {
            // Always wait for the ID on initial POST for these types
            if (type === 'open' || type === 'logs') {
                finalUrl = `${url}?wait=true`;
            }
        }

        let response = await fetch(finalUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Robust Fallback: If message was deleted (404) during a PATCH, create a new one instead
        if (!response.ok && response.status === 404 && method === 'PATCH') {
            console.warn(`Message ${messageId} not found, creating new message for ${type}...`);
            finalUrl = `${url}?wait=true`;
            response = await fetch(finalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (!response.ok) {
            const errText = await response.text();
            res.status(response.status).json({ error: errText });
            return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            res.status(200).json(data);
        } else {
            res.status(200).json({ success: true });
        }
    } catch (error: any) {
        console.error('Webhook proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
