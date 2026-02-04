import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");

    if (!supplier_id) {
      return NextResponse.json(
        { error: "supplier_id required" },
        { status: 400 }
      );
    }

    const result = await query(
    `
    SELECT DISTINCT ON (
    d.ipd_quotation,
    d.material_source,
    h.quarter
)
  d.ipd_quotation,
  m.ipd_siis AS ipd,
  d.material_source,
  h.quarter,
  d.price
FROM price_header h
JOIN price_detail d
  ON d.header_id = h.id

LEFT JOIN (
  SELECT DISTINCT ON (ipd_quotation, supplier)
    ipd_quotation,
    supplier,
    ipd_siis
  FROM ipd_master
  ORDER BY ipd_quotation, supplier, id
) m
  ON m.ipd_quotation = d.ipd_quotation
 AND UPPER(m.supplier) = UPPER(
      (SELECT supplier_name FROM supplier_master WHERE id = h.supplier_id)
 )

WHERE h.supplier_id = $1
  AND m.ipd_siis IS NOT NULL
  AND m.ipd_siis <> ''
  AND m.ipd_siis <> '-'

ORDER BY
  d.ipd_quotation,
  d.material_source,
  h.quarter,
  h.start_date DESC;

    `,
    [supplier_id]
  );


    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("PRICE QUARTERS ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
