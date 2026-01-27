import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   PUT → update IPD
========================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initTables();

    const { id } = await context.params;

    const {
      ipd_siis,
      supplier,
      desc,
      fb_type,
      commodity,
      ipd_quotation,
    } = await req.json();

    await query(
      `
      UPDATE ipd_master
      SET
        ipd_siis = $1,
        supplier = $2,
        "desc" = $3,
        fb_type = $4,
        commodity = $5,
        ipd_quotation = $6
      WHERE id = $7
      `,
      [
        ipd_siis,
        supplier,
        desc,
        fb_type,
        commodity,
        ipd_quotation,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update IPD data" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → hapus IPD
========================= */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initTables();

    const { id } = await context.params;

    await query(
      `
      DELETE FROM ipd_master
      WHERE id = $1
      `,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete IPD data" },
      { status: 500 }
    );
  }
}
