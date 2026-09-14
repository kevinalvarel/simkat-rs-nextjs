import { z } from 'zod';
import { hasFormFoodMapping } from './mapping-diet-fields';

export const mappingDietFormSchema = z.object({
  mode: z.enum(['STANDARD', 'NPO', 'KATERING']),
  bentukMakanan: z.string().optional(),
  hewani: z.string().optional(),
  nabati: z.string().optional(),
  sayur: z.string().optional(),
  buah: z.string().optional(),
  snack: z.string().optional(),
}).superRefine((values, context) => {
  if (values.mode === 'STANDARD' && !hasFormFoodMapping(values)) {
    context.addIssue({ code: 'custom', path: ['bentukMakanan'], message: 'Isi minimal satu jenis makanan.' });
  }
});

export type MappingDietFormValues = z.infer<typeof mappingDietFormSchema>;
