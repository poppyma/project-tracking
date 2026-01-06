import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "File tidak ditemukan" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const records = parse(buffer, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as string[][];

    if (records.length <= 1) {
      return NextResponse.json({ message: "CSV kosong" }, { status: 400 });
    }

    // buang header
    records.shift();

    let inserted = 0;

    for (const row of records) {
      if (row.length < 6) continue;

      /**
       * STRATEGI AMAN:
       * Ambil kolom dari BELAKANG
       */
      const forwarder = row.at(-1) || null;
      const topRaw = row.at(-2);
      const incoterm = row.at(-3) || "";
      const currency = row.at(-4) || "";
      const category = row.at(-5) || "";
      const email = row.at(-6) || "";
      const pic = row.at(-7) || "";
      const country = row.at(-8) || "";

      const top =
        topRaw && !isNaN(Number(topRaw))
          ? Number(topRaw)
          : null;

      const supplier_code = row[0];
      const supplier_name = row[1];

      // address = semua kolom antara supplier_name dan country
      const address = row.slice(2, row.length - 8).join(", ").trim();

      if (!supplier_code || !supplier_name) continue;

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
