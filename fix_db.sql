-- Create ResourceType Enum if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ResourceType') THEN
        CREATE TYPE "ResourceType" AS ENUM ('ROOM', 'HALL', 'LAB', 'EQUIPMENT', 'VEHICLE', 'OTHER');
    END IF;
END $$;

-- Create Resource Table if not exists
CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'ROOM',
    "description" TEXT,
    "location" TEXT,
    "capacity" INTEGER,
    "image" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- Ensure ResourceBooking links to Resource
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ResourceBooking') THEN
        ALTER TABLE "ResourceBooking" 
        DROP CONSTRAINT IF EXISTS "ResourceBooking_resourceId_fkey";
        
        ALTER TABLE "ResourceBooking" 
        ADD CONSTRAINT "ResourceBooking_resourceId_fkey" 
        FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
