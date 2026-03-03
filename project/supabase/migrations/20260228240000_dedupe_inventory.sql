-- Remove duplicate inventory rows: keep one row per product_name (smallest id), delete the rest.
DELETE FROM public.inventory a
USING public.inventory b
WHERE a.product_name = b.product_name
  AND a.id > b.id;
