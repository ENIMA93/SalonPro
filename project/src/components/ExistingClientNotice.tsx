import { UserCheck } from 'lucide-react';
import type { Client } from '../lib/supabase';

interface ExistingClientNoticeProps {
  existingClient: Client;
  isSamePerson: boolean;
  onSamePersonChange: (same: boolean) => void;
  checkboxLabel?: string;
  compact?: boolean;
}

export default function ExistingClientNotice({
  existingClient,
  isSamePerson,
  onSamePersonChange,
  checkboxLabel = 'This is the same client we have in the system',
  compact = false,
}: ExistingClientNoticeProps) {
  return (
    <div className={`rounded-lg border border-gray-600 bg-gray-900/80 ${compact ? 'p-3' : 'p-4'} mt-2`}>
      <div className="flex items-center gap-2 text-purple-300 mb-2">
        <UserCheck className="w-4 h-4 shrink-0" />
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Current info in system</span>
      </div>
      <p className={`text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="text-gray-500">Phone:</span> {existingClient.phone || '—'}
      </p>
      <p className={`text-gray-300 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="text-gray-500">Email:</span> {existingClient.email || '—'}
      </p>
      <label className="flex items-center gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isSamePerson}
          onChange={(e) => onSamePersonChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
        />
        <span className={`text-white ${compact ? 'text-xs' : 'text-sm'}`}>{checkboxLabel}</span>
      </label>
    </div>
  );
}
