-- RPC to insert inventory as a workaround when direct INSERT is blocked by RLS/GRANT.
-- Runs with SECURITY DEFINER so it uses the function owner's privileges.

CREATE OR REPLACE FUNCTION public.insert_inventory_item(
  p_product_name text,
  p_stock_count integer DEFAULT 0,
  p_price numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.inventory (product_name, stock_count, price)
  VALUES (p_product_name, p_stock_count, p_price)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_inventory_item(text, integer, numeric) TO anon, authenticated;

-- Update and delete via RPC (same RLS/GRANT workaround)
CREATE OR REPLACE FUNCTION public.update_inventory_item(
  p_id uuid,
  p_product_name text,
  p_stock_count integer,
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventory
  SET product_name = p_product_name, stock_count = p_stock_count, price = p_price
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_inventory_item(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.inventory WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_inventory_item(uuid, text, integer, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_inventory_item(uuid) TO anon, authenticated;
