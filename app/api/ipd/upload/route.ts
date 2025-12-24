import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/* ================= UPLOAD CSV ================= */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);

    // Ambil header
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase());

    const idx = {
      ipd_siis: headers.indexOf("ipd_siis"),
      description: headers.indexOf("description"),
      fb_type: headers.indexOf("fb_type"),
      commodity: headers.indexOf("commodity"),
      ipd_quotation: headers.indexOf("ipd_quotation"),
    };

    if (idx.ipd_siis === -1) {
      return NextResponse.json(
        { error: "Header ipd_siis wajib ada" },
        { status: 400 }
      );
    }

    // Loop data
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (!cols[idx.ipd_siis]) continue;

      await query(
        `
        INSERT INTO ipd_master
        (ipd_siis, description, fb_type, commodity, ipd_quotation)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (ipd_siis) DO NOTHING
        `,
        [
          cols[idx.ipd_siis],
          cols[idx.description] || null,
          cols[idx.fb_type] || null,
          cols[idx.commodity] || null,
          cols[idx.ipd_quotation] || null,
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UPLOAD IPD ERROR:", err);
    return NextResponse.json(
      { error: "Upload gagal" },
      { status: 500 }
    );
  }
}
