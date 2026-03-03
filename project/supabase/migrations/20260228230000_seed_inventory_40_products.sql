-- Seed 40 sample inventory products (add to existing data; does not clear the table)
INSERT INTO public.inventory (product_name, stock_count, price, gender, category)
SELECT v.product_name, v.stock_count, v.price, v.gender, v.category
FROM (VALUES
  ('Shampoo Repair', 12, 45, 'all', 'hair'),
  ('Conditioner Hydrating', 10, 52, 'all', 'hair'),
  ('Hair Mask Keratin', 8, 78, 'women', 'hair'),
  ('Hair Oil Argan', 15, 65, 'women', 'hair'),
  ('Styling Gel Strong Hold', 20, 28, 'men', 'hair'),
  ('Hair Spray Volume', 14, 35, 'women', 'hair'),
  ('Color Cream Dark Brown', 6, 95, 'women', 'hair'),
  ('Bleach Powder', 4, 42, 'women', 'hair'),
  ('Facial Cleanser', 18, 38, 'women', 'face'),
  ('Moisturizer SPF 30', 22, 58, 'women', 'face'),
  ('Face Mask Clay', 9, 32, 'women', 'face'),
  ('Serum Vitamin C', 7, 72, 'women', 'face'),
  ('Eye Cream', 11, 48, 'women', 'face'),
  ('Sunscreen Face', 16, 44, 'women', 'face'),
  ('Hand Cream', 25, 22, 'women', 'hand'),
  ('Nail Polish Red', 30, 15, 'women', 'nails'),
  ('Nail Polish Nude', 28, 15, 'women', 'nails'),
  ('Base Coat', 12, 18, 'women', 'nails'),
  ('Cuticle Oil', 14, 20, 'women', 'nails'),
  ('Nail File Pack', 40, 8, 'women', 'nails'),
  ('Body Lotion', 19, 36, 'women', 'body'),
  ('Body Scrub', 8, 42, 'women', 'body'),
  ('Shower Gel', 24, 26, 'women', 'body'),
  ('Deodorant Roll-on', 20, 18, 'all', 'body'),
  ('Razor Blades Pack', 15, 25, 'men', 'body'),
  ('After Shave Balm', 10, 34, 'men', 'face'),
  ('Beard Oil', 6, 40, 'men', 'hair'),
  ('Kids Shampoo', 12, 22, 'kids', 'hair'),
  ('Kids Detangler', 9, 26, 'kids', 'hair'),
  ('Baby Lotion', 11, 28, 'kids', 'body'),
  ('Lip Balm', 35, 12, 'women', 'face'),
  ('Makeup Remover', 13, 30, 'women', 'face'),
  ('Toner', 10, 36, 'women', 'face'),
  ('Exfoliating Gloves', 18, 14, 'women', 'body'),
  ('Hair Brush', 8, 32, 'all', 'hair'),
  ('Comb Set', 22, 10, 'all', 'hair'),
  ('Hair Clips Pack', 30, 8, 'women', 'hair'),
  ('Headband', 15, 12, 'women', 'hair'),
  ('Cotton Pads', 25, 6, 'women', 'face'),
  ('Disposable Gloves', 50, 5, 'all', 'other')
) AS v(product_name, stock_count, price, gender, category)
WHERE NOT EXISTS (
  -- Per-row check: skip only this product_name if it already exists in inventory (adds the rest).
  SELECT 1 FROM public.inventory i
  WHERE i.product_name = v.product_name
);
