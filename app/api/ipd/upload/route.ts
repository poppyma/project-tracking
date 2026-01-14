import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const supplier = formData.get("supplier") as string | null;

    if (!file || !supplier) {
      return NextResponse.json(
        { message: "Supplier dan file wajib diisi" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: [",", ";"],
      bom: true,
    }) as any[];

    let inserted = 0;

    for (const row of records) {
      if (!row.ipd_siis || !row.fb_type || !row.commodity) continue;

      await query(
        `
        INSERT INTO ipd_master (
          ipd_siis,
          supplier,
          fb_type,
          commodity,
          ipd_quotation
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          row.ipd_siis.trim(),
          supplier, // ✅ DARI DROPDOWN
          row.fb_type.trim(),
          row.commodity.trim(),
          row.ipd_quotation?.trim() ?? "",
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      inserted,
    });
  } catch (err) {
    console.error("UPLOAD IPD ERROR:", err);
    return NextResponse.json(
      { message: "Upload gagal" },
      { status: 500 }
    );
  }
}
