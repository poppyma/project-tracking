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
      supplier_id, // ⬅️ UUID dari frontend
      desc,
      fb_type,
      commodity,
      ipd_quotation,
    } = await req.json();

    if (!ipd_siis || !supplier_id) {
      return NextResponse.json(
        { error: "IPD SIIS dan Supplier wajib diisi" },
        { status: 400 }
      );
    }

    // 🔥 lookup supplier_name
    const supplierRes = await query(
      `SELECT supplier_name FROM supplier_master WHERE id = $1`,
      [supplier_id]
    );

    if (supplierRes.rowCount === 0) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan" },
        { status: 400 }
      );
    }

    const supplier_name = supplierRes.rows[0].supplier_name;

    await query(
      `
      UPDATE ipd_master
      SET
        ipd_siis = $1,
        supplier = $2,
        "DESC" = $3,
        fb_type = $4,
        commodity = $5,
        ipd_quotation = $6
      WHERE id = $7
      `,
      [
        ipd_siis,
        supplier_name, // ⬅️ SIMPAN NAMA
        desc || null,
        fb_type || null,
        commodity || null,
        ipd_quotation || null,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT IPD ERROR:", error);
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
