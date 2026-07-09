CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE vehicle_condition AS ENUM ('new', 'used');
CREATE TYPE vehicle_status AS ENUM ('available', 'reserved', 'sold', 'inactive');
CREATE TYPE order_status AS ENUM ('pending', 'processed', 'denied', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'denied');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE usage_event_type AS ENUM ('view', 'cart', 'purchase', 'search', 'compare', 'wishlist', 'chatbot');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name  VARCHAR(60),
    last_name   VARCHAR(60),
    email       VARCHAR(255) NOT NULL UNIQUE,
    role        user_role NOT NULL DEFAULT 'customer',
    phone       VARCHAR(20),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Auto-create profile when a Supabase Auth user signs up
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_profile_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();

CREATE TABLE addresses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label       VARCHAR(60),
    street      VARCHAR(120) NOT NULL,
    city        VARCHAR(60) NOT NULL,
    province    VARCHAR(60) NOT NULL,
    country     VARCHAR(60) NOT NULL DEFAULT 'Canada',
    postal_code VARCHAR(20) NOT NULL,
    phone       VARCHAR(20),
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin                 VARCHAR(17) UNIQUE,
    name                VARCHAR(120) NOT NULL,
    description         TEXT,
    brand               VARCHAR(60) NOT NULL,
    model               VARCHAR(60) NOT NULL,
    model_year          SMALLINT NOT NULL,
    condition           vehicle_condition NOT NULL DEFAULT 'new',
    status              vehicle_status NOT NULL DEFAULT 'available',
    body_style          VARCHAR(40),
    colour_exterior     VARCHAR(40),
    colour_interior     VARCHAR(40),
    interior_fabric     VARCHAR(40),
    range_km            INT,
    battery_kwh         NUMERIC(6,2),
    charge_time_hrs     NUMERIC(4,1),
    horsepower          INT,
    seating_capacity    SMALLINT,
    price               NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    mileage_km          INT NOT NULL DEFAULT 0 CHECK (mileage_km >= 0),
    quantity            INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    is_hot_deal         BOOLEAN NOT NULL DEFAULT FALSE,
    hot_deal_price      NUMERIC(12,2) CHECK (hot_deal_price >= 0),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    sold_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE vehicle_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    alt_text    VARCHAR(120),
    is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE vehicle_history_reports (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id           UUID NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
    has_accidents        BOOLEAN NOT NULL DEFAULT FALSE,
    accident_count       SMALLINT NOT NULL DEFAULT 0,
    accident_details     TEXT,
    previous_owners      SMALLINT NOT NULL DEFAULT 0,
    service_records      TEXT,
    last_inspection_date DATE,
    report_url           TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customization_categories (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE customization_options (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID NOT NULL REFERENCES customization_categories(id) ON DELETE CASCADE,
    name            VARCHAR(80) NOT NULL,
    price_delta     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_delta >= 0),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE vehicle_customizations (
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    option_id  UUID NOT NULL REFERENCES customization_options(id) ON DELETE CASCADE,
    PRIMARY KEY (vehicle_id, option_id)
);

CREATE TABLE carts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE cart_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id                 UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    vehicle_id              UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    quantity                INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price              NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    customization_options   JSONB DEFAULT '[]',
    customization_total     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (customization_total >= 0),
    added_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, vehicle_id)
);

CREATE TABLE orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    shipping_address_id     UUID REFERENCES addresses(id),

    status                  order_status NOT NULL DEFAULT 'pending',
    subtotal                NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    tax                     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total                   NUMERIC(12,2) NOT NULL CHECK (total >= 0),

    shipping_name           VARCHAR(120),
    shipping_street         VARCHAR(120),
    shipping_city           VARCHAR(60),
    shipping_province       VARCHAR(60),
    shipping_country        VARCHAR(60),
    shipping_postal_code    VARCHAR(20),
    shipping_phone          VARCHAR(20),

    card_last_four          CHAR(4),
    card_holder_name        VARCHAR(120),
    payment_status          payment_status NOT NULL DEFAULT 'pending',
    payment_attempt_seq     INT NOT NULL DEFAULT 0,

    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vehicle_id              UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    quantity                INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    unit_price              NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    customization_options   JSONB DEFAULT '[]',
    customization_total     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (customization_total >= 0)
);

CREATE TABLE payment_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    attempt_number  INT NOT NULL CHECK (attempt_number >= 1),
    result          payment_status NOT NULL,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(120),
    body        TEXT,
    status      review_status NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (vehicle_id, user_id)
);

CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE usage_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address  INET,
    vehicle_id  UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    event_type  usage_event_type NOT NULL,
    session_id  VARCHAR(120),
    search_term VARCHAR(120),
    user_agent  TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loan_calculations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_price   NUMERIC(12,2) NOT NULL CHECK (vehicle_price >= 0),
    down_payment    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (down_payment >= 0),
    interest_rate   NUMERIC(5,4) NOT NULL CHECK (interest_rate >= 0),
    loan_months     SMALLINT NOT NULL CHECK (loan_months > 0),
    monthly_payment NUMERIC(10,2) NOT NULL CHECK (monthly_payment >= 0),
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chatbot_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_key VARCHAR(120) NOT NULL UNIQUE,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ
);

CREATE TABLE chatbot_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_vehicles_brand ON vehicles(brand);
CREATE INDEX idx_vehicles_model_year ON vehicles(model_year);
CREATE INDEX idx_vehicles_condition ON vehicles(condition);
CREATE INDEX idx_vehicles_body_style ON vehicles(body_style);
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_mileage ON vehicles(mileage_km);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_hot_deal ON vehicles(is_hot_deal) WHERE is_hot_deal = TRUE;
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_vehicle_id ON order_items(vehicle_id);

CREATE INDEX idx_reviews_vehicle_id ON reviews(vehicle_id);
CREATE INDEX idx_reviews_status ON reviews(status);

CREATE INDEX idx_usage_events_vehicle_id ON usage_events(vehicle_id);
CREATE INDEX idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_occurred_at ON usage_events(occurred_at);
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);

CREATE INDEX idx_loan_calculations_user_id ON loan_calculations(user_id);
CREATE INDEX idx_chatbot_sessions_user_id ON chatbot_sessions(user_id);