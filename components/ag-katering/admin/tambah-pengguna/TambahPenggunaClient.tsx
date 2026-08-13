'use client';

import React, { useState, useMemo } from 'react';
import type { UserRecord, UserStats, UserRole } from '@/servers/user.service';
import {
  createUserAccount,
  updateUserRole,
  deleteUserAccount,
} from '@/servers/user.service';
import { toast } from 'sonner';

import { TambahPenggunaHeader } from './TambahPenggunaHeader';
import { UserStatsGrid } from './UserStatsGrid';
import { AddUserForm } from './AddUserForm';
import { UserTable } from './UserTable';
import { EditRoleModal } from './EditRoleModal';
import { DeleteUserModal } from './DeleteUserModal';

interface TambahPenggunaClientProps {
  initialUsers: UserRecord[];
  stats: UserStats;
}

export default function TambahPenggunaClient({
  initialUsers,
  stats: initialStats,
}: TambahPenggunaClientProps) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [stats, setStats] = useState<UserStats>(initialStats);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('gizi-katering');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Edit / Delete Dialog state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRoleForEdit, setNewRoleForEdit] = useState<UserRole>('gizi-katering');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered user list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Recalculate stats dynamically
  function updateStats(userList: UserRecord[]) {
    setStats({
      totalUsers: userList.length,
      giziKateringCount: userList.filter((u) => u.role === 'gizi-katering').length,
      giziRsCount: userList.filter((u) => u.role === 'gizi-rs').length,
      supervisorCount: userList.filter((u) => u.role === 'supervisor').length,
    });
  }

  // Handle Form Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Mohon isi semua field yang wajib.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUserAccount({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role: selectedRole,
      });

      if (res.success) {
        toast.success(res.message);

        const newUser: UserRecord = {
          id: `usr-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: selectedRole,
          createdAt: new Date(),
        };
        const updated = [newUser, ...users];
        setUsers(updated);
        updateStats(updated);

        setName('');
        setEmail('');
        setPassword('');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menambahkan pengguna baru.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Role Update
  async function handleConfirmRoleUpdate() {
    if (!editingUser) return;
    setIsUpdatingRole(true);
    try {
      const res = await updateUserRole(editingUser.id, newRoleForEdit);
      if (res.success) {
        toast.success(res.message);
        const updated = users.map((u) =>
          u.id === editingUser.id ? { ...u, role: newRoleForEdit } : u,
        );
        setUsers(updated);
        updateStats(updated);
        setEditingUser(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal memperbarui role pengguna.');
    } finally {
      setIsUpdatingRole(false);
    }
  }

  // Handle Delete User
  async function handleConfirmDelete() {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAccount(deletingUser.id);
      if (res.success) {
        toast.success(res.message);
        const updated = users.filter((u) => u.id !== deletingUser.id);
        setUsers(updated);
        updateStats(updated);
        setDeletingUser(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Gagal menghapus pengguna.');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenEditUser(u: UserRecord) {
    setEditingUser(u);
    setNewRoleForEdit((u.role as UserRole) || 'gizi-katering');
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden'>
      {/* 1. Header Section */}
      <TambahPenggunaHeader />

      {/* 2. Top Stats Grid */}
      <UserStatsGrid stats={stats} />

      {/* 3. Main Two-Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full'>
        {/* Left Column: Form Add User */}
        <AddUserForm
          name={name}
          email={email}
          password={password}
          selectedRole={selectedRole}
          isSubmitting={isSubmitting}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRoleChange={setSelectedRole}
          onSubmit={handleSubmit}
        />

        {/* Right Column: Users List Table */}
        <UserTable
          users={users}
          filteredUsers={filteredUsers}
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          onSearchChange={setSearchQuery}
          onRoleFilterChange={setRoleFilter}
          onEditUser={handleOpenEditUser}
          onDeleteUser={setDeletingUser}
        />
      </div>

      {/* EDIT ROLE DIALOG */}
      <EditRoleModal
        user={editingUser}
        newRole={newRoleForEdit}
        isUpdating={isUpdatingRole}
        onRoleChange={setNewRoleForEdit}
        onClose={() => setEditingUser(null)}
        onConfirm={handleConfirmRoleUpdate}
      />

      {/* DELETE USER CONFIRMATION DIALOG */}
      <DeleteUserModal
        user={deletingUser}
        isDeleting={isDeleting}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
