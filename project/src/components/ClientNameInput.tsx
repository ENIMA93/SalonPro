import { useEffect, useState, useRef } from 'react';
import { supabase, type Client } from '../lib/supabase';

interface ClientNameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function ClientNameInput({
  value,
  onChange,
  placeholder = 'Enter client name',
  className = '',
  id,
}: ClientNameInputProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('id, name, phone, email, created_at').order('name');
    setClients(data || []);
    setLoading(false);
  };

  const filtered = value.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(value.trim().toLowerCase()))
    : clients;
  const hasSuggestions = filtered.length > 0;

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    fetchClients();
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setShowSuggestions(false);
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions && hasSuggestions}
      />
      {showSuggestions && (
        <ul
          className="absolute z-[200] w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-auto py-1"
          role="listbox"
        >
          {loading ? (
            <li className="px-4 py-2 text-gray-400 text-sm">Loading...</li>
          ) : !hasSuggestions ? (
            <li className="px-4 py-2 text-gray-500 text-sm">No clients match</li>
          ) : (
            filtered.slice(0, 20).map((c) => (
              <li
                key={c.id}
                role="option"
                tabIndex={-1}
                className="px-4 py-2 cursor-pointer text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(c.name);
                }}
              >
                <span className="font-medium">{c.name}</span>
                {(c.phone || c.email) && (
                  <span className="ml-2 text-gray-400 text-sm">
                    {[c.phone, c.email].filter(Boolean).join(' · ')}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
