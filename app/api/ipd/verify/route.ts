import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ipd_siis = searchParams.get("ipd_siis");

    if (!ipd_siis) {
      return NextResponse.json(
        { error: "ipd_siis required" },
        { status: 400 }
      );
    }

    const res = await query(
      `
      SELECT
        ipd_siis,
        ipd_quotation,
        price_reference
      FROM ipd_master
      WHERE ipd_siis = $1
      `,
      [ipd_siis]
    );

    if (res.rowCount === 0 || !res.rows[0].ipd_quotation) {
      return NextResponse.json({
        exists: false,
        hasQuotation: false,
        price: "",
      });
    }

    return NextResponse.json({
      exists: true,
      hasQuotation: true,
      price: res.rows[0].price_reference || "",
    });
  } catch (err) {
    console.error("VERIFY IPD ERROR:", err);
    return NextResponse.json(
      { error: "Failed to verify IPD" },
      { status: 500 }
    );
  }
}
