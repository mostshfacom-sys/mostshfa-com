const fs = require('fs');
const path = require('path');

const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Governorate {
  id         Int        @id @default(autoincrement())
  nameAr     String     @unique @map("name_ar")
  nameEn     String?    @map("name_en")
  cities     City[]
  hospitals  Hospital[]
  clinics    Clinic[]
  labs       Lab[]
  pharmacies Pharmacy[]
  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")
  @@map("governorates")
}

model City {
  id            Int         @id @default(autoincrement())
  governorateId Int         @map("governorate_id")
  governorate   Governorate @relation(fields: [governorateId], references: [id])
  nameAr        String      @map("name_ar")
  nameEn        String?     @map("name_en")
  hospitals     Hospital[]
  clinics       Clinic[]
  labs          Lab[]
  pharmacies    Pharmacy[]
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  @@unique([governorateId, nameAr])
  @@index([governorateId])
  @@map("cities")
}

model HospitalType {
  id          Int        @id @default(autoincrement())
  nameAr      String     @map("name_ar")
  nameEn      String?    @map("name_en")
  slug        String     @unique
  icon        String?
  color       String?
  description String?
  isActive    Boolean    @default(true) @map("is_active")
  order       Int        @default(0)
  hospitals   Hospital[]
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  @@map("hospital_types")
}

model Specialty {
  id        Int        @id @default(autoincrement())
  nameAr    String     @map("name_ar")
  nameEn    String?    @map("name_en")
  slug      String     @unique
  icon      String?
  hospitals Hospital[]
  clinics   Clinic[]
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  @@map("specialties")
}

model Hospital {
  id            Int           @id @default(autoincrement())
  nameAr        String        @map("name_ar")
  nameEn        String?       @map("name_en")
  slug          String        @unique
  typeId        Int?          @map("type_id")
  type          HospitalType? @relation(fields: [typeId], references: [id])
  governorateId Int?          @map("governorate_id")
  governorate   Governorate?  @relation(fields: [governorateId], references: [id])
  cityId        Int?          @map("city_id")
  city          City?         @relation(fields: [cityId], references: [id])
  address       String?
  phone         String?
  whatsapp      String?
  website       String?
  facebook      String?
  logo          String?
  description   String?
  hasEmergency  Boolean       @default(false) @map("has_emergency")
  isFeatured    Boolean       @default(false) @map("is_featured")
  ratingAvg     Float         @default(0) @map("rating_avg")
  ratingCount   Int           @default(0) @map("rating_count")
  lat           Float?
  lng           Float?
  specialties   Specialty[]
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  @@index([governorateId])
  @@index([cityId])
  @@index([typeId])
  @@map("hospitals")
}

model Clinic {
  id            Int          @id @default(autoincrement())
  nameAr        String       @map("name_ar")
  nameEn        String?      @map("name_en")
  slug          String       @unique
  descriptionAr String?      @map("description_ar")
  phone         String?
  whatsapp      String?
  email         String?
  website       String?
  facebook      String?
  logo          String?
  governorateId Int?         @map("governorate_id")
  governorate   Governorate? @relation(fields: [governorateId], references: [id])
  cityId        Int?         @map("city_id")
  city          City?        @relation(fields: [cityId], references: [id])
  addressAr     String?      @map("address_ar")
  lat           Float?
  lng           Float?
  hours         String?
  isOpen        Boolean      @default(true) @map("is_open")
  isFeatured    Boolean      @default(false) @map("is_featured")
  ratingAvg     Float        @default(0) @map("rating_avg")
  ratingCount   Int          @default(0) @map("rating_count")
  status        String       @default("published")
  specialties   Specialty[]
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  @@index([governorateId])
  @@index([cityId])
  @@map("clinics")
}

model Lab {
  id              Int          @id @default(autoincrement())
  nameAr          String       @map("name_ar")
  nameEn          String?      @map("name_en")
  slug            String       @unique
  descriptionAr   String?      @map("description_ar")
  phone           String?
  whatsapp        String?
  email           String?
  website         String?
  facebook        String?
  logo            String?
  governorateId   Int?         @map("governorate_id")
  governorate     Governorate? @relation(fields: [governorateId], references: [id])
  cityId          Int?         @map("city_id")
  city            City?        @relation(fields: [cityId], references: [id])
  addressAr       String?      @map("address_ar")
  lat             Float?
  lng             Float?
  hasHomeSampling Boolean      @default(false) @map("has_home_sampling")
  hours           String?
  isOpen          Boolean      @default(true) @map("is_open")
  isFeatured      Boolean      @default(false) @map("is_featured")
  ratingAvg       Float        @default(0) @map("rating_avg")
  ratingCount     Int          @default(0) @map("rating_count")
  status          String       @default("published")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  @@index([governorateId])
  @@index([cityId])
  @@map("labs")
}

model Pharmacy {
  id                 Int          @id @default(autoincrement())
  nameAr             String       @map("name_ar")
  nameEn             String?      @map("name_en")
  slug               String       @unique
  descriptionAr      String?      @map("description_ar")
  phone              String?
  whatsapp           String?
  email              String?
  website            String?
  facebook           String?
  logo               String?
  governorateId      Int?         @map("governorate_id")
  governorate        Governorate? @relation(fields: [governorateId], references: [id])
  cityId             Int?         @map("city_id")
  city               City?        @relation(fields: [cityId], references: [id])
  addressAr          String?      @map("address_ar")
  lat                Float?
  lng                Float?
  hasDeliveryService Boolean      @default(false) @map("has_delivery_service")
  hours              String?
  isOpen             Boolean      @default(true) @map("is_open")
  isFeatured         Boolean      @default(false) @map("is_featured")
  is24h              Boolean      @default(false) @map("is_24h")
  ratingAvg          Float        @default(0) @map("rating_avg")
  ratingCount        Int          @default(0) @map("rating_count")
  status             String       @default("published")
  createdAt          DateTime     @default(now()) @map("created_at")
  updatedAt          DateTime     @updatedAt @map("updated_at")
  @@index([governorateId])
  @@index([cityId])
  @@map("pharmacies")
}

model DrugCategory {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  legacyId  Int?     @map("legacy_id")
  drugs     Drug[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("drug_categories")
}

model Drug {
  id                Int           @id @default(autoincrement())
  categoryId        Int?          @map("category_id")
  category          DrugCategory? @relation(fields: [categoryId], references: [id])
  legacyId          Int?          @map("legacy_id")
  nameAr            String        @map("name_ar")
  nameEn            String?       @map("name_en")
  slug              String        @unique
  image             String?
  usage             String?
  contraindications String?
  dosage            String?
  activeIngredient  String?       @map("active_ingredient")
  disclaimer        String?
  priceText         String?       @map("price_text")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")
  @@index([categoryId])
  @@map("drugs")
}
`;

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Delete existing file if exists
if (fs.existsSync(schemaPath)) {
  fs.unlinkSync(schemaPath);
  console.log('Deleted existing schema.prisma');
}

// Write new file
fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Created new schema.prisma at:', schemaPath);

// Verify
const content = fs.readFileSync(schemaPath, 'utf8');
console.log('File size:', content.length, 'bytes');
console.log('First 100 chars:', content.substring(0, 100));
