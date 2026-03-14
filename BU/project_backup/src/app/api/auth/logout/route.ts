import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear auth cookies
    cookieStore.delete('auth_token');
    cookieStore.delete('user_id');

    return NextResponse.json({
      message: 'تم تسجيل الخروج بنجاح',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
