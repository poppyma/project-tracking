export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ipd_siis = searchParams.get("ipd_siis");

    if (!ipd_siis) {
      return NextResponse.json(
        { exists: false },
        { status: 400 }
      );
    }

    const normalized = ipd_siis
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

    const res = await query(
      `
      SELECT 1
      FROM ipd_master
      WHERE UPPER(ipd_siis) = $1
      LIMIT 1
      `,
      [normalized]
    );

    return NextResponse.json({
      exists: (res.rowCount ?? 0) > 0,
    });
  } catch (err) {
    console.error("VERIFY IPD ERROR:", err);
    return NextResponse.json(
      { exists: false },
      { status: 500 }
    );
  }
}
