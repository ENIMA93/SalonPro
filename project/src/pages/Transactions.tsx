import { useEffect, useRef, useState } from 'react';
import { Loader2, Receipt, Printer, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../lib/SettingsContext';

type TransactionRow = {
  id: string;
  created_at: string;
  total_amount: number;
  items_json: unknown;
  client_name?: string | null;
  staff_id?: string | null;
  staff?: { name: string } | { name: string }[] | null;
};

function getStaffName(row: TransactionRow): string {
  const s = row.staff;
  if (!s) return '—';
  return Array.isArray(s) ? (s[0]?.name ?? '—') : (s.name ?? '—');
}

type SortKey = 'created_at' | 'total_amount';
type SortDir = 'asc' | 'desc';

function formatTableDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function Transactions() {
  const { settings } = useSettings();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [printTransaction, setPrintTransaction] = useState<TransactionRow | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setError(null);
      const { data, error: e } = await supabase
        .from('transactions')
        .select('id, created_at, total_amount, items_json, client_name, staff_id, staff:staff_id(name)')
        .order('created_at', { ascending: false });
      if (e) {
        setError(e.message);
        setTransactions([]);
      } else {
        setTransactions((data as TransactionRow[]) || []);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const sorted = [...transactions].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'created_at') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return mul * (Number(a.total_amount) - Number(b.total_amount));
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const revenueToday = transactions
    .filter((t) => new Date(t.created_at) >= todayStart)
    .reduce((sum, t) => sum + Number(t.total_amount), 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  useEffect(() => {
    if (!printTransaction || !printAreaRef.current) return;
    const t = setTimeout(() => {
      window.print();
      setPrintTransaction(null);
    }, 150);
    return () => clearTimeout(t);
  }, [printTransaction]);

  const handlePrintReceipt = (row: TransactionRow) => setPrintTransaction(row);

  const receiptTransaction = receiptId ? transactions.find((t) => t.id === receiptId) : null;
  const receiptItems = receiptTransaction?.items_json as Array<{ name?: string; price?: number; quantity?: number }> | undefined;

  function formatItemsSummary(items: unknown): string {
    const arr = Array.isArray(items) ? items : [];
    if (arr.length === 0) return '—';
    const parts = arr.slice(0, 3).map((it: { name?: string; quantity?: number }) => `${it.name ?? 'Item'}${(it.quantity ?? 1) > 1 ? ` × ${it.quantity}` : ''}`);
    return arr.length > 3 ? `${parts.join(', ')} +${arr.length - 3} more` : parts.join(', ');
  }

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sales History</h1>
          <p className="text-gray-400">View and manage past transactions.</p>
        </header>

        <div className="mb-8">
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-xl bg-gray-800 border border-gray-700">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue Today</p>
              <p className="text-2xl font-bold text-white">{revenueToday.toFixed(2)} {settings.currency}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/80">
                  <th className="text-left text-gray-400 font-medium px-6 py-4">
                    <button type="button" onClick={() => toggleSort('created_at')} className="hover:text-white transition-colors">
                      Date {sortKey === 'created_at' && (sortDir === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Client</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Staff</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Items</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">
                    <button type="button" onClick={() => toggleSort('total_amount')} className="hover:text-white transition-colors">
                      Total {sortKey === 'total_amount' && (sortDir === 'desc' ? '↓' : '↑')}
                    </button>
                  </th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Status</th>
                  <th className="text-right text-gray-400 font-medium px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-16">No transactions yet.</td>
                  </tr>
                ) : (
                  sorted.map((row) => (
                    <tr key={row.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4 text-gray-300">{formatTableDate(row.created_at)}</td>
                      <td className="px-6 py-4 text-white">{row.client_name?.trim() || 'Walk-in'}</td>
                      <td className="px-6 py-4 text-gray-300">{getStaffName(row)}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate" title={formatItemsSummary(row.items_json)}>{formatItemsSummary(row.items_json)}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">{Number(row.total_amount).toFixed(2)} {settings.currency}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/40">Paid</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => setReceiptId(row.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm">
                            <Receipt className="w-4 h-4" /> View Receipt
                          </button>
                          <button type="button" onClick={() => handlePrintReceipt(row)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm" aria-label="Print receipt">
                            <Printer className="w-4 h-4" /> Print Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden printable receipt */}
      <div ref={printAreaRef} id="receipt-print-area" className="fixed left-[-9999px] top-0 w-[280px] bg-white text-black p-6 font-sans" style={{ display: printTransaction ? 'block' : 'none' }}>
        {printTransaction && (
          <>
            <style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 280px !important; } }`}</style>
            <h2 className="text-xl font-bold text-center border-b border-gray-300 pb-2 mb-4">SalonPro</h2>
            <p className="text-sm text-gray-600 mb-1">{formatTableDate(printTransaction.created_at)}</p>
            <p className="text-sm text-gray-600 mb-1">Client: {printTransaction.client_name?.trim() || 'Walk-in'}</p>
            <p className="text-sm text-gray-600 mb-4">Staff: {getStaffName(printTransaction)}</p>
            <ul className="border-b border-gray-300 pb-3 mb-3 space-y-1 text-sm">
              {(Array.isArray(printTransaction.items_json) ? printTransaction.items_json : []).map((item: { name?: string; price?: number; quantity?: number }, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>{item.name ?? 'Item'} × {item.quantity ?? 1}</span>
                  <span>{Number((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)} {settings.currency}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-semibold text-sm mb-2">
              <span>Total</span>
              <span>{Number(printTransaction.total_amount).toFixed(2)} {settings.currency}</span>
            </div>
            <p className="text-sm text-gray-600">Payment: —</p>
          </>
        )}
      </div>

      {/* Receipt modal */}
      {receiptId && receiptTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setReceiptId(null)} />
          <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Receipt</h3>
            <p className="text-gray-400 text-sm mb-1">{formatTableDate(receiptTransaction.created_at)}</p>
            <p className="text-gray-400 text-sm mb-1">Client: {receiptTransaction.client_name?.trim() || 'Walk-in'}</p>
            <p className="text-gray-400 text-sm mb-4">Staff: {getStaffName(receiptTransaction)}</p>
            {Array.isArray(receiptItems) && receiptItems.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {receiptItems.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name ?? 'Item'} × {item.quantity ?? 1}</span>
                    <span className="text-gray-400">{Number((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)} {settings.currency}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm mb-4">No line items stored.</p>
            )}
            <div className="flex justify-between font-semibold text-white pt-2 border-t border-gray-700">
              <span>Total</span>
              <span className="text-green-400">{Number(receiptTransaction.total_amount).toFixed(2)} {settings.currency}</span>
            </div>
            <button type="button" onClick={() => setReceiptId(null)} className="mt-6 w-full py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
