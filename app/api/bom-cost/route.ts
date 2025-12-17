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
      component,
      candidate_supplier,
      price,
      currency,
      term,
      landed_cost,
      tpl,
      tooling_cost,
    } = body;

    // =============================
    // 1. Ambil BP
    // =============================
    const bpRes = await query(
      `SELECT bp_value FROM bp_rates WHERE currency = $1`,
      [currency.toUpperCase()]
    );

    if (bpRes.rowCount === 0) {
      return NextResponse.json(
        { error: `BP untuk currency ${currency} belum tersedia` },
        { status: 400 }
      );
    }

    const bpValue = parseNumber(bpRes.rows[0].bp_value);

    // =============================
    // 2. Parse angka
    // =============================
    const priceNum = parseNumber(price);
    const landedCostNum = parseNumber(landed_cost) / 100;
    const tplNum = parseNumber(tpl) / 100;

    // =============================
    // 3. Hitung LANDED IDR PRICE
    // =============================
    const landedIdrPrice =
      priceNum * (1 + landedCostNum) * tplNum * bpValue;

    // =============================
    // 4. Ambil BOM QTY dari MATERIALS
    // =============================
    const qtyRes = await query(
      `
      SELECT bom_qty
      FROM materials
      WHERE project_id = $1
        AND component = $2
      `,
      [project_id, component]
    );

    if (qtyRes.rowCount === 0) {
      return NextResponse.json(
        { error: `BOM QTY untuk component ${component} tidak ditemukan di materials` },
        { status: 400 }
      );
    }

    const bomQty = Number(qtyRes.rows[0].bom_qty);

    // =============================
    // 5. HITUNG COST BEARING
    // =============================
    const costBearing = landedIdrPrice * bomQty;

    // =============================
    // 6. INSERT KE BOM_COSTS
    // =============================
    const res = await query(
      `
      INSERT INTO bom_costs (
        project_id,
        component,
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        project_id,
        component,
        candidate_supplier,
        price,
        currency,
        term,
        landed_cost,
        tpl,
        bpRes.rows[0].bp_value,
        landedIdrPrice.toFixed(2),
        costBearing.toFixed(2),
        tooling_cost,
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });

  } catch (err: any) {
    console.error("POST bom_costs error:", err);
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

export async function PUT(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const {
      project_id,
      component,
      candidate_supplier,
      price,
      currency,
      term,
      landed_cost,
      tpl,
      tooling_cost,
    } = body;

    if (!body.id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const id = body.id;

    // 1. Ambil BP
    const bpRes = await query(`SELECT bp_value FROM bp_rates WHERE currency = $1`, [
      currency.toUpperCase(),
    ]);

    if (bpRes.rowCount === 0) {
      return NextResponse.json(
        { error: `BP untuk currency ${currency} belum tersedia` },
        { status: 400 }
      );
    }
    const bpValue = parseNumber(bpRes.rows[0].bp_value);

    // 2. Parse angka
    const priceNum = parseNumber(price);
    const landedCostNum = parseNumber(landed_cost) / 100;
    const tplNum = parseNumber(tpl) / 100;

    // 3. Hitung LANDED IDR PRICE
    const landedIdrPrice = priceNum * (1 + landedCostNum) * tplNum * bpValue;

    // 4. Ambil BOM QTY dari MATERIALS
    const qtyRes = await query(
      `SELECT bom_qty FROM materials WHERE project_id=$1 AND component=$2`,
      [project_id, component]
    );

    if (qtyRes.rowCount === 0) {
      return NextResponse.json(
        { error: `BOM QTY untuk component ${component} tidak ditemukan` },
        { status: 400 }
      );
    }

    const bomQty = Number(qtyRes.rows[0].bom_qty);

    // 5. Hitung COST BEARING
    const costBearing = landedIdrPrice * bomQty;

    // 6. UPDATE
    const res = await query(
      `UPDATE bom_costs
       SET project_id=$1,
           component=$2,
           candidate_supplier=$3,
           price=$4,
           currency=$5,
           term=$6,
           landed_cost=$7,
           tpl=$8,
           bp_2026=$9,
           landed_idr_price=$10,
           cost_bearing=$11,
           tooling_cost=$12
       WHERE id=$13
       RETURNING *`,
      [
        project_id,
        component,
        candidate_supplier,
        price,
        currency,
        term,
        landed_cost,
        tpl,
        bpRes.rows[0].bp_value,
        landedIdrPrice.toFixed(2),
        costBearing.toFixed(2),
        tooling_cost,
        id,
      ]
    );

    return NextResponse.json(res.rows[0], { status: 200 });
  } catch (err: any) {
    console.error("PUT bom_costs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
