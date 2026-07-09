INSERT INTO customization_categories (name) VALUES
('Exterior Colour'),
('Interior Package'),
('Wheel Package'),
('Technology Package');

INSERT INTO customization_options (category_id, name, price_delta)
SELECT id, 'Pearl White', 1200.00 FROM customization_categories WHERE name = 'Exterior Colour';

INSERT INTO customization_options (category_id, name, price_delta)
SELECT id, 'Black Leather Interior', 2500.00 FROM customization_categories WHERE name = 'Interior Package';

INSERT INTO customization_options (category_id, name, price_delta)
SELECT id, '21-inch Sport Wheels', 3000.00 FROM customization_categories WHERE name = 'Wheel Package';

INSERT INTO customization_options (category_id, name, price_delta)
SELECT id, 'Advanced Driver Assistance Package', 4500.00 FROM customization_categories WHERE name = 'Technology Package';

INSERT INTO vehicles
    (name, description, brand, model, model_year, condition, body_style,
     colour_exterior, colour_interior, interior_fabric,
     range_km, battery_kwh, horsepower, seating_capacity,
     price, mileage_km, quantity, is_hot_deal, hot_deal_price)
VALUES
('Tesla Model X', 'A luxury electric SUV built for utility and performance.',
 'Tesla', 'Model X', 2024, 'new', 'SUV',
 'Pearl White', 'Black', 'Leather',
 560, 100.0, 670, 7,
 87000.00, 0, 5, FALSE, NULL),

('Tesla Model Y', 'A fully electric mid-size SUV with strong range and practicality.',
 'Tesla', 'Model Y', 2024, 'new', 'SUV',
 'Midnight Silver', 'White', 'Vegan Leather',
 533, 75.0, 456, 5,
 59990.00, 0, 8, FALSE, NULL),

('Porsche Taycan', 'A performance electric sedan with premium design.',
 'Porsche', 'Taycan', 2023, 'new', 'Sedan',
 'Frozen Blue', 'Black', 'Leather',
 503, 93.4, 670, 4,
 133000.00, 0, 3, FALSE, NULL),

('Rivian R1T', 'An electric adventure truck built for outdoor capability.',
 'Rivian', 'R1T', 2023, 'new', 'Truck',
 'Forest Green', 'Dark', 'Leather',
 505, 135.0, 835, 5,
 73000.00, 0, 4, TRUE, 69900.00),

('Chevrolet Bolt EUV', 'Affordable everyday electric vehicle.',
 'Chevrolet', 'Bolt EUV', 2022, 'used', 'Hatchback',
 'Bright Blue', 'Grey', 'Cloth',
 397, 65.0, 200, 5,
 28500.00, 24000, 2, TRUE, 26500.00),

('BMW iX', 'Luxury electric SAV with long range and advanced technology.',
 'BMW', 'iX', 2024, 'new', 'SUV',
 'Sophisto Grey', 'Mocha', 'Leather',
 621, 111.5, 610, 5,
 112000.00, 0, 3, FALSE, NULL),

('Ford Mustang Mach-E', 'Electric SUV inspired by Mustang performance.',
 'Ford', 'Mustang Mach-E', 2023, 'used', 'SUV',
 'Rapid Red', 'Ebony', 'Cloth',
 490, 91.0, 346, 5,
 42000.00, 15000, 2, FALSE, NULL),

('Hyundai Ioniq 6', 'Aerodynamic electric sedan with ultra-fast charging.',
 'Hyundai', 'Ioniq 6', 2024, 'new', 'Sedan',
 'Gravity Gold', 'Dark', 'Eco-Suede',
 614, 77.4, 320, 5,
 48000.00, 0, 6, FALSE, NULL);

 INSERT INTO vehicle_history_reports
    (vehicle_id, has_accidents, accident_count, accident_details, previous_owners)
SELECT id, TRUE, 1, 'Minor rear-end collision repaired at certified shop.', 1
FROM vehicles WHERE model = 'Bolt EUV' LIMIT 1;

INSERT INTO vehicle_history_reports
    (vehicle_id, has_accidents, accident_count, previous_owners)
SELECT id, FALSE, 0, 1
FROM vehicles WHERE model = 'Mustang Mach-E' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '1.23.4.5', id, 'view' FROM vehicles WHERE model = 'Model X' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '1.23.4.5', id, 'cart' FROM vehicles WHERE model = 'Model X' LIMIT 1;

INSERT INTO usage_events (ip_address, vehicle_id, event_type)
SELECT '9.8.7.6', id, 'view' FROM vehicles WHERE model = 'Taycan' LIMIT 1;