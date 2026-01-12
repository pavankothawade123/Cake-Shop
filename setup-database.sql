-- Cake Shop Database Setup SQL
-- Run this in your Neon SQL Editor or any PostgreSQL client

-- Create enums
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'BAKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "DeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- Create tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "deliveryAddress" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "deliveryTimeSlot" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'MOCK',
    "isRefunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "flavor" TEXT,
    "frosting" TEXT,
    "isEggless" BOOLEAN NOT NULL DEFAULT false,
    "customMessage" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE UNIQUE INDEX "reviews_productId_userId_key" ON "reviews"("productId", "userId");

-- Create foreign keys
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert sample categories
INSERT INTO "categories" ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Birthday Cakes', 'birthday-cakes', 'Celebration cakes for birthdays', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Wedding Cakes', 'wedding-cakes', 'Elegant cakes for weddings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Custom Cakes', 'custom-cakes', 'Fully customized cakes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample products
INSERT INTO "products" ("id", "name", "slug", "description", "basePrice", "images", "isAvailable", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Chocolate Dream Cake',
    'chocolate-dream-cake',
    'Rich chocolate cake layered with smooth chocolate ganache frosting. Perfect for chocolate lovers!',
    45.00,
    ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'],
    true,
    (SELECT "id" FROM "categories" WHERE "slug" = 'birthday-cakes' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

INSERT INTO "products" ("id", "name", "slug", "description", "basePrice", "images", "isAvailable", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Vanilla Elegance',
    'vanilla-elegance',
    'Classic vanilla sponge cake with buttercream frosting. Simple yet delicious!',
    40.00,
    ARRAY['https://images.unsplash.com/photo-1588195538326-c5b1e5b80902?w=800&q=80'],
    true,
    (SELECT "id" FROM "categories" WHERE "slug" = 'birthday-cakes' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

INSERT INTO "products" ("id", "name", "slug", "description", "basePrice", "images", "isAvailable", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Strawberry Delight',
    'strawberry-delight',
    'Fresh strawberry cake with cream cheese frosting and strawberry compote filling.',
    50.00,
    ARRAY['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80'],
    true,
    (SELECT "id" FROM "categories" WHERE "slug" = 'birthday-cakes' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

INSERT INTO "products" ("id", "name", "slug", "description", "basePrice", "images", "isAvailable", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Red Velvet Romance',
    'red-velvet-romance',
    'Luxurious red velvet cake with traditional cream cheese frosting.',
    55.00,
    ARRAY['https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&q=80'],
    true,
    (SELECT "id" FROM "categories" WHERE "slug" = 'wedding-cakes' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

INSERT INTO "products" ("id", "name", "slug", "description", "basePrice", "images", "isAvailable", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Funfetti Celebration',
    'funfetti-celebration',
    'Colorful vanilla cake with rainbow sprinkles and vanilla buttercream. Perfect for parties!',
    42.00,
    ARRAY['https://images.unsplash.com/photo-1562440499-64c9a74f0b65?w=800&q=80'],
    true,
    (SELECT "id" FROM "categories" WHERE "slug" = 'birthday-cakes' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

INSERT INTO "products" ("id", "name", "slug", "description", "basePrice", "images", "isAvailable", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Tiramisu Tower',
    'tiramisu-tower',
    'Italian-inspired coffee-soaked sponge with mascarpone cream layers.',
    60.00,
    ARRAY['https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80'],
    true,
    (SELECT "id" FROM "categories" WHERE "slug" = 'custom-cakes' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Success message
SELECT 'Database setup completed successfully! 🎉' as status;
