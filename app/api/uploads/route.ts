  import { NextResponse } from 'next/server';
  import { initTables, query } from '../../../lib/db';
  import fs from 'fs/promises';
  import path from 'path';
  import { createClient } from "@supabase/supabase-js";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  export async function POST(req: Request) {
    try {
      await initTables();

      const form = await req.formData();
      const projectId = form.get('projectId') ? Number(form.get('projectId')) : null;
      const materialId = form.get('materialId') ? Number(form.get('materialId')) : null;
      const statusIndex = form.get('statusIndex') != null ? Number(form.get('statusIndex')) : null;

      const files = form.getAll('files') as any[];
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
      }

      const saved: any[] = [];

      for (const f of files) {
        const filename = String(f.name || 'file');
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const buffer = Buffer.from(await f.arrayBuffer());

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')        
          .upload(`uploads/${safeName}`, buffer, {
            contentType: f.type || 'application/octet-stream'
          });

        if (uploadError) {
          return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // get public URL 
        const { data } = supabase.storage.from('uploads').getPublicUrl(`uploads/${safeName}`);
        const publicUrl = data.publicUrl;

        const res = await query(
          `INSERT INTO uploads (project_id, material_id, filename, path, size, mime, status_index) 
          VALUES ($1,$2,$3,$4,$5,$6,$7) 
          RETURNING id, project_id, material_id, filename, path, size, mime, status_index, created_at`,
          [projectId, materialId, filename, publicUrl, buffer.length, f.type || null, statusIndex]
        );

        saved.push(res.rows[0]);
      }

      return NextResponse.json({ uploaded: saved }, { status: 201 });
    } catch (err: any) {
      console.error('[api/uploads] error', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  export async function GET(req: Request) {
    try {
      await initTables();
      const url = new URL(req.url);
      const materialId = url.searchParams.get('materialId');
      const projectId = url.searchParams.get('projectId');
      const statusIndex = url.searchParams.get('statusIndex');

      if (materialId) {
        const res = await query(`SELECT id, project_id, material_id, filename, path, size, mime, status_index, created_at FROM uploads WHERE material_id = $1 ORDER BY created_at DESC`, [Number(materialId)]);
        return NextResponse.json(res.rows);
      }

      if (projectId && statusIndex != null) {
        const res = await query(`SELECT id, project_id, material_id, filename, path, size, mime, status_index, created_at FROM uploads WHERE project_id = $1 AND status_index = $2 ORDER BY created_at DESC`, [Number(projectId), Number(statusIndex)]);
        return NextResponse.json(res.rows);
      }

      if (projectId) {
        const res = await query(`SELECT id, project_id, material_id, filename, path, size, mime, status_index, created_at FROM uploads WHERE project_id = $1 ORDER BY created_at DESC`, [Number(projectId)]);
        return NextResponse.json(res.rows);
      }

      const resAll = await query(`SELECT id, project_id, material_id, filename, path, size, mime, status_index, created_at FROM uploads ORDER BY created_at DESC`);
      return NextResponse.json(resAll.rows);
    } catch (err: any) {
      console.error('[api/uploads] GET error', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  export async function DELETE(req: Request) {
  try {
    await initTables();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID missing" }, { status: 400 });
    }

    // ambil material_id dulu
    const get = await query(
      `SELECT material_id FROM uploads WHERE id = $1`,
      [id]
    );

    if (get.rowCount === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const materialId = get.rows[0].material_id;

    await query(
      `DELETE FROM uploads WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      attachmentId: id,
      materialId
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

  
