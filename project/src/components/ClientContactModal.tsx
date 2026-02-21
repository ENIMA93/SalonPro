import { useState, useEffect } from 'react';
import { X, Loader2, UserCheck, UserPlus } from 'lucide-react';
import { supabase, type Client } from '../lib/supabase';
import { normalizePhone, getPhoneError, getEmailError } from '../lib/validation';

interface ClientContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  onSaved?: () => void;
}

export default function ClientContactModal({
  isOpen,
  onClose,
  clientName,
  onSaved,
}: ClientContactModalProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingClient, setExistingClient] = useState<Client | null>(null);
  const [isSamePerson, setIsSamePerson] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setExistingClient(null);
      setPhone('');
      setEmail('');
      setError(null);
      setIsSamePerson(true);
      return;
    }
    const name = clientName.trim();
    if (!name) return;
    const fetchExisting = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('clients')
        .select('id, name, phone, email, created_at')
        .eq('name', name)
        .limit(1)
        .maybeSingle();
      setLoading(false);
      if (data) {
        setExistingClient(data as Client);
        setPhone(data.phone ?? '');
        setEmail(data.email ?? '');
      } else {
        setExistingClient(null);
      }
    };
    fetchExisting();
  }, [isOpen, clientName]);

  const doUpdate = async () => {
    if (!existingClient) return;
    const phoneVal = phone.trim() ? normalizePhone(phone.trim()) : null;
    const emailVal = email.trim() || null;

    setSaving(true);
    setError(null);
    if (emailVal) {
      const { data: other } = await supabase
        .from('clients')
        .select('id')
        .ilike('email', emailVal)
        .limit(1)
        .maybeSingle();
      if (other && other.id !== existingClient.id) {
        setError('This email is already used by another client.');
        setSaving(false);
        return;
      }
    }
    const updates: { phone?: string | null; email?: string | null } = {};
    if (phoneVal) updates.phone = phoneVal;
    else updates.phone = null;
    if (emailVal) updates.email = emailVal;
    else updates.email = null;
    const { error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', existingClient.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved?.();
    onClose();
  };

  const doInsert = async (name: string, phoneVal: string | null, emailVal: string | null) => {
    setSaving(true);
    setError(null);
    if (emailVal) {
      const { data: other } = await supabase
        .from('clients')
        .select('id')
        .ilike('email', emailVal)
        .limit(1)
        .maybeSingle();
      if (other) {
        setError('This email is already used by another client.');
        setSaving(false);
        return;
      }
    }
    const { error: insertError } = await supabase.from('clients').insert({
      name,
      phone: phoneVal,
      email: emailVal,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved?.();
    onClose();
  };

  const handleConfirmOrUpdate = () => {
    if (!existingClient) return;
    const phoneVal = phone.trim() ? normalizePhone(phone.trim()) : null;
    const emailVal = email.trim() || null;
    const phoneErr = phone.trim() ? getPhoneError(phone) : null;
    const emailErr = email.trim() ? getEmailError(email) : null;
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    if (emailErr) {
      setError(emailErr);
      return;
    }
    doUpdate();
  };

  const handleCreateNew = () => {
    const name = clientName.trim();
    if (!name) return;
    if (!phone.trim() && !email.trim()) {
      setError('Add at least phone or email for the new client.');
      return;
    }
    const phoneErr = getPhoneError(phone);
    const emailErr = getEmailError(email);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const phoneVal = phone.trim() ? normalizePhone(phone.trim()) : null;
    const emailVal = email.trim() || null;
    doInsert(name, phoneVal, emailVal);
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const name = clientName.trim();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={handleSkip} />
        <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm mx-4 p-8 shadow-xl text-center">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Checking client list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleSkip} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white">Client contact</h3>
          <button
            type="button"
            onClick={handleSkip}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {existingClient ? (
          <>
            <p className="text-gray-400 text-sm mb-3">
              We have a client named <span className="text-white font-medium">{name}</span> in the system.
            </p>
            <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-600 mb-4">
              <div className="flex items-center gap-2 text-purple-300 mb-2">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Current info in system</span>
              </div>
              <p className="text-gray-300 text-sm">
                <span className="text-gray-500">Phone:</span> {existingClient.phone || '—'}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                <span className="text-gray-500">Email:</span> {existingClient.email || '—'}
              </p>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isSamePerson}
                onChange={(e) => {
                  setIsSamePerson(e.target.checked);
                  if (e.target.checked) {
                    setPhone(existingClient.phone ?? '');
                    setEmail(existingClient.email ?? '');
                  } else {
                    setPhone('');
                    setEmail('');
                  }
                  setError(null);
                }}
                className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-white text-sm">This is the same person (confirm or update their info)</span>
            </label>

            {isSamePerson ? (
              <>
                <p className="text-gray-400 text-xs mb-2">Update contact below if needed, or leave as is.</p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+212612345678"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                {error && (
                  <div className="mb-3 p-2 bg-red-500/20 text-red-400 rounded text-sm">{error}</div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOrUpdate}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-300/90 mb-2">
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">New client with same name</span>
                </div>
                <p className="text-gray-400 text-xs mb-3">Add phone and/or email for the new client.</p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+212612345678"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                {error && (
                  <div className="mb-3 p-2 bg-red-500/20 text-red-400 rounded text-sm">{error}</div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={saving || (!phone.trim() && !email.trim())}
                    className="flex-1 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Create new client
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">
              Add phone or email for <span className="text-white font-medium">{name}</span> so we can reach them later.
            </p>
            {error && (
              <div className="mb-3 p-2 bg-red-500/20 text-red-400 rounded text-sm">{error}</div>
            )}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212612345678"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!phone.trim() && !email.trim()) {
                    onClose();
                    return;
                  }
                  const phoneErr = getPhoneError(phone);
                  const emailErr = getEmailError(email);
                  if (phoneErr) {
                    setError(phoneErr);
                    return;
                  }
                  if (emailErr) {
                    setError(emailErr);
                    return;
                  }
                  doInsert(name, phone.trim() ? normalizePhone(phone.trim()) : null, email.trim() || null);
                }}
                disabled={saving || (!phone.trim() && !email.trim())}
                className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
