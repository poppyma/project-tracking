import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   GET → list raw price
========================= */
export async function GET() {
  await initTables();

  const result = await query(`
    SELECT *
    FROM master_price
    ORDER BY year DESC, quarter DESC
  `);

  return NextResponse.json(result.rows);
}

/* =========================
   POST → input price
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const {
      ipd,
      supplier_code,
      quarter,
      year,
      price,
      currency,
    } = await req.json();

    if (!ipd || !supplier_code || !quarter || !year || !price) {
      return NextResponse.json(
        { error: "IPD, Supplier, Quarter, Year, dan Price wajib diisi" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO master_price
        (ipd, supplier_code, quarter, year, price, currency)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [ipd, supplier_code, quarter, year, price, currency]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    // duplikat IPD + Supplier + Quarter + Year
    if (e.code === "23505") {
      return NextResponse.json(
        { error: "Price untuk IPD, Supplier, dan Quarter ini sudah ada" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Gagal menyimpan price" },
      { status: 500 }
    );
  }
}
