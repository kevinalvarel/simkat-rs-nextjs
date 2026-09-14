import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { snapshotBatchTable } from './snapshot-batch';

export const revisiEtiketPrintTable = pgTable('revisi_etiket_print', {
  id: serial('id').primaryKey(),
  batch_id: integer('batch_id').notNull().references(() => snapshotBatchTable.id, { onDelete: 'cascade' }),
  no_rm: text('no_rm').notNull(),
  revision_signature: text('revision_signature').notNull(),
  printed_at: timestamp('printed_at').notNull().defaultNow(),
  printed_by: text('printed_by'),
}, (table) => [unique('revisi_etiket_print_batch_rm_unique').on(table.batch_id, table.no_rm)]);
