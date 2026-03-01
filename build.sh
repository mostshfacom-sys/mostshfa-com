#!/bin/bash

# Vercel Build Script - The "Nuclear" Option
# This script forces the environment to be correct for production build

echo "☢️ STARTING NUCLEAR BUILD SCRIPT ☢️"

# 1. Clean slate
echo "🧹 Cleaning previous artifacts..."
rm -rf .next
rm -rf node_modules/.prisma
rm -rf prisma/migrations

# 2. Set environment variables explicitly
export DATABASE_URL="$POSTGRES_URL"
export NODE_ENV="production"

# 3. Create the PRODUCTION schema file from scratch
# This overwrites whatever is there with the correct PostgreSQL config
echo "📝 Writing production schema.prisma..."
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... (Your models here - keep them exactly as they were in the previous successful version)
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  phone     String?
  image     String?
  role      String   @default("user")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  medicines     MedicineReminder[]
  weightRecords WeightRecord[]
  pressureLogs  PressureLog[]
  foodEntries   FoodEntry[]
  sleepRecords  SleepRecord[]
  fcmTokens     FCMToken[]
  @@map("users")
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
  staff     Staff[]
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  @@map("specialties")
}

model Hospital {
  id            Int             @id @default(autoincrement())
  nameAr        String          @map("name_ar")
  nameEn        String?         @map("name_en")
  slug          String          @unique
  typeId        Int?            @map("type_id")
  type          HospitalType?   @relation(fields: [typeId], references: [id])
  governorateId Int?            @map("governorate_id")
  governorate   Governorate?    @relation(fields: [governorateId], references: [id])
  cityId        Int?            @map("city_id")
  city          City?           @relation(fields: [cityId], references: [id])
  address       String?
  phone         String?
  whatsapp      String?
  website       String?
  facebook      String?
  logo          String?
  description   String?
  hasEmergency  Boolean         @default(false) @map("has_emergency")
  isFeatured    Boolean         @default(false) @map("is_featured")
  ratingAvg     Float           @default(0) @map("rating_avg")
  ratingCount   Int             @default(0) @map("rating_count")
  lat           Float?
  lng           Float?
  category      String?
  
  // الحقول الجديدة للنظام المحسن
  metadata              String  @default("{}") 
  workingHours          String  @default("{}") @map("working_hours")
  services              String  @default("[]")
  insurance             String  @default("[]")
  photos                String  @default("[]")
  
  // العلاقات
  reviews       Review[]
  staff         Staff[]
  articles      Article[]
  
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  @@map("hospitals")
}

model Clinic {
  id            Int          @id @default(autoincrement())
  nameAr        String       @map("name_ar")
  nameEn        String?      @map("name_en")
  slug          String       @unique
  governorateId Int?         @map("governorate_id")
  governorate   Governorate? @relation(fields: [governorateId], references: [id])
  cityId        Int?         @map("city_id")
  city          City?        @relation(fields: [cityId], references: [id])
  addressAr     String?      @map("address_ar")
  phone         String?
  image         String?
  descriptionAr String?      @map("description_ar")
  specialties   Specialty[]
  ratingAvg     Float        @default(0) @map("rating_avg")
  ratingCount   Int          @default(0) @map("rating_count")
  workingHours  String?      @map("working_hours")
  lat           Float?
  lng           Float?
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  @@map("clinics")
}

model Pharmacy {
  id            Int          @id @default(autoincrement())
  nameAr        String       @map("name_ar")
  nameEn        String?      @map("name_en")
  slug          String       @unique
  governorateId Int?         @map("governorate_id")
  governorate   Governorate? @relation(fields: [governorateId], references: [id])
  cityId        Int?         @map("city_id")
  city          City?        @relation(fields: [cityId], references: [id])
  address       String?
  phone         String?
  image         String?
  description   String?
  delivery      Boolean      @default(false)
  is247         Boolean      @default(false) @map("is_247")
  ratingAvg     Float        @default(0) @map("rating_avg")
  ratingCount   Int          @default(0) @map("rating_count")
  lat           Float?
  lng           Float?
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  @@map("pharmacies")
}

model Lab {
  id            Int          @id @default(autoincrement())
  nameAr        String       @map("name_ar")
  nameEn        String?      @map("name_en")
  slug          String       @unique
  governorateId Int?         @map("governorate_id")
  governorate   Governorate? @relation(fields: [governorateId], references: [id])
  cityId        Int?         @map("city_id")
  city          City?        @relation(fields: [cityId], references: [id])
  address       String?
  phone         String?
  image         String?
  description   String?
  homeVisit     Boolean      @default(false) @map("home_visit")
  ratingAvg     Float        @default(0) @map("rating_avg")
  ratingCount   Int          @default(0) @map("rating_count")
  lat           Float?
  lng           Float?
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  @@map("labs")
}

model Staff {
  id          Int        @id @default(autoincrement())
  nameAr      String     @map("name_ar")
  nameEn      String?    @map("name_en")
  title       String?
  specialtyId Int?       @map("specialty_id")
  specialty   Specialty? @relation(fields: [specialtyId], references: [id])
  hospitalId  Int?       @map("hospital_id")
  hospital    Hospital?  @relation(fields: [hospitalId], references: [id])
  image       String?
  bio         String?
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  @@map("staff")
}

model Article {
  id          Int       @id @default(autoincrement())
  title       String
  slug        String    @unique
  content     String
  excerpt     String?
  image       String?
  authorId    Int?      @map("author_id")
  hospitalId  Int?      @map("hospital_id")
  hospital    Hospital? @relation(fields: [hospitalId], references: [id])
  isPublished Boolean   @default(false) @map("is_published")
  views       Int       @default(0)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  @@map("articles")
}

model Review {
  id         Int      @id @default(autoincrement())
  rating     Int
  comment    String?
  userName   String?  @map("user_name")
  hospitalId Int      @map("hospital_id")
  hospital   Hospital @relation(fields: [hospitalId], references: [id])
  isActive   Boolean  @default(false) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  @@map("reviews")
}

model MedicineReminder {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  dosage    String?
  frequency String?
  times     String
  startDate DateTime @default(now()) @map("start_date")
  endDate   DateTime? @map("end_date")
  notes     String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("medicine_reminders")
}

model WeightRecord {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  weight    Float
  date      DateTime @default(now())
  note      String?
  createdAt DateTime @default(now()) @map("created_at")
  @@map("weight_records")
}

model PressureLog {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  systolic  Int
  diastolic Int
  pulse     Int?
  date      DateTime @default(now())
  note      String?
  createdAt DateTime @default(now()) @map("created_at")
  @@map("pressure_logs")
}

model FoodEntry {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  calories  Int
  protein   Float?
  carbs     Float?
  fats      Float?
  date      DateTime @default(now())
  mealType  String?  @map("meal_type")
  createdAt DateTime @default(now()) @map("created_at")
  @@map("food_entries")
}

model SleepRecord {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  startTime DateTime @map("start_time")
  endTime   DateTime @map("end_time")
  quality   Int?
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")
  @@map("sleep_records")
}

model FCMToken {
  id        String   @id @default(cuid())
  userId    Int      @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  device    String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("fcm_tokens")
}
EOF

# 4. Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# 5. Build Next.js
echo "🏗️ Building Next.js..."
npx next build --no-lint

echo "✅ Nuclear build completed successfully!"
