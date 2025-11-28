import { NextResponse } from 'next/server';
import { initTables, query } from '../../../lib/db';

export async function GET() {
  try {
    await initTables();

    const res = await query(`
      SELECT 
        p.id, p.name, p.customer, p.application, p.product_line,
        p.anual_volume, p.est_sop, p.created_at,
        COALESCE(p.percent, 0) AS percent,

        (
          SELECT json_agg(mat ORDER BY mat.id)
          FROM (
            SELECT
              m.id,
              m.name,
              m.component,
              m.category,
              m.bom_qty,
              m."UoM",
              m.supplier,
              m.status,
              COALESCE(m.percent, 0) AS percent,
              (
                SELECT json_agg(att ORDER BY att.id)
                FROM (
                  SELECT 
                    u.id, u.filename, u.path, u.size, u.mime, u.created_at
                  FROM uploads u
                  WHERE u.material_id = m.id
                  ORDER BY u.id
                ) att
              ) AS attachments
            FROM materials m
            WHERE m.project_id = p.id
            ORDER BY m.id
          ) mat
        ) AS materials

      FROM projects p
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
           (project_id, name, component, category, bom_qty, "UoM", supplier, status, percent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING id, name, component, category, bom_qty, "UoM", supplier, status, percent`,
          [
            projectId,
            materialName,
            m.component ?? "",
            m.category ?? "",
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

    const cur = await query(`SELECT id, project_id, status FROM materials WHERE id = $1`, [materialId]);
    if (cur.rowCount === 0) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

    const STATUS_WEIGHTS = [10,20,10,10,20,10,10,5,5];
    const STATUS_COUNT = STATUS_WEIGHTS.length;

    let statusArr = Array(STATUS_COUNT).fill(false);

    if (Array.isArray(cur.rows[0].status)) {
      const raw = cur.rows[0].status.map((v: any) => Boolean(v));
      statusArr = raw.concat(Array(STATUS_COUNT - raw.length).fill(false)).slice(0, STATUS_COUNT);
    }

    statusArr[statusIndex] = Boolean(value);

    const materialPercent = statusArr.reduce(
      (sum, v, i) => sum + (v ? STATUS_WEIGHTS[i] : 0),
      0
    );

    await query(
      `UPDATE materials SET status=$1, percent=$2 WHERE id=$3`,
      [JSON.stringify(statusArr), materialPercent, materialId]
    );

    // hitung project percent
    const mats = await query(`SELECT COALESCE(percent,0) as percent FROM materials WHERE project_id=$1`, [cur.rows[0].project_id]);

    let projectPercent = 0;
    const count = mats?.rowCount ?? 0;

    if (count > 0) {
      const total = mats.rows.reduce((a: number, r: any) => a + Number(r.percent || 0), 0);
      projectPercent = Math.round(total / count);
    }


      await query(`UPDATE projects SET percent=$1 WHERE id=$2`, [projectPercent, cur.rows[0].project_id]);

      const updatedMat = await query(
        `SELECT id, name, status, percent FROM materials WHERE id=$1`,
        [materialId]
      );

      return NextResponse.json({
        materialId,
        material: updatedMat.rows[0],
        materialPercent,
        projectPercent,
        projectId: cur.rows[0].project_id
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
