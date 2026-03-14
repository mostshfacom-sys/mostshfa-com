import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const sanitizeSegment = (value: string) => value.replace(/[^a-z0-9-_]/gi, '');
const sanitizeFileName = (value: string) => value.replace(/[^a-z0-9.\-_]/gi, '_');
const sanitizePathSegments = (value: string) =>
  value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => sanitizeSegment(segment))
    .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const uploadFile = file as File;

    if (!uploadFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 });
    }

    if (uploadFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5MB size limit' }, { status: 400 });
    }

    const folderInput = formData.get('folder');
    const rawFolder = typeof folderInput === 'string' ? folderInput : 'uploads';
    const normalizedFolder = rawFolder.trim();
    const hasNestedPath = normalizedFolder.includes('/') || normalizedFolder.includes('\\');
    const folderSegments = sanitizePathSegments(normalizedFolder);
    const safeFolder = folderSegments[0] || 'uploads';
    const uploadSegments = hasNestedPath ? folderSegments : ['uploads', safeFolder];

    const fileNameInput = formData.get('fileName');
    const rawFileBase = typeof fileNameInput === 'string' ? fileNameInput : '';
    const safeFileBase = sanitizeSegment(rawFileBase);
    const rawExt = path.extname(uploadFile.name || '').toLowerCase();
    const safeExt = sanitizeFileName(rawExt);
    const fileName = safeFileBase
      ? `${safeFileBase}${safeExt}`
      : `${Date.now()}-${sanitizeFileName(uploadFile.name || 'upload')}`;
    const uploadDir = path.join(process.cwd(), 'public', ...uploadSegments);
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await uploadFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/${uploadSegments.join('/')}/${fileName}`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
