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

        // Support for updating existing messages (PATCH) if messageId is provided
        if (type === 'open' && messageId) {
            finalUrl = `${url}/messages/${messageId}`;
            method = 'PATCH';
        } else if (type === 'open') {
            finalUrl = `${url}?wait=true`;
        }

        const response = await fetch(finalUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Discord API error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Webhook proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
