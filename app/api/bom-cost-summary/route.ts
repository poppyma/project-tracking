import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initTables();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json([]);
    }

    const res = await query(
      `
      SELECT
        bc.id,
        bc.component,
        bc.candidate_supplier,
        bc.cost_bearing
      FROM bom_costs bc
      WHERE bc.project_id = $1::int
      ORDER BY bc.component ASC
      `,
      [Number(projectId)]
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("GET bom-summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
