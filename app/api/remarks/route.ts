import { NextResponse } from 'next/server';
import { initTables, query } from '../../../lib/db';

export async function GET(req: Request) {
  try {
    await initTables();

    // Aman untuk Vercel, fallback ke localhost jika req.url undefined
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';
    const url = new URL(req.url || baseUrl);

    const projectId = url.searchParams.get('projectId');
    const statusIndex = url.searchParams.get('statusIndex');

    let sql = `SELECT id, project_id, status_index, text, created_at FROM remarks`;
    const params: any[] = [];
    const where: string[] = [];
    if (projectId) {
      params.push(projectId);
      where.push(`project_id = $${params.length}`);
    }
    if (statusIndex != null) {
      params.push(statusIndex);
      where.push(`status_index = $${params.length}`);
    }
    if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
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
    const { projectId, statusIndex, text } = body;
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    if (statusIndex == null) return NextResponse.json({ error: 'statusIndex required' }, { status: 400 });
    if (typeof text !== 'string' || text.trim().length === 0) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const res = await query(`INSERT INTO remarks (project_id, status_index, text) VALUES ($1,$2,$3) RETURNING id, project_id, status_index, text, created_at`, [projectId, statusIndex, text.trim()]);
    const row = res.rows[0];
    console.log('[api/remarks] Created remark', row.id, 'project', projectId, 'status', statusIndex);
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { id, text } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (typeof text !== 'string' || text.trim().length === 0) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const res = await query(`UPDATE remarks SET text = $1 WHERE id = $2 RETURNING id, project_id, status_index, text, created_at`, [text.trim(), id]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'Remark not found' }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initTables();
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const res = await query(`DELETE FROM remarks WHERE id = $1 RETURNING id`, [id]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'Remark not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

