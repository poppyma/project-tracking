import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* =========================
   GET → data price by supplier
   Quarter dihitung dari start_date
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");

    if (!supplier_id) {
      return NextResponse.json([]);
    }

    const result = await query(
      `
      SELECT
        p.id,
        p.ipd_quotation,
        p.ipd_siis,
        p.description,
        p.steel_spec,
        p.material_source,
        p.tube_route,
        p.price,
        p.year,

        -- QUARTER (TIDAK DISIMPAN DI DB)
        CASE
          WHEN EXTRACT(MONTH FROM p.start_date) BETWEEN 1 AND 3 THEN 'Q1'
          WHEN EXTRACT(MONTH FROM p.start_date) BETWEEN 4 AND 6 THEN 'Q2'
          WHEN EXTRACT(MONTH FROM p.start_date) BETWEEN 7 AND 9 THEN 'Q3'
          ELSE 'Q4'
        END AS quarter,

        s.supplier_code,
        s.supplier_name,
        s.currency,
        s.incoterm,
        s.top
      FROM price_input p
      JOIN supplier_master s ON s.id = p.supplier_id
      WHERE p.supplier_id = $1
      ORDER BY p.start_date DESC
      `,
      [supplier_id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("GET PRICE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load price data" },
      { status: 500 }
    );
  }
}

/* =========================
   POST → insert price
   TANPA quarter
========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      supplier_id,
      start_date,
      end_date,
      year,
      ipd_quotation,
      ipd_siis,
      description,
      steel_spec,
      material_source,
      tube_route,
      price,
    } = body;

    const finalPrice = Number(price);

    if (!supplier_id || !start_date || !year || isNaN(finalPrice)) {
      return NextResponse.json(
        { error: "Data wajib belum lengkap / price tidak valid" },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO price_input
      (
        supplier_id,
        start_date,
        end_date,
        year,
        ipd_quotation,
        ipd_siis,
        description,
        steel_spec,
        material_source,
        tube_route,
        price
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
      [
        supplier_id,
        start_date,
        end_date || null,
        year,
        ipd_quotation || null,
        ipd_siis || null,
        description || null,
        steel_spec || null,
        material_source || null,
        tube_route || null,
        finalPrice,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PRICE INSERT ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save price" },
      { status: 500 }
    );
  }
}
