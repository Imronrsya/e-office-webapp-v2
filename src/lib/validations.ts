import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Surat wajib diisi"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const submissionFormSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  menimbang: z.array(z.string()).optional(),
  mengingat: z.array(z.string()).optional(),
  menetapkan: z.array(z.string()).optional(),
  poinMenetapkanLebihLanjut: z.boolean().default(false),
  salinan: z.array(z.string()).optional(),
  lampiran: z.array(z.any()).optional(),
  status: z.enum(["Draf", "Diajukan"]).default("Draf"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SubmissionFormValues = z.infer<typeof submissionFormSchema>;
