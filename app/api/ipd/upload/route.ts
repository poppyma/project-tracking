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
      if (!row.ipd_siis) continue;

      const ipd_siis = row.ipd_siis.trim();
      const fb_type = row.fb_type?.trim() || "-";
      const commodity = row.commodity?.trim() || "-";
      const ipd_quotation = row.ipd_quotation?.trim() || "-";
      const desc =
        row.DESC?.trim() ||
        row.desc?.trim() ||
        null;

      await query(
        `
        INSERT INTO ipd_master (
          ipd_siis,
          supplier,
          "DESC",
          fb_type,
          commodity,
          ipd_quotation
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
         [
            ipd_siis,
            supplier,        // dari dropdown
            desc,
            fb_type,         // default "-"
            commodity,       // default "-"
            ipd_quotation,   // default "-"
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
