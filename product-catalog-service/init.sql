-- Product Catalog Database Initialization

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    weight DECIMAL(8,3),
    dimensions JSONB,
    category_id UUID REFERENCES categories(id),
    sustainability_score INTEGER CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product tags table
CREATE TABLE IF NOT EXISTS product_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, tag)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_sustainability ON products(sustainability_score);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Insert sample categories
INSERT INTO categories (name, description, slug) VALUES 
    ('Electronics', 'Eco-friendly electronic devices', 'electronics'),
    ('Home & Garden', 'Sustainable home and garden products', 'home-garden'),
    ('Clothing', 'Sustainable and ethical clothing', 'clothing'),
    ('Food & Beverages', 'Organic and sustainable food products', 'food-beverages')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, sku, price, category_id, sustainability_score, stock_quantity) 
SELECT 
    'Solar Power Bank', 
    'Portable solar-powered charging device', 
    'SPB-001', 
    49.99, 
    c.id, 
    95, 
    25
FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, sku, price, category_id, sustainability_score, stock_quantity) 
SELECT 
    'Bamboo Phone Case', 
    'Biodegradable phone case made from bamboo', 
    'BPC-001', 
    19.99, 
    c.id, 
    90, 
    50
FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, sku, price, category_id, sustainability_score, stock_quantity) 
SELECT 
    'Organic Cotton T-Shirt', 
    'Fair trade organic cotton t-shirt', 
    'OCT-001', 
    29.99, 
    c.id, 
    85, 
    75
FROM categories c WHERE c.slug = 'clothing'
ON CONFLICT (sku) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecomarket;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecomarket;
