import { cookies } from 'next/headers';
import prisma from '@/lib/db/prisma';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const authToken = cookieStore.get('auth_token')?.value;

  if (!userId || !authToken) {
    return null;
  }

  const parsedId = Number(userId);
  if (!Number.isFinite(parsedId)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user ?? null;
}
