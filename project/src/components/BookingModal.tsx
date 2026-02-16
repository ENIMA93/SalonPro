import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type Service, type Staff } from '../lib/supabase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ isOpen, onClose, onSuccess }: BookingModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setClientName('');
      setServiceId('');
      setStaffId('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDateTime(now.toISOString().slice(0, 16));
      const fetch = async () => {
        setLoading(true);
        const [svcRes, stfRes] = await Promise.all([
          supabase.from('services').select('*').order('name'),
          supabase.from('staff').select('*').eq('is_active', true).order('name'),
        ]);
        setServices(svcRes.data || []);
        setStaff(stfRes.data || []);
        setServiceId(svcRes.data?.[0]?.id ?? '');
        setStaffId(stfRes.data?.[0]?.id ?? '');
        setLoading(false);
      };
      fetch();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !serviceId || !staffId || !dateTime) {
      setError('Please fill all fields');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('appointments').insert({
      client_name: clientName.trim(),
      service_id: serviceId,
      staff_id: staffId,
      date_time: new Date(dateTime).toISOString(),
      status: 'scheduled',
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">New Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
            )}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Client name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Enter client name"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Service</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price} DH)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Staff</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1">Date & time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Book
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
