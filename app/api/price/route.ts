import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplier_id, header, details } = body;

    if (!supplier_id || !header?.start_date || !header?.end_date) {
      return NextResponse.json(
        { error: "Header tidak lengkap" },
        { status: 400 }
      );
    }

    /* INSERT HEADER */
    const headerRes = await query(
      `
      INSERT INTO price_header
      (supplier_id, start_date, end_date, quarter)
      VALUES ($1,$2,$3,$4)
      RETURNING id
      `,
      [
        supplier_id,
        header.start_date,
        header.end_date,
        header.quarter,
      ]
    );

    const headerId = headerRes.rows[0].id;

    /* INSERT DETAILS */
    for (const d of details) {
      await query(
        `
        INSERT INTO price_detail
        (
          header_id,
          ipd_quotation,
          ipd_siis,
          description,
          steel_spec,
          material_source,
          tube_route,
          price
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          headerId,
          d.ipd_quotation || null,
          d.ipd_siis || null,
          d.description || null,
          d.steel_spec || null,
          d.material_source || null,
          d.tube_route || null,
          Number(d.price),
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PRICE POST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save price" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");

    if (!supplier_id) return NextResponse.json([]);

    const result = await query(
      `
      SELECT
        h.id AS header_id,
        h.start_date,
        h.end_date,
        h.quarter,

        d.id AS detail_id,
        d.ipd_quotation,
        d.ipd_siis,
        d.description,
        d.steel_spec,
        d.material_source,
        d.tube_route,
        d.price
      FROM price_header h
      JOIN price_detail d ON d.header_id = h.id
      WHERE h.supplier_id = $1
      ORDER BY h.start_date DESC, d.ipd_siis
      `,
      [supplier_id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("GET PRICE ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
