import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // Try to find by slug first, then by ID if it looks like a number
    let pharmacy = await prisma.pharmacy.findUnique({
      where: { slug },
      include: {
        governorate: true,
        city: true,
      },
    });

    if (!pharmacy && !isNaN(Number(slug))) {
      pharmacy = await prisma.pharmacy.findUnique({
        where: { id: Number(slug) },
        include: {
          governorate: true,
          city: true,
        },
      });
    }

    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    // Parse workingHours if string
    let workingHours = [];
    try {
      if (typeof pharmacy.workingHours === 'string') {
        workingHours = JSON.parse(pharmacy.workingHours);
      } else {
        workingHours = pharmacy.workingHours || [];
      }
    } catch {
      workingHours = [];
    }

    return NextResponse.json({
      ...pharmacy,
      working_hours: workingHours, // Map to snake_case if frontend expects it, or keep camelCase
      workingHours: workingHours
    });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
