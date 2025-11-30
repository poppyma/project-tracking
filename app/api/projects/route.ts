import { NextResponse } from 'next/server';
import { initTables, query } from '../../../lib/db';

export async function GET() {
  try {
    await initTables();

    const res = await query(`
      SELECT 
        p.id, 
        p.name, 
        p.customer, 
        p.application, 
        p.product_line, 
        p.anual_volume, 
        p.est_sop, 
        p.created_at,
        COALESCE(p.percent,0) AS percent,

        COALESCE(
          json_agg(material_row ORDER BY material_row.id) 
        , '[]') AS materials

      FROM projects p
      LEFT JOIN LATERAL (
        SELECT 
          m.id,
          m.name,
          m.component,
          m.category,
          m.bom_qty,
          m."UoM",
          m.supplier,
          m.status,
          COALESCE(m.percent,0) AS percent,
          (
            SELECT json_agg(
              json_build_object(
                'id', u.id,
                'filename', u.filename,
                'path', u.path,
                'size', u.size,
                'mime', u.mime,
                'created_at', u.created_at
              )
            )
            FROM uploads u 
            WHERE u.material_id = m.id
          ) AS attachments
        FROM materials m
        WHERE m.project_id = p.id
        ORDER BY m.id ASC
      ) AS material_row ON TRUE

      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { name, customer, application, productLine, anualVolume, estSop, materials } = body;

    const insertProject = await query(
      `INSERT INTO projects (name, customer, application, product_line, anual_volume, est_sop)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, customer, application, product_line, anual_volume, est_sop, created_at`,
      [name, customer, application, productLine, anualVolume, estSop]
    );

    const proj = insertProject.rows[0];
    const projectId = proj.id;

    let createdMaterials: any[] = [];

    if (Array.isArray(materials)) {
      const STATUS_COUNT = 9;
      const defaultStatus = JSON.stringify(Array(STATUS_COUNT).fill(false));

      const promises = materials.map((m: any) => {
        const materialName = m.name ?? m.material ?? "";

        const qty = Number(m.qty) || 0; // FIX qty error

        return query(
          `INSERT INTO materials 
           (project_id, name, component, bom_qty, "UoM", supplier, status, percent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING id, name, component, bom_qty, "UoM", supplier, status, percent`,
          [
            projectId,
            materialName,
            m.component ?? "",
            qty,
            m.uom ?? "",
            m.supplier ?? "",
            defaultStatus,
            0
          ]
        );
      });

      const results = await Promise.all(promises);
      createdMaterials = results.flatMap(r => r.rows);
    }

    return NextResponse.json({
      id: proj.id,
      name: proj.name,
      customer: proj.customer,
      application: proj.application,
      product_line: proj.product_line,
      anual_volume: proj.anual_volume,
      est_sop: proj.est_sop,
      created_at: proj.created_at,
      percent: proj.percent ?? 0,
      materials: createdMaterials
    }, { status: 201 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { materialId, statusIndex, value } = body;

    if (!materialId || statusIndex == null) {
      return NextResponse.json({ error: 'materialId and statusIndex required' }, { status: 400 });
    }

    // Weights
    const STATUS_WEIGHTS = [10,20,10,10,20,10,10,5,5];
    const STATUS_COUNT = STATUS_WEIGHTS.length;

    // Get current material
    const cur = await query(`SELECT id, project_id, status FROM materials WHERE id = $1`, [materialId]);
    if (cur.rowCount === 0)
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });

    const row = cur.rows[0];
    let statusArr: boolean[] = Array(STATUS_COUNT).fill(false);

    if (Array.isArray(row.status)) {
      statusArr = row.status.map(Boolean);
    }

    statusArr[statusIndex] = Boolean(value);

    // Compute percent
    const materialPercent = statusArr.reduce(
      (acc, cur, i) => acc + (cur ? STATUS_WEIGHTS[i] : 0),
      0
    );

    await query(
      `UPDATE materials SET status = $1, percent = $2 WHERE id = $3`,
      [JSON.stringify(statusArr), materialPercent, materialId]
    );

    // Update project percent
    const mats = await query(
      `SELECT COALESCE(percent,0) as percent FROM materials WHERE project_id = $1`,
      [row.project_id]
    );

    const totals = mats.rows.reduce(
      (acc, m) => acc + (Number(m.percent) || 0),
      0
    );
    const projectPercent = Math.round(totals / mats.rows.length);

    await query(`UPDATE projects SET percent = $1 WHERE id = $2`,
      [projectPercent, row.project_id]
    );

    // 🔥 AMBIL ULANG 1 PROJECT DENGAN MATERIALS TERURUT
    const updatedProject = await query(`
      SELECT 
        p.id, p.name, p.customer, p.application, p.product_line,
        p.anual_volume, p.est_sop, p.created_at,
        COALESCE(p.percent,0) AS percent,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'name', m.name,
              'component', m.component,
              'category', m.category,
              'bom_qty', m.bom_qty,
              'UoM', m."UoM",
              'supplier', m.supplier,
              'status', m.status,
              'percent', m.percent
            )
            ORDER BY m.id ASC
          ) FILTER (WHERE m.id IS NOT NULL)
        , '[]') AS materials
      FROM projects p
      LEFT JOIN materials m ON m.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [row.project_id]);

    return NextResponse.json({
      success: true,
      project: updatedProject.rows[0]
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    await initTables();
    const { id } = await req.json();

    const res = await query(`DELETE FROM projects WHERE id = $1 RETURNING id`, [id]);
    if (res.rowCount === 0)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
