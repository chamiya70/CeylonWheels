-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'PRIVATE_SELLER', 'BUSINESS_DEALER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "dealer_profiles" (
    "dealer_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_reg_no" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "showroom_lat" DOUBLE PRECISION,
    "showroom_lng" DOUBLE PRECISION,

    CONSTRAINT "dealer_profiles_pkey" PRIMARY KEY ("dealer_id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "seller_id" TEXT NOT NULL,
    "seller_type" TEXT NOT NULL,
    "free_listings_left" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("seller_id")
);

-- CreateTable
CREATE TABLE "listings" (
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "video_url" TEXT,
    "type" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "listings_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "image_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "conv_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("conv_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "message_id" TEXT NOT NULL,
    "conv_id" TEXT NOT NULL,
    "text" TEXT,
    "offer_price" DOUBLE PRECISION,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_profiles_business_reg_no_key" ON "dealer_profiles"("business_reg_no");

-- AddForeignKey
ALTER TABLE "dealer_profiles" ADD CONSTRAINT "dealer_profiles_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("seller_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conv_id_fkey" FOREIGN KEY ("conv_id") REFERENCES "conversations"("conv_id") ON DELETE CASCADE ON UPDATE CASCADE;
