-- Inventory: add gender and category (type: hair, face, hand, body, etc.)
ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';

COMMENT ON COLUMN public.inventory.gender IS 'Target gender: all, men, women, kids';
COMMENT ON COLUMN public.inventory.category IS 'Product type: hair, face, hand, body, nails, other';

-- Services: add service_type (hair, face, hand, body, nails, etc.)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'other';

COMMENT ON COLUMN public.services.service_type IS 'Service type: hair, face, hand, body, nails, other';

-- Clients: add VIP flag
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;

COMMENT ON COLUMN public.clients.is_vip IS 'VIP client; show star in list';
