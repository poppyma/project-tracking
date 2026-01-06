import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await query(
      `DELETE FROM price_detail WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE PRICE DETAIL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete price detail" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE ================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const rawPrice = String(body.price ?? "").replace(/,/g, "");
    const finalPrice = Number(rawPrice);

    if (isNaN(finalPrice)) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE price_detail
      SET
        description = $1,
        steel_spec = $2,
        material_source = $3,
        tube_route = $4,
        price = $5
      WHERE id = $6
      `,
      [
        body.description ?? null,
        body.steel_spec ?? null,
        body.material_source ?? null,
        body.tube_route ?? null,
        finalPrice,
        id,
      ]
    );


    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UPDATE PRICE DETAIL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update price detail" },
      { status: 500 }
    );
  }
}
