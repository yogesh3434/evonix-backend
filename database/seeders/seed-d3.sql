INSERT INTO vehicle_customizations (vehicle_id, option_id)
SELECT v.id, o.id
FROM vehicles v
CROSS JOIN customization_options o
WHERE v.condition = 'new'
ON CONFLICT DO NOTHING;

INSERT INTO customization_options (category_id, name, price_delta)
SELECT id, 'Midnight Black', 900.00 FROM customization_categories WHERE name = 'Exterior Colour'
UNION ALL
SELECT id, 'White Vegan Leather Interior', 1800.00 FROM customization_categories WHERE name = 'Interior Package'
UNION ALL
SELECT id, '19-inch Aero Wheels', 0.00 FROM customization_categories WHERE name = 'Wheel Package'
UNION ALL
SELECT id, 'Premium Audio Package', 2200.00 FROM customization_categories WHERE name = 'Technology Package';

INSERT INTO vehicle_customizations (vehicle_id, option_id)
SELECT v.id, o.id
FROM vehicles v
CROSS JOIN customization_options o
WHERE v.condition = 'new'
ON CONFLICT DO NOTHING;

INSERT INTO usage_events (ip_address, vehicle_id, event_type, search_term)
SELECT '1.23.4.5', id, 'search', 'model y' FROM vehicles WHERE model = 'Model Y' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type, search_term)
SELECT '4.5.6.7', id, 'search', 'model y' FROM vehicles WHERE model = 'Model Y' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type, search_term)
SELECT '9.8.7.6', NULL, 'search', 'electric truck' FROM vehicles LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '1.23.4.5', id, 'compare' FROM vehicles WHERE model = 'Model Y' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '9.8.7.6', id, 'compare' FROM vehicles WHERE model = 'Taycan' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '4.5.6.7', id, 'view' FROM vehicles WHERE model = 'Model Y' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '4.5.6.7', id, 'chatbot' FROM vehicles WHERE model = 'R1T' LIMIT 1;
