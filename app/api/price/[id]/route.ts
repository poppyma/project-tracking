import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

/* =========================
   PUT → update Price
========================= */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initTables();
    const { id } = await params;

    const body = await req.json();
    const {
      ipd,
      description,
      steel_spec,
      material_source,
      tube_route,
      price,
    } = body;

    await query(
      `
      UPDATE price_master
      SET
        ipd = $1,
        description = $2,
        steel_spec = $3,
        material_source = $4,
        tube_route = $5,
        price = $6
      WHERE id = $7
      `,
      [
        ipd,
        description,
        steel_spec,
        material_source,
        tube_route,
        price,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update price" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE → hapus Price
========================= */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initTables();
    const { id } = await params;

    await query(`DELETE FROM price_master WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete price" },
      { status: 500 }
    );
  }
}
