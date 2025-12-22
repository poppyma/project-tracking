import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET() {
  try {
    await initTables();

    const result = await query(`
      SELECT id, ipd_siis
      FROM ipd_master
      ORDER BY ipd_siis ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch IPD" },
      { status: 500 }
    );
  }
}
