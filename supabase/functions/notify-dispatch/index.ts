import { json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { sendEmail } from '../_shared/notify.ts';

/* Every few minutes (cron, x-cron-secret): e-mails the notifications that
   have not been e-mailed yet — to account holders (their auth e-mail) and to
   guests (the e-mail on their order). Admin notifications go to ADMIN_EMAILS. */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET') ?? '';
  if (!secret || !safeEqual(req.headers.get('x-cron-secret') ?? '', secret)) return json({ error: 'unauthorized' }, 401);
  const db = serviceClient();
  const site = Deno.env.get('SITE_URL') ?? '';
  const admins = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const { data: rows } = await db.from('notifications').select('*').is('emailed_at', null)
    .gte('created_at', new Date(Date.now() - 3 * 86400_000).toISOString()).order('id').limit(200);
  let sent = 0;
  for (const n of rows ?? []) {
    let to: string[] = [];
    if (n.audience === 'admins') to = admins;
    else if (n.email) to = [n.email];
    else if (n.user_id) {
      const { data } = await db.auth.admin.getUserById(n.user_id);
      if (data?.user?.email) to = [data.user.email];
    }
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>${n.link ? `<p><a href="${site}${n.link}">فتح في سفير</a></p>` : ''}</div>`;
    for (const addr of to) await sendEmail(addr, `سفير · ${n.title}`, html);
    await db.from('notifications').update({ emailed_at: new Date().toISOString() }).eq('id', n.id);
    sent += to.length;
  }
  return json({ processed: rows?.length ?? 0, sent });
});
