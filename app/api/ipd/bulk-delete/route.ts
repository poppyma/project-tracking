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
        { message: "Invalid ids" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM ipd_master WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { message: "Bulk delete failed" },
      { status: 500 }
    );
  }
}
