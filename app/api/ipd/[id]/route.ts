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
      description,
      fb_type,
      commodity,
      ipd_quotation,
    } = await req.json();

    await query(
      `
      UPDATE ipd_master
      SET
        ipd_siis = $1,
        description = $2,
        fb_type = $3,
        commodity = $4,
        ipd_quotation = $5
      WHERE id = $6
      `,
      [
        ipd_siis,
        description,
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
