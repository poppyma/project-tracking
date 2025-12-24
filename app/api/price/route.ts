import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST → insert header + detail
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplier_id, header, details } = body;

    if (!supplier_id || !header?.start_date || !header?.end_date) {
      return NextResponse.json({ error: "Header tidak lengkap" }, { status: 400 });
    }

    // Ambil YYYY-MM-DD saja supaya tidak ada T00:00:00.000Z
    const startDateOnly = header.start_date.split("T")[0];
    const endDateOnly = header.end_date ? header.end_date.split("T")[0] : null;

    // INSERT HEADER
    const headerRes = await query(
      `INSERT INTO price_header
      (supplier_id, start_date, end_date, quarter)
      VALUES ($1,$2,$3,$4)
      RETURNING id`,
      [supplier_id, startDateOnly, endDateOnly, header.quarter]
    );
    const headerId = headerRes.rows[0].id;

    // INSERT DETAILS
    for (const d of details) {
    const rawPrice = String(d.price).replace(/,/g, "");
    const finalPrice = Number(rawPrice);

    if (isNaN(finalPrice)) {
      return NextResponse.json(
        { error: `Invalid price value: ${d.price}` },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO price_detail
      (header_id, ipd_quotation, ipd_siis, description, steel_spec, material_source, tube_route, price)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        headerId,
        d.ipd_quotation || null,
        d.ipd_siis || null,
        d.description || null,
        d.steel_spec || null,
        d.material_source || null,
        d.tube_route || null,
        finalPrice,
      ]
    );
  }


    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PRICE POST ERROR:", err);
    return NextResponse.json({ error: "Failed to save price" }, { status: 500 });
  }
}

// GET → fetch price detail or list quarter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");
    const quarter = searchParams.get("quarter");
    const listQuarter = searchParams.get("list_quarter");

    if (!supplier_id) return NextResponse.json([]);

    // Jika request untuk list quarter
    if (listQuarter === "true") {
      const qResult = await query(
        `SELECT DISTINCT quarter FROM price_header WHERE supplier_id = $1 ORDER BY quarter`,
        [supplier_id]
      );
      const quarters = qResult.rows.map((r) => r.quarter);
      return NextResponse.json(quarters);
    }

    // Fetch price detail (opsional filter quarter)
    const sql = `
      SELECT
        h.id AS header_id,
        h.start_date,
        h.end_date,
        h.quarter,
        d.id AS detail_id,
        d.ipd_quotation,
        d.ipd_siis,
        d.description,
        d.steel_spec,
        d.material_source,
        d.tube_route,
        d.price
      FROM price_header h
      JOIN price_detail d ON d.header_id = h.id
      WHERE h.supplier_id = $1
      ${quarter ? "AND h.quarter = $2" : ""}
      ORDER BY h.start_date DESC, d.ipd_siis
    `;
    const params = quarter ? [supplier_id, quarter] : [supplier_id];
    const result = await query(sql, params);

    // Format tanggal
    const rows = result.rows.map((r) => ({
      ...r,
      start_date: r.start_date?.toISOString().split("T")[0],
      end_date: r.end_date?.toISOString().split("T")[0],
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET PRICE ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}


type Params = {
  params: { id: string };
};

/* ================= DELETE PRICE DETAIL ================= */
export async function DELETE(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Detail ID tidak ditemukan" },
        { status: 400 }
      );
    }

    await query(
      `DELETE FROM price_detail WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE PRICE DETAIL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete price detail" },
      { status: 500 }
    );
  }
}


/* ================= UPDATE PRICE DETAIL ================= */
export async function PUT(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = params;
    const body = await req.json();

    const {
      ipd_quotation,
      ipd_siis,
      description,
      steel_spec,
      material_source,
      tube_route,
      price,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Detail ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const rawPrice = String(price).replace(/,/g, "");
    const finalPrice = Number(rawPrice);

    if (isNaN(finalPrice)) {
      return NextResponse.json(
        { error: "Invalid price value" },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE price_detail
      SET
        ipd_quotation = $1,
        ipd_siis = $2,
        description = $3,
        steel_spec = $4,
        material_source = $5,
        tube_route = $6,
        price = $7
      WHERE id = $8
      `,
      [
        ipd_quotation || null,
        ipd_siis || null,
        description || null,
        steel_spec || null,
        material_source || null,
        tube_route || null,
        finalPrice,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("UPDATE PRICE DETAIL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update price detail" },
      { status: 500 }
    );
  }
}
