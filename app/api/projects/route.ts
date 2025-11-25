import { NextResponse } from 'next/server';
import { initTables, query } from '../../../lib/db';

export async function GET() {
  try {
    await initTables();

    const res = await query(`
      SELECT p.id, p.name, p.customer, p.application, p.product_line, p.anual_volume, p.est_sop, p.created_at, COALESCE(p.percent,0) as percent,
        COALESCE(json_agg(
          json_build_object(
            'id', m.id,
            'name', m.name,
            'component', m.component,
            'category', m.category,
            'bom_qty', m.bom_qty,
            'uom', m."UoM",
            'supplier', m.supplier,
            'status', m.status,
            'percent', COALESCE(m.percent,0),
            'attachments', ...
          )

        ) FILTER (WHERE m.id IS NOT NULL), '[]') AS materials
      FROM projects p
      LEFT JOIN materials m ON m.project_id = p.id
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

    // 1️⃣ Insert Project
    const insertProject = await query(
      `INSERT INTO projects (name, customer, application, product_line, anual_volume, est_sop)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, customer, application, product_line, anual_volume, est_sop, created_at`,
      [name, customer, application, productLine, anualVolume, estSop]
    );

    const proj = insertProject.rows[0];
    const projectId = proj.id;

    // 2️⃣ Insert materials + atribut lengkap
    let createdMaterials: any[] = [];
    if (Array.isArray(materials) && materials.length > 0) {

      const STATUS_COUNT = 9;
      const defaultStatus = JSON.stringify(Array(STATUS_COUNT).fill(false));

      
      const materialPromises = materials.map((m: any) =>
  query(
    `INSERT INTO materials
     (project_id, name, component, category, bom_qty, "UoM", supplier, status, percent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, name, component, category, bom_qty, "UoM", supplier, status, percent`,
    [
      projectId,
      m.material ?? "",     // → name
      m.component ?? "",
      m.category ?? "",
      m.qty ?? 0,           // → bom_qty
      m.uom ?? "",          // → UoM
      m.supplier ?? "",
      defaultStatus,
      0
    ]
  )
);



      const results = await Promise.all(materialPromises);
      createdMaterials = results.flatMap((r) => r.rows);
    }

    // 3️⃣ Build response JSON untuk frontend
    return NextResponse.json(
      {
        id: projectId,
        name: proj.name,
        customer: proj.customer,
        application: proj.application,
        product_line: proj.product_line,
        anual_volume: proj.anual_volume,
        est_sop: proj.est_sop,
        created_at: proj.created_at,
        percent: proj.percent ?? 0,
        materials: createdMaterials,
      },
      { status: 201 }
    );

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { materialId, statusIndex, value } = body as { materialId: number; statusIndex: number; value: boolean };

    if (!materialId || statusIndex == null) {
      return NextResponse.json({ error: 'materialId and statusIndex required' }, { status: 400 });
    }

    // status weights used by client
    const STATUS_WEIGHTS = [10,20,10,10,20,10,10,5,5];
    const STATUS_COUNT = STATUS_WEIGHTS.length;

    // fetch existing status and project id
    const cur = await query(`SELECT id, project_id, status FROM materials WHERE id = $1`, [materialId]);
    if (cur.rowCount === 0) return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    const row = cur.rows[0];
    let statusArr: boolean[] = Array(STATUS_COUNT).fill(false);
    if (row.status && Array.isArray(row.status)) {
      statusArr = row.status.map((v: any) => Boolean(v));
      if (statusArr.length < STATUS_COUNT) statusArr = statusArr.concat(Array(STATUS_COUNT - statusArr.length).fill(false));
    }

    statusArr[statusIndex] = Boolean(value);

    // update material status and its percent
    const materialPercent = statusArr.reduce((acc, cur, i) => acc + (cur ? STATUS_WEIGHTS[i] : 0), 0);
    await query(`UPDATE materials SET status = $1, percent = $2 WHERE id = $3`, [JSON.stringify(statusArr), materialPercent, materialId]);

    // compute project percent (average of materials)
    const mats = await query(`SELECT COALESCE(percent,0) as percent FROM materials WHERE project_id = $1`, [row.project_id]);
    const matRows = mats.rows || [];
    let projectPercent = 0;
    if (matRows.length > 0) {
      const total = matRows.reduce((acc: number, m: any) => acc + (Number(m.percent) || 0), 0);
      projectPercent = Math.round(total / matRows.length);
    }

    // persist project percent
    await query(`UPDATE projects SET percent = $1 WHERE id = $2`, [projectPercent, row.project_id]);

    // fetch updated material row to return full info
    const matRes = await query(`SELECT id, name, status, percent FROM materials WHERE id = $1`, [materialId]);
    const updatedMaterial = matRes.rows[0] || null;

    console.log('[api/projects] PATCH material', materialId, 'statusIndex', statusIndex, 'value', value, 'materialPercent', materialPercent, 'projectPercent', projectPercent);

    return NextResponse.json({ materialId, material: updatedMaterial, materialPercent, projectPercent, projectId: row.project_id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { id } = body as { id?: number };
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    // delete will cascade to materials and uploads/remarks due to FK ON DELETE CASCADE
    const res = await query(`DELETE FROM projects WHERE id = $1 RETURNING id`, [id]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    console.log('[api/projects] Deleted project', id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
