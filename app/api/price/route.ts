import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplier_id = searchParams.get("supplier_id");

  if (!supplier_id) {
    return NextResponse.json([]);
  }

  const result = await query(`
    SELECT
      p.id,
      p.ipd_siis,
      p.description,
      p.steel_spec,
      p.material_source,
      p.tube_route,
      p.price,
      p.start_date,
      p.end_date,

      s.supplier_code,
      s.supplier_name,
      s.currency,
      s.incoterm,
      s.top
    FROM price_input p
    JOIN supplier_master s ON s.id = p.supplier_id
    WHERE p.supplier_id = $1
    ORDER BY p.created_at
  `, [supplier_id]);

  return NextResponse.json(result.rows);
}
