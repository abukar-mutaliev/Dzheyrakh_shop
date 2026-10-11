import { connection } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  await connection();
  const { name } = await params;
  const match = /^([a-f0-9]{16})\.(jpg|png|webp|gif)$/.exec(name);
  if (!match) return new Response(null, { status: 404 });

  const filePath = path.join(process.cwd(), "public", "uploads", `${match[1]}.${match[2]}`);
  try {
    const body = await fs.readFile(filePath);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": types[match[2]],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
