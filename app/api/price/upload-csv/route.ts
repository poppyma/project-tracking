import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

type PriceCSV = {
  ipd_siis: string;
  steel_spec?: string;
  material_source?: string;
  price: string;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const header_id = formData.get("header_id") as string | null;

    if (!file || !header_id) {
      return NextResponse.json(
        { error: "file atau header_id tidak ada" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ PENTING: columns:true
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as PriceCSV[];

    if (!records.length) {
      return NextResponse.json(
        { error: "CSV kosong" },
        { status: 400 }
      );
    }

    let inserted = 0;

    for (const row of records) {
      if (!row.ipd_siis || !row.price) continue;

      // normalisasi price
      const cleanPrice = row.price
        .replace(/\./g, "")
        .replace(",", ".");

      const priceNum = Number(cleanPrice);
      if (isNaN(priceNum)) continue;

      await query(
        `
        INSERT INTO price_detail (
          header_id,
          ipd_siis,
          steel_spec,
          material_source,
          price
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          header_id,
          row.ipd_siis,
          row.steel_spec || null,
          row.material_source || null,
          priceNum,
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      inserted,
    });
  } catch (err: any) {
    console.error("UPLOAD PRICE CSV ERROR:", err);
    return NextResponse.json(
      { error: "Upload price gagal", detail: err.message },
      { status: 500 }
    );
  }
}
