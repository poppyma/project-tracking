import { NextRequest, NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

function parseNumber(value: string): number {
  if (!value) return 0;
  return Number(
    value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace("%", "")
      .trim()
  ) || 0;
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params; // context.params sekarang sesuai tipe Next.js
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

    // Ambil BP
    const bpRes = await query(`SELECT bp_value FROM bp_rates WHERE currency=$1`, [
      currency.toUpperCase(),
    ]);
    if (bpRes.rowCount === 0) {
      return NextResponse.json({ error: `BP untuk currency ${currency} belum tersedia` }, { status: 400 });
    }
    const bpValue = parseNumber(bpRes.rows[0].bp_value);

    // Parse angka
    const priceNum = parseNumber(price);
    const landedCostNum = parseNumber(landed_cost) / 100;
    const tplNum = parseNumber(tpl) / 100;

    // Hitung landed IDR price
    const landedIdrPrice = priceNum * (1 + landedCostNum) * tplNum * bpValue;

    // Ambil bom_qty
    const qtyRes = await query(`SELECT bom_qty FROM materials WHERE project_id=$1 AND component=$2`, [
      project_id,
      component,
    ]);
    if (qtyRes.rowCount === 0) {
      return NextResponse.json({ error: `BOM QTY untuk component ${component} tidak ditemukan` }, { status: 400 });
    }
    const bomQty = Number(qtyRes.rows[0].bom_qty);

    // Hitung cost_bearing
    const costBearing = landedIdrPrice * bomQty;

    // UPDATE data
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
