import { NextRequest, NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // <- wajib await
  await initTables();

  const body = await req.json();
  // ambil field
  const { project_id, component, candidate_supplier, price, currency, term, landed_cost, tpl, tooling_cost } = body;

  // ambil BP
  const bpRes = await query(`SELECT bp_value FROM bp_rates WHERE currency=$1`, [currency.toUpperCase()]);
  if (bpRes.rowCount === 0) {
    return NextResponse.json({ error: `BP untuk currency ${currency} belum tersedia` }, { status: 400 });
  }
  const bpValue = parseFloat(bpRes.rows[0].bp_value);

  // parse angka & hitung
  const priceNum = parseFloat(price);
  const landedCostNum = parseFloat(landed_cost) / 100;
  const tplNum = parseFloat(tpl) / 100;
  const landedIdrPrice = priceNum * (1 + landedCostNum) * tplNum * bpValue;

  // ambil bom_qty
  const qtyRes = await query(
    `SELECT bom_qty FROM materials WHERE project_id=$1 AND component=$2`,
    [project_id, component]
  );
  if (qtyRes.rowCount === 0) {
    return NextResponse.json({ error: `BOM QTY untuk component ${component} tidak ditemukan` }, { status: 400 });
  }
  const bomQty = Number(qtyRes.rows[0].bom_qty);
  const costBearing = landedIdrPrice * bomQty;

  // update
  const res = await query(
    `
    UPDATE bom_costs SET
      project_id=$1,
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
      bpValue,
      landedIdrPrice.toFixed(2),
      costBearing.toFixed(2),
      tooling_cost,
      id,
    ]
  );

  return NextResponse.json(res.rows[0], { status: 200 });
}
