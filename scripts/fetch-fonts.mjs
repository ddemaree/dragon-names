// Downloads licensed font files from the private Blob store before dev/build.
// They're licensed for web use but must not be committed to this public repo.

import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { get } from "@vercel/blob";

const FONTS = ["RoslindaleVariableV2-VF.woff2", "PolymathVar.woff2"];
const outDir = path.join(import.meta.dirname, "../src/fonts/licensed");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error(
    "BLOB_READ_WRITE_TOKEN is missing, so the licensed fonts can't be downloaded. Run `vercel env pull .env.local`.",
  );
}

await mkdir(outDir, { recursive: true });

for (const name of FONTS) {
  const target = path.join(outDir, name);
  const existing = await stat(target).catch(() => null);
  if (existing?.size) continue;

  const result = await get(`fonts/${name}`, { access: "private" });
  if (result?.statusCode !== 200) {
    throw new Error(`Font fonts/${name} not found in the Blob store`);
  }
  await writeFile(target, Buffer.from(await new Response(result.stream).arrayBuffer()));
  console.log(`Downloaded ${name}`);
}
