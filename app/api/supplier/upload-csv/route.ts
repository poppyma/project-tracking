import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

type SupplierRow = {
  supplier_code: string;
  supplier_name: string;
  address: string;
  country: string;
  pic: string;
  email: string;
  category: string;
  currency: string;
  incoterm: string;
  top: number | null;
  forwarder: string | null;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "File tidak ditemukan" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    /**
     * ===========================
     * PARSE CSV (LONGGAR)
     * ===========================
     */
    const records = parse(buffer, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as string[][];

    if (records.length <= 1) {
      return NextResponse.json({ message: "CSV kosong" }, { status: 400 });
    }

    // Header dibuang
    records.shift();

    let inserted = 0;

    for (const row of records) {
      if (row.length < 6) continue;

      /**
       * ===========================
       * NORMALISASI ROW
       * ===========================
       * Expected logical order:
       * 0 supplier_code
       * 1 supplier_name
       * 2 address (BISA >1 KOLOM)
       * ? country
       * ? pic
       * ? email
       * ? category
       * ? currency
       * ? incoterm
       * ? top
       * ? forwarder
       */

      const supplier_code = row[0];
      const supplier_name = row[1];

      // COUNTRY biasanya hanya 1 kata: Japan, Indonesia, dll
      const countryIndex = row.findIndex((v) =>
        ["japan", "indonesia", "china", "thailand"].includes(v.toLowerCase())
      );

      if (countryIndex === -1) continue;

      const address = row.slice(2, countryIndex).join(", ").trim();
      const country = row[countryIndex];
      const pic = row[countryIndex + 1] ?? "";
      const email = row[countryIndex + 2] ?? "";
      const category = row[countryIndex + 3] ?? "";
      const currency = row[countryIndex + 4] ?? "";
      const incoterm = row[countryIndex + 5] ?? "";

      const topRaw = row[countryIndex + 6];
      const top = topRaw && !isNaN(Number(topRaw)) ? Number(topRaw) : null;

      const forwarder = row[countryIndex + 7] ?? null;

      /**
       * ===========================
       * INSERT DATABASE
       * ===========================
       */
      await query(
        `
        INSERT INTO supplier_master (
          supplier_code,
          supplier_name,
          address,
          country,
          pic,
          email,
          category,
          currency,
          incoterm,
          top,
          forwarder
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          supplier_code,
          supplier_name,
          address,
          country,
          pic,
          email,
          category,
          currency,
          incoterm,
          top,
          forwarder,
        ]
      );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      message: "Upload supplier CSV berhasil",
      inserted,
    });
  } catch (error: any) {
    console.error("UPLOAD SUPPLIER CSV ERROR:", error);
    return NextResponse.json(
      { message: "Gagal upload CSV", detail: error.message },
      { status: 500 }
    );
  }
}
