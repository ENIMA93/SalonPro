import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Staff = {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  gender_category: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  client_name: string;
  service_id: string;
  staff_id: string;
  date_time: string;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  created_at: string;
  services?: Service;
  staff?: Staff;
};

/** Appointment list item returned by Supabase with joined relations */
export type AppointmentListItem = {
  id: string;
  client_name: string;
  date_time: string;
  status: Appointment['status'];
  services?: { name: string } | { name: string }[];
  staff?: { name: string } | { name: string }[];
};

export type Inventory = {
  id: string;
  product_name: string;
  stock_count: number;
  price: number;
  created_at: string;
};
