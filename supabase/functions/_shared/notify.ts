/* Order notifications: email through Resend, WhatsApp through the Cloud API.
   Both are optional — a missing key simply skips that channel. Failures are
   logged, never thrown: a notification must not roll back a payment. */

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM');
  if (!key || !from || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (err) {
    console.error('email failed', err);
  }
}

export async function sendWhatsApp(toE164: string, template: string, params: string[], lang = 'ar'): Promise<void> {
  const token = Deno.env.get('WHATSAPP_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');
  if (!token || !phoneId || !toE164) return;
  try {
    await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toE164.replace(/[^\d]/g, ''),
        type: 'template',
        template: {
          name: template,
          language: { code: lang },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    });
  } catch (err) {
    console.error('whatsapp failed', err);
  }
}
