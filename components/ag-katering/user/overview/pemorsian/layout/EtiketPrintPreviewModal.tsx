'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Tag } from 'lucide-react';
import type { EtiketData } from '@/types/pemorsiantypes';
import EtiketCard from '@/components/ag-katering/user/overview/pemorsian/ui/EtiketCard';

interface EtiketPrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiketList: EtiketData[];
  title?: string;
}

export default function EtiketPrintPreviewModal({
  open,
  onOpenChange,
  etiketList,
  title,
}: EtiketPrintPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const isBatch = etiketList && etiketList.length > 1;
  const modalTitle =
    title ||
    (isBatch
      ? `Cetak ${etiketList?.length || 0} Etiket Makan`
      : `Cetak Etiket Makan - ${etiketList?.[0]?.nama || ''}`);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: modalTitle,

    pageStyle: `
      @page {
        size: 100mm 50mm;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: Arial, Helvetica, sans-serif !important;
        }
        .etiket-container-print {
          display: block !important;
          width: 100mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .etiket-card-print {
          display: block !important;
          position: relative !important;
          width: 100mm !important;
          height: 50mm !important;
          max-width: 100mm !important;
          max-height: 50mm !important;
          min-width: 100mm !important;
          min-height: 50mm !important;
          padding: 0 !important;
          margin: 0 !important;
          border: 1.5px solid #000000 !important;
          border-radius: 2px !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          page-break-inside: avoid !important;
          page-break-after: always !important;
          break-inside: avoid !important;
          break-after: page !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          overflow: hidden !important;
        }
        .etiket-card-print * {
          outline: none !important;
          box-shadow: none !important;
        }
        .etiket-card-print h2 {
          font-size: 10pt !important;
          margin: 0 !important;
          line-height: 1.1 !important;
        }
        .etiket-card-print span,
        .etiket-card-print div {
          font-size: 8pt !important;
          line-height: 1.2 !important;
        }
      }
    `,
  });

  if (!etiketList || etiketList.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden'>
        {/* Modal Header */}
        <DialogHeader className='px-6 py-4 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2 text-foreground'>
                <Tag className='w-5 h-5 text-primary' />
                {modalTitle}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                {isBatch
                  ? `Pratinjau cetak untuk ${etiketList.length} pasien. Format etiket siap ditempel pada nampan makan.`
                  : 'Pratinjau cetak etiket makan pasien sesuai standar penyajian katering RS.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Scrollable Body */}
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40'>
          <div
            ref={printRef}
            className='etiket-container-print flex flex-wrap justify-center gap-5 sm:gap-6'
          >
            {etiketList.map((item, idx) => (
              <div key={idx} className='flex justify-center'>
                <EtiketCard data={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className='px-6 py-3 border-t bg-card flex sm:justify-between items-center gap-2'>
          <div className='text-xs text-muted-foreground hidden sm:block'>
            Total: <strong>{etiketList.length}</strong> etiket
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
            <Button
              size='sm'
              onClick={() => handlePrint()}
              className='gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold'
            >
              <Printer className='w-4 h-4' />
              {isBatch
                ? `Cetak Sekarang (${etiketList.length})`
                : 'Cetak Sekarang'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
