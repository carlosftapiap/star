
'use server';

import { getWebhookUrl } from "./firebase/firestore";

type WebhookEvent = 'user.created' | 'user.updated' | 'redemption.created';

/**
 * Sends a webhook notification if a URL is configured.
 * @param event The type of event that occurred.
 * @param data The data payload to send.
 */
export async function sendWebhook(event: WebhookEvent, data: any): Promise<void> {
    try {
        const webhookUrl = await getWebhookUrl();
        
        if (!webhookUrl) {
            // No webhook configured, so we just return silently.
            return;
        }

        const payload = {
            event: event,
            timestamp: new Date().toISOString(),
            data: data
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook failed for event ${event}. Status: ${response.status} ${response.statusText}`);
            const responseBody = await response.text();
            console.error('Webhook response body:', responseBody);
        } else {
            console.log(`Webhook sent successfully for event ${event}.`);
        }

    } catch (error) {
        console.error(`An unexpected error occurred while sending the webhook for event ${event}:`, error);
    }
}
