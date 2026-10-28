import "server-only";
import { cookies } from "next/headers";

// An anonymous, random ID for this browser, so only the browser that started a story can add to it.
// It isn't an account and isn't used for anything else.
const COOKIE = "writer";

export async function getWriterId() {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

// Only callable from a server action or route handler, where cookies can be set
export async function ensureWriterId() {
  const existing = await getWriterId();
  if (existing) return existing;

  const id = crypto.randomUUID();
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function canEdit(tale: { writer: string | null }) {
  const writer = await getWriterId();
  return Boolean(writer && tale.writer === writer);
}
