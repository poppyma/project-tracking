import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   PUT → update Supplier
========================= */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await initTables();

    const body = await req.json();
    const {
      supplier_code,
      supplier_name,
      address,
      country,
      pic,
      email,
      category,
      currency,
      incoterm,
      top,
      forwarder,
    } = body;

    await query(
      `
      UPDATE supplier_master
      SET
        supplier_code = $1,
        supplier_name = $2,
        address = $3,
        country = $4,
        pic = $5,
        email = $6,
        category = $7,
        currency = $8,
        incoterm = $9,
        top = $10,
        forwarder = $11
      WHERE id = $12
      `,
      [
        supplier_code,
        supplier_name,
        address,
        country,
        pic,
        email,
        category,
        currency,
        incoterm,
        top,
        forwarder,
        params.id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → hapus Supplier
========================= */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await initTables();

    await query(
      `DELETE FROM supplier_master WHERE id = $1`,
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
