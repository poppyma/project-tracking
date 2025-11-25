"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const STATUS_WEIGHTS = [10,20,10,10,20,10,10,5,5];
const STATUS_LABELS = ['Sourching','Quotation','PO Sample','Sample Received','Trial Proses & Report','MOC Release','PPAP & PSW','PO Maspro','Item Receive'];

// type Material = { id: number; name: string; percent?: number; status?: boolean[] };

type Material = {
  id: number;
  project_id: number;
  name: string;
  component?: string;
  category?: string;
  bom_qty?: number;
  UoM?: string;
  supplier?: string;
  status?: boolean[];
  percent?: number;
};

type Project = { id: number; name: string; customer?: string; application?: string; product_line?: string; productLine?: string; anual_volume?: string; est_sop?: string; percent?: number; materials: Material[] };

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id || 0);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  // upload handled on main page detail grid; no per-material upload here

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed');
        const list = await res.json();
        const p = list.find((x: any) => Number(x.id) === id);
        if (p) setProject(p);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    if (id) load();
  }, [id]);

  function computeProjectPercent(proj: Project) {
    if (!proj.materials || proj.materials.length === 0) return 0;
    // use stored percent if present
    if (typeof proj.percent === 'number') return proj.percent;
    const total = proj.materials.reduce((acc, m) => acc + (Number(m.percent) || 0), 0);
    return Math.round(total / Math.max(1, proj.materials.length));
  }

  if (!project && loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!project) return (
    <div style={{ padding: 24 }}>
      <button className="btn secondary" onClick={() => router.push('/')}>← Back to project list</button>
      <h2 style={{ marginTop: 16 }}>Project not found</h2>
    </div>
  );

  const projPercent = computeProjectPercent(project);

  return (
    <div className="p-8 space-y-8">
  <button
    className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-100"
    onClick={() => router.push('/')}
  >
    ← Back to project list
  </button>

<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8">

  {/* Left Card: Project Details */}
  <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
    {/* Project Name */}
    <div>
      <div className="text-gray-500 font-semibold text-lg sm:text-base md:text-lg lg:text-xl">
        Project Name:
      </div>
      <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mt-2 break-words">
        {project.name}
      </div>
    </div>

    {/* Customer */}
    <div>
      <div className="text-gray-500 text-sm sm:text-base md:text-sm lg:text-base">
        Customer:
      </div>
      <div className="text-lg sm:text-xl md:text-lg lg:text-xl break-words">{project.customer}</div>
    </div>

    {/* Application */}
    <div>
      <div className="text-gray-500 text-sm sm:text-base md:text-sm lg:text-base">
        Application:
      </div>
      <div className="text-lg sm:text-xl md:text-lg lg:text-xl break-words">{project.application}</div>
    </div>

    {/* Product Line */}
    <div>
      <div className="text-gray-500 text-sm sm:text-base md:text-sm lg:text-base">
        Product Line:
      </div>
      <div className="text-lg sm:text-xl md:text-lg lg:text-xl break-words">
        {project.product_line ?? project.productLine}
      </div>
    </div>

    {/* Annual Volume */}
    <div>
      <div className="text-gray-500 text-sm sm:text-base md:text-sm lg:text-base">
        Annual Volume:
      </div>
      <div className="text-lg sm:text-xl md:text-lg lg:text-xl break-words">{project.anual_volume}</div>
    </div>

    {/* Est SOP Plan */}
    <div>
      <div className="text-gray-500 text-sm sm:text-base md:text-sm lg:text-base">
        Est SOP Plan:
      </div>
      <div className="text-lg sm:text-xl md:text-lg lg:text-xl break-words">{project.est_sop}</div>
    </div>
  </div>

  {/* Right Card: Status & Materials */}
  <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
    {/* Status */}
    <div className="flex flex-col items-start gap-5">
      <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-lg lg:text-xl">
        Status Project
      </div>
      <div className="text-6xl lg:text-5xl font-extrabold">{projPercent}%</div>
    </div>

    {/* Materials Table */}
    <div className="mt-10">
      <div className="text-xl font-bold mb-4 text-blue-700">Material Details</div>

      <div className="overflow-x-auto rounded-xl shadow">
        <table className="min-w-full bg-white border border-gray-200 rounded-xl">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">BOM Qty</th>
              <th className="px-4 py-3">UoM</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3 text-center">Percent</th>
            </tr>
          </thead>
          <tbody>
            {project.materials.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold">{m.name}</td>
                <td className="px-4 py-3">{m.component || "-"}</td>
                <td className="px-4 py-3">{m.category || "-"}</td>
                <td className="px-4 py-3">{m.bom_qty ?? "-"}</td>
                <td className="px-4 py-3">{m.UoM || "-"}</td>
                <td className="px-4 py-3">{m.supplier || "-"}</td>
                <td className="px-4 py-3 text-center font-semibold text-blue-700">{m.percent ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>

</div>




</div>


  );
}
