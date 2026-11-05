-- Packed (shipping box) size and weight per product, so a shipment can be booked without typing them in.
alter table public.products
  add column pkg_length_cm numeric(6,1) check (pkg_length_cm > 0),
  add column pkg_breadth_cm numeric(6,1) check (pkg_breadth_cm > 0),
  add column pkg_height_cm numeric(6,1) check (pkg_height_cm > 0),
  add column pkg_weight_kg numeric(6,2) check (pkg_weight_kg > 0);

-- Starting estimates per category for products that have no box size yet. Edit any product in Admin → Products.
update public.products p set
  pkg_length_cm = d.l, pkg_breadth_cm = d.b, pkg_height_cm = d.h, pkg_weight_kg = d.w
from (values
  ('sofas',   200, 95, 85,  55),
  ('beds',    210, 165, 35, 85),
  ('dining',  165, 95, 80,  100),
  ('chairs',  85,  80, 100, 20),
  ('tables',  120, 65, 50,  25),
  ('storage', 180, 50, 65,  55),
  ('study',   125, 65, 45,  30)
) as d(cat, l, b, h, w)
where p.category_slug = d.cat and p.pkg_weight_kg is null;
