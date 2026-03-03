-- Set gender = 'women' for products typically targeted at women in salon/beauty
UPDATE public.inventory
SET gender = 'women'
WHERE product_name IN (
  -- Nails
  'Nail Polish Red',
  'Nail Polish Nude',
  'Base Coat',
  'Cuticle Oil',
  'Nail File Pack',
  -- Makeup / face
  'Makeup Remover',
  'Facial Cleanser',
  'Moisturizer SPF 30',
  'Face Mask Clay',
  'Serum Vitamin C',
  'Eye Cream',
  'Sunscreen Face',
  'Toner',
  'Lip Balm',
  'Cotton Pads',
  -- Hair (color, treatment, accessories)
  'Color Cream Dark Brown',
  'Bleach Powder',
  'Hair Mask Keratin',
  'Hair Oil Argan',
  'Hair Spray Volume',
  'Hair Clips Pack',
  'Headband',
  -- Body / hand
  'Hand Cream',
  'Body Lotion',
  'Body Scrub',
  'Shower Gel',
  'Exfoliating Gloves'
);
