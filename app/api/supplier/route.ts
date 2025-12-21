import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   GET → ambil data Supplier
========================= */
export async function GET() {
  try {
    await initTables();

    const result = await query(
      `
      SELECT
        id,
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
        created_at
      FROM supplier_master
      ORDER BY created_at DESC
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch supplier data" },
      { status: 500 }
    );
  }
}

/* =========================
   POST → simpan Supplier
========================= */
export async function POST(req: Request) {
  try {
    await initTables();

    const body = await req.json();
    const {
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
    } = body;

    if (!supplier_code || !supplier_name) {
      return NextResponse.json(
        { error: "Supplier Code & Name wajib diisi" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO supplier_master
      (
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
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to insert supplier data" },
      { status: 500 }
    );
  }
}
