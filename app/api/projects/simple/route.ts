import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET() {
  try {
    await initTables();

    const res = await query(`
      SELECT id, name
      FROM projects
      ORDER BY created_at DESC
    `);

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("GET projects/simple error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
