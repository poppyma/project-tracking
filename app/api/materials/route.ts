import { NextResponse } from "next/server";
import { initTables, query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initTables();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    const res = await query(
      `
      SELECT DISTINCT component
      FROM materials
      WHERE project_id = $1
        AND component IS NOT NULL
        AND component <> ''
      ORDER BY component ASC
      `,
      [projectId]
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("GET materials error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
