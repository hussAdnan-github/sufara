import { json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { sendWhatsApp } from '../_shared/notify.ts';

/* Tracking webhook from the shipping aggregator (header x-carrier-secret).

   Body (shipment level — the normal case after integration):
     { tracking_no, status: in_transit|out_for_delivery|delivered|exception|returned,
       at?, description?, location? }
   Body (sub-order level — kept for manual tools):
     { sub_order_id, status: dispatched|delivered|returned, at?, tracking_no? }

   A carrier-confirmed "delivered" starts the destination return window, the
   clock that unlocks commissions and the factory settlement. */

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const secret = Deno.env.get('SHIPPING_WEBHOOK_SECRET') ?? Deno.env.get('CARRIER_WEBHOOK_SECRET') ?? '';
  if (!secret || !safeEqual(req.headers.get('x-carrier-secret') ?? '', secret)) return json({ error: 'unauthorized' }, 401);

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: 'bad event' }, 400);
  const db = serviceClient();
  const at = body.at ? new Date(body.at).toISOString() : new Date().toISOString();

  if (body.tracking_no && !body.sub_order_id) {
    const { data: sh } = await db.from('shipments').select('id').eq('tracking_no', String(body.tracking_no)).maybeSingle();
    if (!sh) return json({ error: 'unknown tracking number' }, 404);
    const { error } = await db.rpc('record_shipment_event', {
      p_shipment: sh.id, p_status: String(body.status), p_at: at,
      p_description: body.description ? String(body.description).slice(0, 300) : null,
      p_location: body.location ? String(body.location).slice(0, 120) : null, p_raw: body,
    });
    if (error) return json({ error: error.message }, 409);
    if (['out_for_delivery', 'delivered'].includes(String(body.status))) {
      const { data: rows } = await db.from('shipment_items').select('sub_orders(orders(id, buyer_phone))').eq('shipment_id', sh.id);
      const seen = new Set<string>();
      for (const r of rows ?? []) {
        const o = (r as unknown as { sub_orders: { orders: { id: string; buyer_phone: string | null } } }).sub_orders?.orders;
        if (o?.buyer_phone && !seen.has(o.id)) {
          seen.add(o.id);
          await sendWhatsApp(o.buyer_phone, `order_${String(body.status)}`, [o.id, String(body.tracking_no)]);
        }
      }
    }
    return json({ ok: true });
  }

  const status = String(body.status ?? '');
  if (!body.sub_order_id || !['dispatched', 'delivered', 'returned'].includes(status)) return json({ error: 'bad event' }, 400);
  const { error } = await db.rpc('record_shipment', {
    p_sub_order: String(body.sub_order_id), p_status: status, p_at: at, p_tracking: body.tracking_no ? String(body.tracking_no) : null,
  });
  if (error) return json({ error: error.message }, 409);
  return json({ ok: true });
});
