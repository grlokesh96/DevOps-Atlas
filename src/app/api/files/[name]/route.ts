import fs from "fs";
import { NextResponse } from "next/server";
import { listUploads, uploadFilePath } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const filePath = uploadFilePath(name);
  if (!filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const known = listUploads().some((m) => m.name === name);
  if (!known) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const isPdf = name.toLowerCase().endsWith(".pdf");
  const download = new URL(request.url).searchParams.get("download");
  const bytes = fs.readFileSync(filePath);

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : "text/plain; charset=utf-8",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
