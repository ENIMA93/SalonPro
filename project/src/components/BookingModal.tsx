import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type Service, type Staff, type Client } from '../lib/supabase';
import CompletionSaleModal from './CompletionSaleModal';
import ClientNameInput from './ClientNameInput';
import ClientContactModal from './ClientContactModal';
import ExistingClientNotice from './ExistingClientNotice';

export type EditingAppointment = {
  id: string;
  client_name: string;
  service_id: string;
  staff_id: string;
  date_time: string;
  status: string;
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingAppointment?: EditingAppointment | null;
}

const STATUS_OPTIONS = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;

export default function BookingModal({ isOpen, onClose, onSuccess, editingAppointment = null }: BookingModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [showProductPrompt, setShowProductPrompt] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [existingClientInBooking, setExistingClientInBooking] = useState<Client | null>(null);
  const [isSamePersonInBooking, setIsSamePersonInBooking] = useState(true);

  const isEdit = !!editingAppointment;

  const toDateTimeLocal = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editingAppointment) {
        setClientName(editingAppointment.client_name);
        setServiceId(editingAppointment.service_id);
        setStaffId(editingAppointment.staff_id);
        setDateTime(toDateTimeLocal(editingAppointment.date_time));
        setStatus(editingAppointment.status);
      } else {
        setClientName('');
        setServiceId('');
        setStaffId('');
        setStatus('scheduled');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setDateTime(now.toISOString().slice(0, 16));
      }
      const fetch = async () => {
        setLoading(true);
        const [svcRes, stfRes] = await Promise.all([
          supabase.from('services').select('*').order('name'),
          supabase.from('staff').select('*').eq('is_active', true).order('name'),
        ]);
        setServices(svcRes.data || []);
        setStaff(stfRes.data || []);
        if (!editingAppointment) {
          setServiceId(svcRes.data?.[0]?.id ?? '');
          setStaffId(stfRes.data?.[0]?.id ?? '');
        }
        setLoading(false);
      };
      fetch();
    }
  }, [isOpen, editingAppointment]);

  useEffect(() => {
    if (!isOpen) {
      setExistingClientInBooking(null);
      setIsSamePersonInBooking(true);
      return;
    }
    const name = clientName.trim();
    if (!name || name.length < 2) {
      setExistingClientInBooking(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('clients')
      .select('id, name, phone, email, created_at')
      .eq('name', name)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setExistingClientInBooking(data as Client);
        else if (!cancelled) setExistingClientInBooking(null);
      });
    return () => { cancelled = true; };
  }, [isOpen, clientName]);

  const doUpdateAppointment = async (): Promise<boolean> => {
    const payload = {
      client_name: clientName.trim(),
      service_id: serviceId,
      staff_id: staffId,
      date_time: new Date(dateTime).toISOString(),
      status: isEdit ? status : 'scheduled',
    };
    if (isEdit && editingAppointment) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', editingAppointment.id);
      if (updateError) {
        setError(updateError.message);
        return false;
      }
    }
    onSuccess();
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !serviceId || !staffId || !dateTime) {
      setError('Please fill all fields');
      return;
    }
    if (isEdit && editingAppointment && status === 'completed' && editingAppointment.status !== 'completed') {
      setShowProductPrompt(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      client_name: clientName.trim(),
      service_id: serviceId,
      staff_id: staffId,
      date_time: new Date(dateTime).toISOString(),
      status: isEdit ? status : 'scheduled',
    };
    if (isEdit && editingAppointment) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', editingAppointment.id);
      setSubmitting(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('appointments').insert(payload);
      setSubmitting(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
    }
    onSuccess();
    onClose();
  };

  const handleProductPromptNo = async () => {
    setShowProductPrompt(false);
    setSubmitting(true);
    setError(null);
    const ok = await doUpdateAppointment();
    setSubmitting(false);
    if (ok) setShowContactModal(true);
    else onClose();
  };

  const handleProductPromptYes = () => {
    setShowProductPrompt(false);
    setShowSaleModal(true);
  };

  const handleSaleModalSuccess = async () => {
    setSubmitting(true);
    setError(null);
    const ok = await doUpdateAppointment();
    if (ok) {
      setShowSaleModal(false);
      setSubmitting(false);
      setShowContactModal(true);
      return;
    }
    setShowSaleModal(false);
    setSubmitting(false);
  };

  const handleContactModalClose = () => {
    setShowContactModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <CompletionSaleModal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onSuccess={handleSaleModalSuccess}
        clientName={clientName.trim()}
        defaultStaffId={staffId}
      />
      <ClientContactModal
        isOpen={showContactModal}
        onClose={handleContactModalClose}
        clientName={clientName.trim()}
        onSaved={() => onSuccess()}
      />
      {showProductPrompt && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowProductPrompt(false)} />
          <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm mx-4 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Complete appointment</h3>
            <p className="text-gray-400 text-sm mb-6">Did the client purchase any product?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleProductPromptNo}
                className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium"
              >
                No, skip
              </button>
              <button
                type="button"
                onClick={handleProductPromptYes}
                className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium"
              >
                Yes, add from POS
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{isEdit ? 'Edit Booking' : 'New Booking'}</h2>
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
              <ClientNameInput
                value={clientName}
                onChange={setClientName}
                placeholder="Enter client name"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              {existingClientInBooking && (
                <ExistingClientNotice
                  existingClient={existingClientInBooking}
                  isSamePerson={isSamePersonInBooking}
                  onSamePersonChange={setIsSamePersonInBooking}
                  checkboxLabel="This is the same client we have in the system"
                />
              )}
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
            {isEdit && (
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-gray-800">
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                {isEdit ? 'Save' : 'Book'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </>
  );
}