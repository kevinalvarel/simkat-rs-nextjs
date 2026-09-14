'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  UtensilsCrossed,
  ShieldCheck,
  RefreshCw,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import type { KategoriMenuItem } from '@/servers/konfigurasi-menu.service';
import { getKategoriMenuAll } from '@/servers/konfigurasi-menu.service';
import MenuStats from './MenuStats';
import MenuTable, { MenuSortField, MenuSortOrder } from './MenuTable';
import MenuFormDialog from './MenuFormDialog';

interface KonfigurasiMenuClientProps {
  initialItems: KategoriMenuItem[];
}

const CATEGORY_TABS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'ALL', label: 'Semua Kategori', icon: '📋' },
  { id: 'BENTUK_MAKANAN', label: 'Bentuk Makanan', icon: '🍚' },
  { id: 'HEWANI', label: 'Lauk Hewani', icon: '🍗' },
  { id: 'NABATI', label: 'Lauk Nabati', icon: '🫘' },
  { id: 'SAYUR', label: 'Sayur', icon: '🥦' },
  { id: 'BUAH', label: 'Buah', icon: '🍊' },
  { id: 'SNACK', label: 'Snack', icon: '🍪' },
];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'kategori-asc', label: 'Kategori (A - Z)' },
  { value: 'kategori-desc', label: 'Kategori (Z - A)' },
  { value: 'kode-asc', label: 'Kode Item (A - Z)' },
  { value: 'kode-desc', label: 'Kode Item (Z - A)' },
  { value: 'label-asc', label: 'Nama Menu (A - Z)' },
  { value: 'label-desc', label: 'Nama Menu (Z - A)' },
  { value: 'status-asc', label: 'Status (Aktif Terlebih Dahulu)' },
  { value: 'status-desc', label: 'Status (Non-Aktif Terlebih Dahulu)' },
  { value: 'id-desc', label: 'Terbaru Ditambahkan' },
  { value: 'id-asc', label: 'Terlama Ditambahkan' },
];

export default function KonfigurasiMenuClient({
  initialItems,
}: KonfigurasiMenuClientProps) {
  const [items, setItems] = useState<KategoriMenuItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Sorting state
  const [sortBy, setSortBy] = useState<MenuSortField>('kategori');
  const [sortOrder, setSortOrder] = useState<MenuSortOrder>('asc');

  // Form Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<KategoriMenuItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh items list from server
  async function refreshData() {
    setIsRefreshing(true);
    try {
      const freshData = await getKategoriMenuAll();
      setItems(freshData);
    } catch (err) {
      console.error('Gagal memperbarui data menu:', err);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Filter & Sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      // Category filter
      if (
        selectedCategory !== 'ALL' &&
        item.nama_kategori !== selectedCategory
      ) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKode = item.kode_item.toLowerCase().includes(q);
        const matchLabel = item.label_item.toLowerCase().includes(q);
        const matchKategori = item.nama_kategori.toLowerCase().includes(q);
        return matchKode || matchLabel || matchKategori;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'kategori') {
        comparison = a.nama_kategori.localeCompare(b.nama_kategori);
        if (comparison === 0) {
          comparison = a.kode_item.localeCompare(b.kode_item);
        }
      } else if (sortBy === 'kode') {
        comparison = a.kode_item.localeCompare(b.kode_item);
      } else if (sortBy === 'label') {
        comparison = a.label_item.localeCompare(b.label_item);
      } else if (sortBy === 'status') {
        const valA = a.is_active ? 1 : 0;
        const valB = b.is_active ? 1 : 0;
        comparison = valB - valA; // active first by default for asc
      } else if (sortBy === 'id') {
        comparison = a.id - b.id;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, selectedCategory, searchQuery, sortBy, sortOrder]);

  function handleSort(field: MenuSortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  function handleOpenAdd() {
    setItemToEdit(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(item: KategoriMenuItem) {
    setItemToEdit(item);
    setIsFormOpen(true);
  }

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      {/* Header Page */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground flex items-center gap-2'>
              <UtensilsCrossed className='w-6 h-6 text-primary' />
              Konfigurasi Master Menu
            </h1>
            <Badge
              variant='outline'
              className='bg-primary/10 text-primary border-primary/30 text-xs font-semibold gap-1 px-2.5 py-0.5'
            >
              <ShieldCheck className='w-3.5 h-3.5' /> Modul Admin
            </Badge>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Kelola master data item menu katering (Bentuk Makanan, Hewani,
            Nabati, Sayur, Buah, Snack) untuk standarisasi etiket & laporan.
          </p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshData}
            disabled={isRefreshing}
            className='gap-2 text-xs'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button onClick={handleOpenAdd} size='sm' className='gap-2 text-xs'>
            <Plus className='w-4 h-4' />
            Tambah Menu Baru
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <MenuStats items={items} />

      {/* Category Filter Tabs */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none'>
          <div className='flex items-center gap-1.5 flex-nowrap'>
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.id;
              const count =
                tab.id === 'ALL'
                  ? items.length
                  : items.filter((i) => i.nama_kategori === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar Search, Sort By & Results count */}
        <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border'>
          <div className='relative flex-1 max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Cari kode item (mis. AYM-G, BN) atau nama menu...'
              className='pl-9 h-9 text-xs bg-background'
            />
          </div>

          <div className='flex flex-wrap items-center justify-between md:justify-end gap-3'>
            {/* Sort Dropdown */}
            <div className='flex items-center gap-1.5'>
              <ArrowUpDown className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
              <span className='text-xs text-muted-foreground whitespace-nowrap hidden sm:inline'>
                Urutkan:
              </span>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(val) => {
                  if (val) {
                    const [field, order] = val.split('-');
                    setSortBy(field as MenuSortField);
                    setSortOrder(order as MenuSortOrder);
                  }
                }}
              >
                <SelectTrigger className='h-9 text-xs bg-background min-w-[200px]'>
                  <SelectValue placeholder='Urutkan berdasarkan...'>
                    {
                      SORT_OPTIONS.find(
                        (opt) => opt.value === `${sortBy}-${sortOrder}`,
                      )?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results count badge */}
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground pl-2 md:border-l border-border/60'>
              <Filter className='w-3.5 h-3.5' />
              <span>
                Menampilkan{' '}
                <strong className='text-foreground'>
                  {filteredAndSortedItems.length}
                </strong>{' '}
                dari <strong className='text-foreground'>{items.length}</strong>{' '}
                item
              </span>
            </div>
          </div>
        </div>

        {/* Master Menu Table */}
        <MenuTable
          items={filteredAndSortedItems}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={handleOpenEdit}
          onRefresh={refreshData}
        />
      </div>

      {/* Add / Edit Form Dialog */}
      <MenuFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        itemToEdit={itemToEdit}
        onSuccess={refreshData}
      />
    </div>
  );
}
