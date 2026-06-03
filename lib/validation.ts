import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Pseudo trop court")
  .max(24, "Pseudo trop long")
  .regex(/^[a-zA-Z0-9_]+$/, "Pseudo: lettres, chiffres et _ uniquement")
  .transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  password: z.string().min(8, "8 caracteres minimum").max(128),
  username: usernameSchema
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Mot de passe requis")
});

export const postSchema = z.object({
  body: z.string().trim().max(560, "560 caracteres maximum").optional()
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(360)
});

export const reportSchema = z.object({
  reason: z.string().trim().min(4).max(500)
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(1200)
});

export const createConversationSchema = z.object({
  username: usernameSchema
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(40).optional().nullable(),
  bio: z.string().trim().max(160).optional().nullable()
});

export const roleSchema = z.object({
  role: z.enum(["user", "moderator", "admin"])
});

export const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim();
}

export function imageExtension(type: string) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export async function hasValidImageSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47;
  const isGif =
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x38;
  const isWebp =
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50;

  return isJpeg || isPng || isGif || isWebp;
}
