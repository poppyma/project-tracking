import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* ======================================================
   GET
   - ?mode=projects → dropdown project
   - default → list BOM Cost
====================================================== */
export async function GET() {
  try {
    await initTables();

    const res = await query(`
      SELECT
        bc.*,
        p.name AS project_name
      FROM bom_costs bc
      LEFT JOIN projects p ON p.id = bc.project_id
      ORDER BY bc.created_at DESC
    `);

    return NextResponse.json(res.rows);

  } catch (err: any) {
    console.error("GET bom_costs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseNumber(value: string): number {
  if (!value) return 0;

  return Number(
    value
      .replace(/\./g, "")   // hapus pemisah ribuan
      .replace(",", ".")    // koma jadi desimal
      .replace("%", "")     // hapus %
      .trim()
  ) || 0;
}



export async function POST(req: Request) {
  try {
    await initTables();
    const body = await req.json();

    const {
      project_id,
      candidate_supplier,
      price,
      currency,
      term,
      landed_cost,
      tpl,
      bp_2026,
      cost_bearing,
      tooling_cost,
    } = body;

    // =============================
    // HITUNG LANDED IDR PRICE
    // =============================
    const priceNum = parseNumber(price);
    const landedCostNum = parseNumber(landed_cost) / 100;
    const tplNum = parseNumber(tpl) / 100;
    const bp2026Num = parseNumber(bp_2026);

    const landedIdrPrice =
        priceNum * (1 + landedCostNum) * tplNum * bp2026Num;

    const res = await query(
      `
      INSERT INTO bom_costs (
        project_id,
        candidate_supplier,
        price,
        currency,
        term,
        landed_cost,
        tpl,
        bp_2026,
        landed_idr_price,
        cost_bearing,
        tooling_cost
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        project_id,
        candidate_supplier,
        price,
        currency,
        term,
        landed_cost,
        tpl,
        bp_2026,
        landedIdrPrice.toFixed(2), // disimpan TEXT
        cost_bearing,
        tooling_cost,
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });

  } catch (err: any) {
    console.error("POST bom_costs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
  try {
    await initTables();
    const body = await req.json();

    const {
      id,
      candidate_supplier,
      price,
      currency,
      term,
      landed_cost,
      tpl,
      bp_2026,
      landed_idr_price,
      cost_bearing,
      tooling_cost,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await query(
      `
      UPDATE bom_costs SET
        candidate_supplier=$1,
        price=$2,
        currency=$3,
        term=$4,
        landed_cost=$5,
        tpl=$6,
        bp_2026=$7,
        landed_idr_price=$8,
        cost_bearing=$9,
        tooling_cost=$10,
        updated_at=NOW()
      WHERE id=$11
      `,
      [
        candidate_supplier,
        price,
        currency,
        term,
        landed_cost,
        tpl,
        bp_2026,
        landed_idr_price,
        cost_bearing,
        tooling_cost,
        id,
      ]
    );

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("PATCH bom_costs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    await initTables();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await query(`DELETE FROM bom_costs WHERE id=$1`, [id]);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("DELETE bom_costs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
