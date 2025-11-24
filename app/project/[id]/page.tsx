"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const STATUS_WEIGHTS = [10,20,10,10,20,10,10,5,5];
const STATUS_LABELS = ['Sourching','Quotation','PO Sample','Sample Received','Trial Proses & Report','MOC Release','PPAP & PSW','PO Maspro','Item Receive'];

type Material = { id: number; name: string; percent?: number; status?: boolean[] };
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

  <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

    {/* Left Card: Project Details */}
    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
      <div>
        <div className="text-gray-500 font-semibold text-xl">Project Name:</div>
        <div className="text-xl lg:text-4xl font-extrabold mt-2">{project.name}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="text-gray-500 text-base lg:text-lg">Customer:</div>
          <div className="text-xl lg:text-xl">{project.customer}</div>
        </div>
        <div>
          <div className="text-gray-500 text-base lg:text-lg">Application:</div>
          <div className="text-xl lg:text-xl">{project.application}</div>
        </div>
        <div>
          <div className="text-gray-500 text-base lg:text-xl">Product Line:</div>
          <div className="text-xl lg:text-xl">{project.product_line ?? project.productLine}</div>
        </div>
        <div>
          <div className="text-gray-500 text-base lg:text-xl">Annual Volume:</div>
          <div className="text-xl lg:text-xl">{project.anual_volume}</div>
        </div>
        <div className="sm:col-span-2">
          <div className="text-gray-500 text-sm lg:text-xl">Est SOP Plan:</div>
          <div className="text-xl lg:text-xl">{project.est_sop}</div>
        </div>
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

      {/* Materials List */}
      <div className="space-y-4 mt-6">
        {project.materials.map((m) => (
          <div
            key={m.id}
            className="flex justify-between items-center p-4 rounded-xl bg-gray-50 shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-5 h-5 rounded-sm border ${m.status?.[0] ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              />
              <div className="font-semibold text-lg lg:text-xl">{m.name}</div>
              <div className="text-gray-400 text-lg lg:text-xl">({m.percent ?? 0}%)</div>
            </div>
            <div className="text-right text-gray-500 font-semibold text-lg lg:text-xl w-24">
              {m.percent ?? 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

  );
}
