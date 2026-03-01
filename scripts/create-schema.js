const fs = require('fs');
const path = require('path');

const schemaContent = `// Prisma Schema for mostshfa_new
// Supports SQLite (local dev) - Change to MySQL for production

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ==================== GEOGRAPHIC ====================

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
  districts     District[]
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

model District {
  id        Int      @id @default(autoincrement())
  cityId    Int      @map("city_id")
  city      City     @relation(fields: [cityId], references: [id])
  nameAr    String   @map("name_ar")
  nameEn    String?  @map("name_en")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@unique([cityId, nameAr])
  @@index([cityId])
  @@map("districts")
}

// ==================== HOSPITAL ====================

model HospitalType {
  id          Int        @id @default(autoincrement())
  nameAr      String     @unique @map("name_ar")
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
  id        Int                 @id @default(autoincrement())
  nameAr    String              @unique @map("name_ar")
  nameEn    String?             @map("name_en")
  slug      String              @unique
  icon      String?
  hospitals HospitalSpecialty[]
  clinics   ClinicSpecialty[]
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")
  @@map("specialties")
}

model Service {
  id        Int               @id @default(autoincrement())
  nameAr    String            @unique @map("name_ar")
  nameEn    String?           @map("name_en")
  slug      String            @unique
  category  String?
  hospitals HospitalService[]
  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")
  @@map("services")
}

model Hospital {
  id            Int                   @id @default(autoincrement())
  nameAr        String                @map("name_ar")
  nameEn        String?               @map("name_en")
  slug          String                @unique
  typeId        Int?                  @map("type_id")
  type          HospitalType?         @relation(fields: [typeId], references: [id])
  governorateId Int?                  @map("governorate_id")
  governorate   Governorate?          @relation(fields: [governorateId], references: [id])
  cityId        Int?                  @map("city_id")
  city          City?                 @relation(fields: [cityId], references: [id])
  address       String?
  phone         String?
  whatsapp      String?
  website       String?
  facebook      String?
  logo          String?
  description   String?
  hasEmergency  Boolean               @default(false) @map("has_emergency")
  isFeatured    Boolean               @default(false) @map("is_featured")
  ratingAvg     Float                 @default(0) @map("rating_avg")
  ratingCount   Int                   @default(0) @map("rating_count")
  lat           Float?
  lng           Float?
  branches      HospitalBranch[]
  workingHours  HospitalWorkingHour[]
  staff         HospitalStaff[]
  specialties   HospitalSpecialty[]
  services      HospitalService[]
  createdAt     DateTime              @default(now()) @map("created_at")
  updatedAt     DateTime              @updatedAt @map("updated_at")
  @@index([typeId])
  @@index([governorateId])
  @@index([cityId])
  @@index([isFeatured])
  @@index([slug])
  @@map("hospitals")
}

model HospitalSpecialty {
  hospitalId  Int       @map("hospital_id")
  specialtyId Int       @map("specialty_id")
  hospital    Hospital  @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  specialty   Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade)
  @@id([hospitalId, specialtyId])
  @@map("hospital_specialties")
}

model HospitalService {
  hospitalId Int      @map("hospital_id")
  serviceId  Int      @map("service_id")
  hospital   Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  service    Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  @@id([hospitalId, serviceId])
  @@map("hospital_services")
}

model HospitalBranch {
  id            Int                         @id @default(autoincrement())
  hospitalId    Int                         @map("hospital_id")
  hospital      Hospital                    @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  name          String?
  slug          String?
  address       String?
  phone         String?
  governorateId Int?                        @map("governorate_id")
  cityId        Int?                        @map("city_id")
  lat           Float?
  lng           Float?
  ratingAvg     Float                       @default(0) @map("rating_avg")
  ratingCount   Int                         @default(0) @map("rating_count")
  workingHours  HospitalBranchWorkingHour[]
  createdAt     DateTime                    @default(now()) @map("created_at")
  updatedAt     DateTime                    @updatedAt @map("updated_at")
  @@unique([hospitalId, slug])
  @@map("hospital_branches")
}

model HospitalWorkingHour {
  id         Int      @id @default(autoincrement())
  hospitalId Int      @map("hospital_id")
  hospital   Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  dayOfWeek  Int      @map("day_of_week")
  openTime   String?  @map("open_time")
  closeTime  String?  @map("close_time")
  isClosed   Boolean  @default(false) @map("is_closed")
  is24h      Boolean  @default(false) @map("is_24h")
  @@unique([hospitalId, dayOfWeek])
  @@map("hospital_working_hours")
}

model HospitalBranchWorkingHour {
  id        Int            @id @default(autoincrement())
  branchId  Int            @map("branch_id")
  branch    HospitalBranch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  dayOfWeek Int            @map("day_of_week")
  openTime  String?        @map("open_time")
  closeTime String?        @map("close_time")
  isClosed  Boolean        @default(false) @map("is_closed")
  is24h     Boolean        @default(false) @map("is_24h")
  @@unique([branchId, dayOfWeek])
  @@map("hospital_branch_working_hours")
}

model HospitalStaff {
  id              Int      @id @default(autoincrement())
  hospitalId      Int      @map("hospital_id")
  hospital        Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  nameAr          String   @map("name_ar")
  nameEn          String?  @map("name_en")
  position        String
  specialtyId     Int?     @map("specialty_id")
  qualification   String?
  photo           String?
  bio             String?
  experienceYears Int?     @map("experience_years")
  email           String?
  phone           String?
  availableDays   String?  @map("available_days")
  availableHours  String?  @map("available_hours")
  isActive        Boolean  @default(true) @map("is_active")
  order           Int      @default(0)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  @@index([hospitalId])
  @@map("hospital_staff")
}

// ==================== CLINICS ====================

model Clinic {
  id             Int                  @id @default(autoincrement())
  nameAr         String               @map("name_ar")
  nameEn         String?              @map("name_en")
  slug           String               @unique
  descriptionAr  String?              @map("description_ar")
  phone          String?
  whatsapp       String?
  email          String?
  website        String?
  facebook       String?
  logo           String?
  governorateId  Int?                 @map("governorate_id")
  governorate    Governorate?         @relation(fields: [governorateId], references: [id])
  cityId         Int?                 @map("city_id")
  city           City?                @relation(fields: [cityId], references: [id])
  addressAr      String?              @map("address_ar")
  lat            Float?
  lng            Float?
  hours          String?
  isOpen         Boolean              @default(true) @map("is_open")
  isFeatured     Boolean              @default(false) @map("is_featured")
  ratingAvg      Float                @default(0) @map("rating_avg")
  ratingCount    Int                  @default(0) @map("rating_count")
  status         String               @default("published")
  branches       ClinicBranch[]
  workingHours   ClinicWorkingHour[]
  specialties    ClinicSpecialty[]
  createdAt      DateTime             @default(now()) @map("created_at")
  updatedAt      DateTime             @updatedAt @map("updated_at")
  @@index([isFeatured])
  @@index([slug])
  @@map("clinics")
}

model ClinicSpecialty {
  clinicId    Int       @map("clinic_id")
  specialtyId Int       @map("specialty_id")
  clinic      Clinic    @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  specialty   Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade)
  @@id([clinicId, specialtyId])
  @@map("clinic_specialties")
}

model ClinicBranch {
  id             Int                       @id @default(autoincrement())
  clinicId       Int                       @map("clinic_id")
  clinic         Clinic                    @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  nameAr         String?                   @map("name_ar")
  slug           String?
  governorateId  Int                       @map("governorate_id")
  cityId         Int                       @map("city_id")
  addressAr      String?                   @map("address_ar")
  lat            Float?
  lng            Float?
  phone          String?
  whatsapp       String?
  hours          String?
  isOpen         Boolean                   @default(true) @map("is_open")
  ratingAvg      Float                     @default(0) @map("rating_avg")
  ratingCount    Int                       @default(0) @map("rating_count")
  isMain         Boolean                   @default(false) @map("is_main")
  isActive       Boolean                   @default(true) @map("is_active")
  workingHours   ClinicBranchWorkingHour[]
  createdAt      DateTime                  @default(now()) @map("created_at")
  updatedAt      DateTime                  @updatedAt @map("updated_at")
  @@unique([clinicId, slug])
  @@map("clinic_branches")
}

model ClinicWorkingHour {
  id        Int      @id @default(autoincrement())
  clinicId  Int      @map("clinic_id")
  clinic    Clinic   @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  dayOfWeek Int      @map("day_of_week")
  openTime  String?  @map("open_time")
  closeTime String?  @map("close_time")
  isClosed  Boolean  @default(false) @map("is_closed")
  is24h     Boolean  @default(false) @map("is_24h")
  @@unique([clinicId, dayOfWeek])
  @@map("clinic_working_hours")
}

model ClinicBranchWorkingHour {
  id        Int          @id @default(autoincrement())
  branchId  Int          @map("branch_id")
  branch    ClinicBranch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  dayOfWeek Int          @map("day_of_week")
  openTime  String?      @map("open_time")
  closeTime String?      @map("close_time")
  isClosed  Boolean      @default(false) @map("is_closed")
  is24h     Boolean      @default(false) @map("is_24h")
  @@unique([branchId, dayOfWeek])
  @@map("clinic_branch_working_hours")
}

// ==================== LABS ====================

model Lab {
  id              Int              @id @default(autoincrement())
  nameAr          String           @map("name_ar")
  nameEn          String?          @map("name_en")
  slug            String           @unique
  descriptionAr   String?          @map("description_ar")
  phone           String?
  whatsapp        String?
  email           String?
  website         String?
  facebook        String?
  logo            String?
  governorateId   Int?             @map("governorate_id")
  governorate     Governorate?     @relation(fields: [governorateId], references: [id])
  cityId          Int?             @map("city_id")
  city            City?            @relation(fields: [cityId], references: [id])
  addressAr       String?          @map("address_ar")
  lat             Float?
  lng             Float?
  hasHomeSampling Boolean          @default(false) @map("has_home_sampling")
  hours           String?
  isOpen          Boolean          @default(true) @map("is_open")
  isFeatured      Boolean          @default(false) @map("is_featured")
  ratingAvg       Float            @default(0) @map("rating_avg")
  ratingCount     Int              @default(0) @map("rating_count")
  status          String           @default("published")
  branches        LabBranch[]
  workingHours    LabWorkingHour[]
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  @@index([isFeatured])
  @@index([slug])
  @@map("labs")
}

model LabBranch {
  id              Int                    @id @default(autoincrement())
  labId           Int                    @map("lab_id")
  lab             Lab                    @relation(fields: [labId], references: [id], onDelete: Cascade)
  nameAr          String?                @map("name_ar")
  slug            String?
  governorateId   Int                    @map("governorate_id")
  cityId          Int                    @map("city_id")
  addressAr       String?                @map("address_ar")
  lat             Float?
  lng             Float?
  phone           String?
  whatsapp        String?
  hasHomeSampling Boolean                @default(false) @map("has_home_sampling")
  hours           String?
  isOpen          Boolean                @default(true) @map("is_open")
  ratingAvg       Float                  @default(0) @map("rating_avg")
  ratingCount     Int                    @default(0) @map("rating_count")
  isMain          Boolean                @default(false) @map("is_main")
  isActive        Boolean                @default(true) @map("is_active")
  workingHours    LabBranchWorkingHour[]
  createdAt       DateTime               @default(now()) @map("created_at")
  updatedAt       DateTime               @updatedAt @map("updated_at")
  @@unique([labId, slug])
  @@map("lab_branches")
}

model LabWorkingHour {
  id        Int      @id @default(autoincrement())
  labId     Int      @map("lab_id")
  lab       Lab      @relation(fields: [labId], references: [id], onDelete: Cascade)
  dayOfWeek Int      @map("day_of_week")
  openTime  String?  @map("open_time")
  closeTime String?  @map("close_time")
  isClosed  Boolean  @default(false) @map("is_closed")
  is24h     Boolean  @default(false) @map("is_24h")
  @@unique([labId, dayOfWeek])
  @@map("lab_working_hours")
}

model LabBranchWorkingHour {
  id        Int       @id @default(autoincrement())
  branchId  Int       @map("branch_id")
  branch    LabBranch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  dayOfWeek Int       @map("day_of_week")
  openTime  String?   @map("open_time")
  closeTime String?   @map("close_time")
  isClosed  Boolean   @default(false) @map("is_closed")
  is24h     Boolean   @default(false) @map("is_24h")
  @@unique([branchId, dayOfWeek])
  @@map("lab_branch_working_hours")
}

// ==================== PHARMACIES ====================

model Pharmacy {
  id                 Int                   @id @default(autoincrement())
  nameAr             String                @map("name_ar")
  nameEn             String?               @map("name_en")
  slug               String                @unique
  descriptionAr      String?               @map("description_ar")
  phone              String?
  whatsapp           String?
  email              String?
  website            String?
  facebook           String?
  logo               String?
  governorateId      Int?                  @map("governorate_id")
  governorate        Governorate?          @relation(fields: [governorateId], references: [id])
  cityId             Int?                  @map("city_id")
  city               City?                 @relation(fields: [cityId], references: [id])
  addressAr          String?               @map("address_ar")
  lat                Float?
  lng                Float?
  hasDeliveryService Boolean               @default(false) @map("has_delivery_service")
  hours              String?
  isOpen             Boolean               @default(true) @map("is_open")
  isFeatured         Boolean               @default(false) @map("is_featured")
  is24h              Boolean               @default(false) @map("is_24h")
  ratingAvg          Float                 @default(0) @map("rating_avg")
  ratingCount        Int                   @default(0) @map("rating_count")
  status             String                @default("published")
  branches           PharmacyBranch[]
  workingHours       PharmacyWorkingHour[]
  createdAt          DateTime              @default(now()) @map("created_at")
  updatedAt          DateTime              @updatedAt @map("updated_at")
  @@index([isFeatured])
  @@index([slug])
  @@map("pharmacies")
}

model PharmacyBranch {
  id                 Int                         @id @default(autoincrement())
  pharmacyId         Int                         @map("pharmacy_id")
  pharmacy           Pharmacy                    @relation(fields: [pharmacyId], references: [id], onDelete: Cascade)
  nameAr             String?                     @map("name_ar")
  slug               String?
  governorateId      Int                         @map("governorate_id")
  cityId             Int                         @map("city_id")
  addressAr          String?                     @map("address_ar")
  lat                Float?
  lng                Float?
  phone              String?
  whatsapp           String?
  hasDeliveryService Boolean                     @default(false) @map("has_delivery_service")
  hours              String?
  isOpen             Boolean                     @default(true) @map("is_open")
  is24h              Boolean                     @default(false) @map("is_24h")
  ratingAvg          Float                       @default(0) @map("rating_avg")
  ratingCount        Int                         @default(0) @map("rating_count")
  isMain             Boolean                     @default(false) @map("is_main")
  isActive           Boolean                     @default(true) @map("is_active")
  workingHours       PharmacyBranchWorkingHour[]
  createdAt          DateTime                    @default(now()) @map("created_at")
  updatedAt          DateTime                    @updatedAt @map("updated_at")
  @@unique([pharmacyId, slug])
  @@map("pharmacy_branches")
}

model PharmacyWorkingHour {
  id         Int      @id @default(autoincrement())
  pharmacyId Int      @map("pharmacy_id")
  pharmacy   Pharmacy @relation(fields: [pharmacyId], references: [id], onDelete: Cascade)
  dayOfWeek  Int      @map("day_of_week")
  openTime   String?  @map("open_time")
  closeTime  String?  @map("close_time")
  isClosed   Boolean  @default(false) @map("is_closed")
  is24h      Boolean  @default(false) @map("is_24h")
  @@unique([pharmacyId, dayOfWeek])
  @@map("pharmacy_working_hours")
}

model PharmacyBranchWorkingHour {
  id        Int            @id @default(autoincrement())
  branchId  Int            @map("branch_id")
  branch    PharmacyBranch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  dayOfWeek Int            @map("day_of_week")
  openTime  String?        @map("open_time")
  closeTime String?        @map("close_time")
  isClosed  Boolean        @default(false) @map("is_closed")
  is24h     Boolean        @default(false) @map("is_24h")
  @@unique([branchId, dayOfWeek])
  @@map("pharmacy_branch_working_hours")
}

// ==================== DRUGS ====================

model DrugCategory {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  legacyId  Int?     @unique @map("legacy_id")
  drugs     Drug[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("drug_categories")
}

model Drug {
  id                Int               @id @default(autoincrement())
  categoryId        Int?              @map("category_id")
  category          DrugCategory?     @relation(fields: [categoryId], references: [id])
  legacyId          Int?              @unique @map("legacy_id")
  nameAr            String            @map("name_ar")
  nameEn            String?           @map("name_en")
  slug              String            @unique
  image             String?
  usage             String?
  contraindications String?
  dosage            String?
  activeIngredient  String?           @map("active_ingredient")
  disclaimer        String?
  priceText         String?           @map("price_text")
  prices            DrugPrice[]
  alternativeLinks  DrugAlternative[] @relation("DrugAlternatives")
  alternativeOf     DrugAlternative[] @relation("AlternativeOf")
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  @@index([categoryId])
  @@index([slug])
  @@map("drugs")
}

model DrugPrice {
  id              Int       @id @default(autoincrement())
  drugId          Int       @map("drug_id")
  drug            Drug      @relation(fields: [drugId], references: [id], onDelete: Cascade)
  price           Float
  currency        String    @default("EGP")
  updatedAtLegacy DateTime? @map("updated_at_legacy")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  @@index([drugId])
  @@map("drug_prices")
}

model DrugAlternative {
  id            Int  @id @default(autoincrement())
  drugId        Int  @map("drug_id")
  alternativeId Int  @map("alternative_id")
  drug          Drug @relation("DrugAlternatives", fields: [drugId], references: [id], onDelete: Cascade)
  alternative   Drug @relation("AlternativeOf", fields: [alternativeId], references: [id], onDelete: Cascade)
  @@unique([drugId, alternativeId])
  @@map("drug_alternatives")
}

// ==================== SEARCH LOG ====================

model SearchLog {
  id           Int      @id @default(autoincrement())
  query        String
  entityType   String?  @map("entity_type")
  resultsCount Int      @default(0) @map("results_count")
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([query])
  @@index([entityType])
  @@index([createdAt])
  @@map("search_logs")
}
`;

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Schema file created successfully at:', schemaPath);
console.log('File size:', fs.statSync(schemaPath).size, 'bytes');
