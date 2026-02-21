import { useEffect, useState } from 'react';
import { X, Loader2, UserCircle } from 'lucide-react';
import { supabase, type Client as ClientType } from '../lib/supabase';
import { normalizePhone, getPhoneError, getEmailError } from '../lib/validation';
import ExistingClientNotice from './ExistingClientNotice';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: ClientType | null;
}

export default function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingClientByName, setExistingClientByName] = useState<ClientType | null>(null);
  const [isSamePersonInAdd, setIsSamePersonInAdd] = useState(true);

  const isEdit = !!client;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setExistingClientByName(null);
    setIsSamePersonInAdd(true);
    if (client) {
      setName(client.name);
      setPhone(client.phone ?? '');
      setEmail(client.email ?? '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
    }
  }, [isOpen, client]);

  useEffect(() => {
    if (!isOpen || isEdit || !name.trim() || name.trim().length < 2) {
      setExistingClientByName(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('clients')
      .select('id, name, phone, email, created_at')
      .eq('name', name.trim())
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setExistingClientByName(data as ClientType);
        else if (!cancelled) setExistingClientByName(null);
      });
    return () => { cancelled = true; };
  }, [isOpen, isEdit, name]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
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

    const phoneVal = phone.trim();
    const emailVal = email.trim();
    const payload = {
      name: name.trim(),
      phone: phoneVal ? normalizePhone(phoneVal) : null,
      email: emailVal || null,
    };

    setSubmitting(true);
    setError(null);

    if (emailVal) {
      const { data: existingByEmail } = await supabase
        .from('clients')
        .select('id')
        .ilike('email', emailVal)
        .limit(1)
        .maybeSingle();
      if (existingByEmail && (isEdit ? existingByEmail.id !== client!.id : true)) {
        setSubmitting(false);
        setError('This email is already used by another client.');
        return;
      }
    }

    if (isEdit && client) {
      const { error: updateError } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', client.id);
      setSubmitting(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      if (existingClientByName && isSamePersonInAdd) {
        const { error: updateError } = await supabase
          .from('clients')
          .update(payload)
          .eq('id', existingClientByName.id);
        setSubmitting(false);
        if (updateError) {
          setError(updateError.message);
          return;
        }
      } else {
        const { error: insertError } = await supabase.from('clients').insert(payload);
        setSubmitting(false);
        if (insertError) {
          setError(insertError.message);
          return;
        }
      }
    }
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <UserCircle className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Edit Client' : 'Add Client'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Maria Garcia"
            />
            {!isEdit && existingClientByName && (
              <ExistingClientNotice
                existingClient={existingClientByName}
                isSamePerson={isSamePersonInAdd}
                onSamePersonChange={(same) => {
                  setIsSamePersonInAdd(same);
                  if (same) {
                    setPhone(existingClientByName.phone ?? '');
                    setEmail(existingClientByName.email ?? '');
                  } else {
                    setPhone('');
                    setEmail('');
                  }
                }}
                checkboxLabel="This is the same person (update their info)"
              />
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="+212612345678 (9 digits)"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g. maria@example.com"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
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
              {isEdit ? 'Save' : existingClientByName && isSamePersonInAdd ? 'Update client' : existingClientByName && !isSamePersonInAdd ? 'Create new client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
