import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PageHead, Pill, Stat } from '@/pages/dashboard/components/ui';

/* Demo versions of the warehouse and group-order screens. The live versions
   (views/live/LiveLogistics) replace them for a real admin session. */

function useL() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.logi.${key}`, opts);
}

const SITES = [
  { id: 'jed-1', name: 'مستودع جدة', city: 'جدة', def: true },
  { id: 'dmm-1', name: 'مستودع الدمام', city: 'الدمام', def: false },
];
const QUEUE = [
  { id: 'SFR-20611-hasa', factory: 'مصنع تمور الأحساء', units: 120, country: 'id', stage: 'handed' },
  { id: 'SFR-20614-oud', factory: 'بيت عود الرياض', units: 40, country: 'pk', stage: 'received' },
  { id: 'SFR-20598-fifa', factory: 'مزارع قهوة فيفا', units: 60, country: 'id', stage: 'passed' },
  { id: 'SFR-20590-hasa', factory: 'مصنع تمور الأحساء', units: 30, country: 'id', stage: 'failed' },
];

function AdminWarehousesDemo() {
  const L = useL();
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('whTitle')} sub={L('whSub')} />
      <div className="seg compact mb" role="tablist" aria-label={L('warehouse')}>
        {SITES.map((w) => (
          <button key={w.id} type="button" role="tab" aria-selected={w.def} className={w.def ? 'is-on' : ''}><i className="ri-building-line" /> {w.name}</button>
        ))}
      </div>
      <div className="grid c4 mb">
        <Stat icon="ri-time-line" num="3" lbl={L('stAwaiting')} />
        <Stat icon="ri-truck-line" num="1" lbl={L('stInbound')} />
        <Stat icon="ri-search-eye-line" num="1" lbl={L('stInspect')} />
        <Stat icon="ri-box-3-line" num="1" lbl={L('stReady')} />
      </div>
      <Card title={L('shipments')}>
        <div className="list">
          {QUEUE.map((r) => (
            <div className="list-row" key={r.id}>
              <div className="ic"><i className="ri-box-3-line" /></div>
              <div className="body">
                <div className="t" dir="ltr">{r.id}</div>
                <div className="s">{r.factory} · {r.units} {L('units')} · {r.country.toUpperCase()}</div>
              </div>
              <div className="end"><Pill tone={r.stage === 'passed' ? 'ok' : r.stage === 'failed' ? 'danger' : 'warn'}>{L(`s_${r.stage}`)}</Pill></div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

const GROUPS = [
  { code: 'GRP-JKT-14', dest: 'ID Jakarta', n: 9, min: 15, status: 'awaiting_decision', msgs: 1 },
  { code: 'GRP-KHI-07', dest: 'PK Karachi', n: 22, min: 20, status: 'ready', msgs: 0 },
  { code: 'GRP-CAI-03', dest: 'EG Cairo', n: 6, min: 12, status: 'open', msgs: 0 },
];

function AdminGroupsDemo() {
  const L = useL();
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('groupsTitle')} sub={L('groupsSub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-alarm-warning-line" num="1" lbl={L('s_awaiting_decision')} />
        <Stat icon="ri-group-line" num="1" lbl={L('s_open')} />
        <Stat icon="ri-box-3-line" num="1" lbl={L('s_ready')} />
      </div>
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{L('code')}</th><th>{L('destination')}</th><th>{L('participantsCol')}</th><th>{L('status')}</th><th /></tr></thead>
            <tbody>
              {GROUPS.map((g) => (
                <tr key={g.code}>
                  <td className="strong" dir="ltr">{g.code}</td>
                  <td>{g.dest}</td>
                  <td>{g.n} / {g.min}</td>
                  <td><Pill tone={g.status === 'ready' ? 'ok' : 'warn'}>{L(`s_${g.status}`)}</Pill><div className="s small muted">{L('messagesSent', { n: g.msgs })}</div></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn ghost sm"><i className="ri-mail-send-line" /> {L('message')}</button>
                    {g.status !== 'ready' && <button type="button" className="btn primary sm">{L('decide')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('groupsNote')}</span></div>
      </Card>
    </>
  );
}

export const adminOpsDemoViews: Record<string, FunctionComponent> = {
  'admin-warehouses': AdminWarehousesDemo,
  'admin-groups': AdminGroupsDemo,
};
