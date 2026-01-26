import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "IDs wajib diisi" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM price_detail WHERE id = ANY($1)`,
      [ids]
    );

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Bulk delete gagal" },
      { status: 500 }
    );
  }
}
