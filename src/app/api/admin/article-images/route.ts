import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/auth/session';

const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';
const unauthorizedResponse = () => NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  try {
    const folderFsPath = path.join(process.cwd(), 'public', 'images', 'articles');

    let entries: string[] = [];
    try {
      entries = await fs.readdir(folderFsPath);
    } catch {
      entries = [];
    }

    const images = entries
      .filter((name) => {
        const ext = path.extname(name).toLowerCase();
        return ALLOWED_EXT.has(ext);
      })
      .map((name) => ({
        name,
        url: `/images/articles/${name}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing article images:', error);
    return NextResponse.json({ error: 'فشل في جلب الصور' }, { status: 500 });
  }
}
