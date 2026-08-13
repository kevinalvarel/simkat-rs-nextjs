'use server';

import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/drizzle';
import { user, account } from '@/db/auth-schema';
import { hashPassword } from 'better-auth/crypto';

export type UserRole = 'gizi-katering' | 'gizi-rs' | 'supervisor';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
  banned?: boolean | null;
}

export interface UserStats {
  totalUsers: number;
  giziKateringCount: number;
  giziRsCount: number;
  supervisorCount: number;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

/**
 * Fetch all registered users
 */
export async function getUsers(): Promise<UserRecord[]> {
  try {
    const dbUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        banned: user.banned,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    if (dbUsers && dbUsers.length > 0) {
      return dbUsers;
    }
  } catch (error) {
    console.error('Error fetching users from DB:', error);
  }
  return [];
}

/**
 * Fetch stats summary for users
 */
export async function getUserStats(
  usersList?: UserRecord[],
): Promise<UserStats> {
  const users = usersList || (await getUsers());
  const totalUsers = users.length;
  const giziKateringCount = users.filter(
    (u) => u.role === 'gizi-katering',
  ).length;
  const giziRsCount = users.filter((u) => u.role === 'gizi-rs').length;
  const supervisorCount = users.filter((u) => u.role === 'supervisor').length;

  return {
    totalUsers,
    giziKateringCount,
    giziRsCount,
    supervisorCount,
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Create a new user account with specified role
 * Preserves the active supervisor session without switching accounts
 */
export async function createUserAccount(
  payload: CreateUserPayload,
): Promise<MutationResult> {
  if (
    !payload.name?.trim() ||
    !payload.email?.trim() ||
    !payload.password?.trim()
  ) {
    return {
      success: false,
      message: 'Nama, Email, dan Password wajib diisi.',
    };
  }

  if (payload.password.length < 6) {
    return {
      success: false,
      message: 'Password minimal 6 karakter.',
    };
  }

  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanName = payload.name.trim();

  try {
    // 1. Check existing user in database
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, cleanEmail));

    if (existing && existing.length > 0) {
      return {
        success: false,
        message: 'Email sudah terdaftar dalam sistem.',
      };
    }

    // 2. Hash password using Better Auth's official crypto utility
    const hashedPassword = await hashPassword(payload.password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const accountId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    // 3. Insert into "user" table
    await db.insert(user).values({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: payload.role,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Insert into "account" table for credential login
    await db.insert(account).values({
      id: accountId,
      userId: userId,
      accountId: cleanEmail,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath('/dashboard/ag-katering/admin/tambah-pengguna');
    return {
      success: true,
      message: `Akun ${cleanName} (${payload.role}) berhasil dibuat.`,
    };
  } catch (error: any) {
    console.error('Error creating user account:', error);
    return {
      success: false,
      message:
        'Gagal membuat akun pengguna: ' +
        (error?.message || 'Error tidak diketahui'),
    };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<MutationResult> {
  try {
    await db
      .update(user)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(user.id, userId));

    revalidatePath('/dashboard/ag-katering/admin/tambah-pengguna');
    return {
      success: true,
      message: `Role pengguna berhasil diperbarui menjadi ${newRole}.`,
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      message: 'Gagal memperbarui role pengguna.',
    };
  }
}

/**
 * Delete a user account
 */
export async function deleteUserAccount(
  userId: string,
): Promise<MutationResult> {
  try {
    // Delete account credentials first, then user
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(user).where(eq(user.id, userId));

    revalidatePath('/dashboard/ag-katering/admin/tambah-pengguna');
    return {
      success: true,
      message: 'Akun pengguna berhasil dihapus.',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      message: 'Gagal menghapus akun pengguna.',
    };
  }
}
