import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initTables();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id wajib" },
        { status: 400 }
      );
    }

    /**
     * Ambil harga TERENDAH per component
     */
    const res = await query(`
      SELECT
        component,
        MIN(landed_idr_price::numeric) AS min_cost
      FROM bom_costs
      WHERE project_id = $1
      GROUP BY component
      ORDER BY component
    `, [projectId]);

    /**
     * Hitung total cost/bearing
     */
    const totalRes = await query(`
      SELECT
        SUM(min_cost) AS total_cost
      FROM (
        SELECT
          component,
          MIN(landed_idr_price::numeric) AS min_cost
        FROM bom_costs
        WHERE project_id = $1
        GROUP BY component
      ) t
    `, [projectId]);

    return NextResponse.json({
      components: res.rows,
      total_cost: totalRes.rows[0].total_cost || 0,
    });

  } catch (err: any) {
    console.error("GET bom-cost-summary error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
