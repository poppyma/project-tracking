"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

type Material = { id: number; name: string; percent?: number; status?: boolean[] };
type Attachment = { id: number; filename: string; path: string; size?: number; mime?: string; created_at?: string };
type MaterialExt = Material & { attachments?: Attachment[] };

type Project = {
  id: number;
  name: string;
  customer: string;
  application: string;
  productLine: string;
  anualVolume: string;
  estSop: string;
  materials: Material[];
  percent?: number;
};

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const [materialInput, setMaterialInput] = useState("");
  const [materials, setMaterials] = useState([
  { material: "", component: "", category: "", qty: "", uom: "", supplier: "" },
]);


const addRow = () => {
  setMaterials([
    ...materials,
    { material: "", component: "", category: "", qty: "", uom: "", supplier: "" },
  ]);
};

const deleteRow = (index: number) => {
  setMaterials(materials.filter((_, i) => i !== index));
};

const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

const handleChange = (
  index: number,
  field: keyof (typeof materials)[number],
  value: string
) => {
  const updated = [...materials];
  updated[index][field] = value;
  setMaterials(updated);
};


function resetForm() {
  setForm({ name: "", customer: "", application: "", productLine: "", anualVolume: "", estSop: "", material: ""});
  setMaterials([]);
  setMaterialInput("");
}

async function reloadProjects() {
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) return;
    const data = await res.json();
    const list: Project[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      customer: r.customer,
      application: r.application,
      productLine: r.product_line ?? r.productLine ?? '',
      anualVolume: r.anual_volume ?? r.anualVolume ?? '',
      estSop: r.est_sop ?? r.estSop ?? '',
      percent: r.percent ?? 0,
      materials: (r.materials || [])
      .sort((a: any, b: any) => a.id - b.id)  // <--- tambahkan ini
      .map((m: any) => ({
        id: m.id,
        name: m.name,
        percent: m.percent,
        status: m.status,
        attachments: m.attachments,
        component: m.component,
        category: m.category,
        bom_qty: m.bom_qty,
        UoM: m.UoM,
        supplier: m.supplier
      })) as any,

    }));

    const initialStatuses: Record<number, boolean[][]> = {};
    list.forEach((proj) => {
      initialStatuses[proj.id] = (proj.materials || []).map((m: any) => normalizeStatusArray((m as any).status));
    });

    setProjects(list);
    setStatuses(initialStatuses);
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('selectedProjectId');
        if (stored) {
          const sid = Number(stored);
          const found = list.find((p) => p.id === sid);
          if (found) {
            selectProject(sid);
          }
        }
      }
    } catch (err) {
      console.error('Failed to restore selected project', err);
    }
  } catch (err) {
    console.error('Failed to load projects', err);
  }
}

useEffect(() => { reloadProjects(); }, []);

async function handleSave() {
  try {
    const payload = {
      name: form.name,
      customer: form.customer,
      application: form.application,
      productLine: form.productLine,
      anualVolume: form.anualVolume,
      estSop: form.estSop,
      materials,
    };

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to save project');

    const created = await res.json();

    const proj: Project = {
      id: created.id,
      name: created.name,
      customer: created.customer,
      application: created.application,
      productLine: created.product_line ?? created.productLine ?? '',
      anualVolume: created.anual_volume ?? created.anualVolume ?? '',
      estSop: created.est_sop ?? created.estSop ?? '',
      percent: created.percent ?? 0,
      materials: created.materials ?? [],
    };

    const newStatusesEntry = (created.materials || []).map((m: any) => normalizeStatusArray((m as any).status));

    setProjects((p) => [proj, ...p]);
    setStatuses((s) => ({ ...s, [proj.id]: newStatusesEntry }));
    setShowModal(false);
    resetForm();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2200);
  } catch (err) {
    console.error(err);
    alert('Gagal menyimpan data. Cek console untuk detail.');
  }
}

function addMaterial() {
  if (!materialInput.trim()) {
    setErrors(prev => ({ ...prev, material: "Material is required" }));
    return;
  }

  setMaterials(prev => [
    ...prev,
    {
      material: materialInput.trim(),
      component: "",
      category: "",
      qty: "",
      uom: "",
      supplier: ""
    }
  ]);
  setMaterialInput("");
  setErrors(prev => ({ ...prev, material: "" }));
}

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectUploads, setProjectUploads] = useState<Attachment[]>([]);
  const [attachmentsModal, setAttachmentsModal] = useState<{ open: boolean; statusIndex?: number; items?: any[] }>({ open: false });
  const [remarkModal, setRemarkModal] = useState<{ open: boolean; statusIndex?: number; text?: string }>({ open: false });
  const [remarksMap, setRemarksMap] = useState<Record<number, any[]>>({});
  const [remarksModal, setRemarksModal] = useState<{ open: boolean; statusIndex?: number; items?: any[]; editingId?: number; editingText?: string }>({ open: false });

  const [statuses, setStatuses] = useState<Record<number, boolean[][]>>({});

  const STATUS_COUNT = 9; 
  const STATUS_WEIGHTS = [10,20,10,10,20,10,10,5,5];

  function computeMaterialPercentFromChecks(checks: boolean[]) {
    return checks.reduce((acc, c, i) => acc + (c ? STATUS_WEIGHTS[i] : 0), 0);
  }

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch file');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed', err);
    alert('Download gagal');
  }
}

function normalizeStatusArray(src: any): boolean[] {
  if (!Array.isArray(src)) return Array(STATUS_COUNT).fill(false);
  const arr = src.map((v: any) => Boolean(v));
  if (arr.length < STATUS_COUNT) return arr.concat(Array(STATUS_COUNT - arr.length).fill(false));
  return arr.slice(0, STATUS_COUNT);
}

const [hover, setHover] = useState<{ open: boolean; x?: number; y?: number; items?: Array<{label:string, weight:number, checked:boolean}> }>({ open: false });

function showHover(projectId: number, materialIndex: number, e: React.MouseEvent) {
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return;
  const matStatuses = (statuses[projectId] && statuses[projectId][materialIndex]) || (proj.materials[materialIndex] && (proj.materials[materialIndex].status || Array(STATUS_COUNT).fill(false))) || Array(STATUS_COUNT).fill(false);
  const labels = ['Sourching','Quotation','PO Sample','Sample Received','Trial Proses & Report','MOC Release','PPAP & PSW','PO Maspro','Item Receive'];
  const items = labels.map((lbl, i) => ({ label: lbl, weight: STATUS_WEIGHTS[i], checked: Boolean(matStatuses[i]) }));
  // clamp popup inside viewport so it doesn't get cut off near edges
  const popupWidth = 280;
  const popupHeight = Math.min(280, items.length * 28 + 64);
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  let x = rect.left + rect.width / 2 - popupWidth / 2; // rata tengah dengan angka %
  let y = rect.top - popupHeight - 8; // muncul tepat di atas teks persen
  if (x + popupWidth > window.innerWidth) x = Math.max(8, window.innerWidth - popupWidth - 12);
  if (y + popupHeight > window.innerHeight) y = Math.max(8, window.innerHeight - popupHeight - 12);
  setHover({ open: true, x, y, items });
}

function hideHover() {
  setTimeout(() => {
    setHover(prev => prev.open ? { open: false } : prev);
  }, 120); // delay 120ms biar tidak flicker
}

function ensureStatuses(proj: Project) {
  if (!proj) return;
  if (statuses[proj.id]) return;
  // initialize statuses from material.status if available, otherwise default false arrays
  const arr = proj.materials.map((m) => normalizeStatusArray((m as any).status));
  setStatuses((s) => ({ ...s, [proj.id]: arr }));
}

function selectProject(id: number) {
  setSelectedProjectId(id);
  const proj = projects.find((p) => p.id === id);
  if (proj) ensureStatuses(proj);
  // fetch project-level uploads
  (async () => {
    try {
      const res = await fetch(`/api/uploads?projectId=${id}`);
      if (!res.ok) return setProjectUploads([]);
      const data = await res.json();
      setProjectUploads(data || []);
    } catch (err) {
      console.error('Failed to load project uploads', err);
      setProjectUploads([]);
    }
  })();
  // fetch remarks for this project
  (async () => {
    try {
      const r = await fetch(`/api/remarks?projectId=${id}`);
      if (!r.ok) return setRemarksMap({});
      const data = await r.json();
      const grouped: Record<number, any[]> = {};
      (data || []).forEach((it: any) => {
        const si = Number(it.status_index);
        grouped[si] = grouped[si] || [];
        grouped[si].push(it);
      });
      setRemarksMap(grouped);
    } catch (err) {
      console.error('Failed to load remarks', err);
      setRemarksMap({});
    }
  })();
  // persist selection to localStorage so it survives a page reload
  try { if (typeof window !== 'undefined') window.localStorage.setItem('selectedProjectId', String(id)); } catch (err) { /* ignore */ }
}

async function openRemarks(statusIndex: number) {
  if (!selectedProjectId) return;
  try {
    const res = await fetch(`/api/remarks?projectId=${selectedProjectId}&statusIndex=${statusIndex}`);
    const data = res.ok ? await res.json() : [];
    setRemarksModal({ open: true, statusIndex, items: data || [], editingId: undefined, editingText: '' });
  } catch (err) {
    console.error('Failed to open remarks', err);
    setRemarksModal({ open: true, statusIndex, items: [], editingId: undefined, editingText: '' });
  }
}

async function deleteRemark(id: number) {
  if (!window.confirm('Hapus remark ini?')) return;
  try {
    const res = await fetch('/api/remarks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Gagal menghapus');
    if (remarksModal.statusIndex != null) await openRemarks(remarksModal.statusIndex);
    if (selectedProjectId) {
      const r = await fetch(`/api/remarks?projectId=${selectedProjectId}`);
      if (r.ok) {
        const list = await r.json();
        const grouped: Record<number, any[]> = {};
        (list || []).forEach((it: any) => { const idx = Number(it.status_index); grouped[idx] = grouped[idx] || []; grouped[idx].push(it); });
        setRemarksMap(grouped);
      }
    }
  } catch (err: any) {
    console.error(err);
    alert(err?.message || 'Gagal menghapus remark');
  }
}

async function startEditRemark(id: number, text: string) {
  setRemarksModal((s) => ({ ...s, editingId: id, editingText: text }));
}

async function saveEditRemark() {
  try {
    const id = remarksModal.editingId;
    const text = (remarksModal.editingText || '').trim();
    if (!id) return; if (!text) { alert('Masukkan teks remark'); return; }
    const res = await fetch('/api/remarks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Gagal menyimpan perubahan');
    if (remarksModal.statusIndex != null) await openRemarks(remarksModal.statusIndex);
    if (selectedProjectId) {
      const r = await fetch(`/api/remarks?projectId=${selectedProjectId}`);
      if (r.ok) {
        const list = await r.json();
        const grouped: Record<number, any[]> = {};
        (list || []).forEach((it: any) => { const idx = Number(it.status_index); grouped[idx] = grouped[idx] || []; grouped[idx].push(it); });
        setRemarksMap(grouped);
      }
    }
  } catch (err: any) {
    console.error(err);
    alert(err?.message || 'Gagal menyimpan remark');
  }
}

// confirmation state for marking a status complete
const [confirm, setConfirm] = useState<{ open: boolean; projectId?: number; materialIndex?: number; statusIndex?: number; materialId?: number }>({ open: false });
const [loadingProgress, setLoadingProgress] = useState(0);

// Upload modal state for per-cell uploads in the detail grid
const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadTarget, setUploadTarget] = useState<{ projectId?: number; materialId?: number; materialIndex?: number; statusIndex?: number } | null>(null);
const [uploadFiles, setUploadFiles] = useState<File[]>([]);
const [showUploadSuccess, setShowUploadSuccess] = useState(false);
const [sortConfig, setSortConfig] = useState<{ key: keyof Project; direction: "asc" | "desc" } | null>(null);
const getSortIcon = (key: keyof Project) => {
if (!sortConfig || sortConfig.key !== key) return "⇅"; 
return sortConfig.direction === "asc" ? "▲" : "▼";      
};


function toggleStatus(projectId: number, materialIndex: number, statusIndex: number) {
  const proj = projects.find((p) => p.id === projectId);
  const mat = proj?.materials?.[materialIndex];
  if (!mat) return;
  const currentChecks = (statuses[projectId] && statuses[projectId][materialIndex]) || (mat.status && Array.isArray(mat.status) ? mat.status.map((v:any)=>Boolean(v)) : Array(STATUS_COUNT).fill(false));
  if (currentChecks[statusIndex]) {
    return;
  }
  setConfirm({ open: true, projectId, materialIndex, statusIndex, materialId: mat.id });
}

async function confirmYes() {
  if (!confirm.open || confirm.materialId == null || confirm.statusIndex == null || confirm.projectId == null) return;
  setLoadingProgress(5);
  try {
    const res = await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId: confirm.materialId, statusIndex: confirm.statusIndex, value: true }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to update');

    const serverMat = data.material; 
    setStatuses((s) => {
      const copy = { ...s };
      const matArr = copy[confirm.projectId!] ? copy[confirm.projectId!].map((r) => [...r]) : [];
      if (!matArr[confirm.materialIndex!]) matArr[confirm.materialIndex!] = Array(STATUS_COUNT).fill(false);
      if (serverMat && Array.isArray(serverMat.status)) {
        matArr[confirm.materialIndex!] = serverMat.status.map((v: any) => Boolean(v));
      } else {
        matArr[confirm.materialIndex!][confirm.statusIndex!] = true;
      }
      copy[confirm.projectId!] = matArr;
      return copy;
    });

    setProjects((p) => p.map((pr) => {
      if (pr.id !== data.projectId) return pr;
      const updatedMaterials = pr.materials.map((m, idx) => {
        if (!serverMat) return m;
        if (m.id === serverMat.id) {
          return { ...m, percent: serverMat.percent, status: serverMat.status } as Material;
        }
        return m;
      });
      return { ...pr, percent: data.projectPercent, materials: updatedMaterials } as Project;
    }));

    setLoadingProgress(100);
    setTimeout(() => { setConfirm({ open: false }); setLoadingProgress(0); }, 250);
  } catch (err) {
    console.error(err);
    alert('Gagal memperbarui status');
    setConfirm({ open: false });
    setLoadingProgress(0);
  }
}

function confirmNo() { setConfirm({ open: false }); }

function openUpload(projectId: number, materialId?: number, materialIndex?: number, statusIndex?: number) {
  setUploadTarget({ projectId, materialId, materialIndex, statusIndex });
  setUploadFiles([]);
  setShowUploadModal(true);
}

function onUploadFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const list = e.target.files;
  if (!list) return;
  setUploadFiles((f) => [...f, ...Array.from(list)]);
}

function onUploadDrop(e: React.DragEvent) {
  e.preventDefault();
  const list = e.dataTransfer.files;
  if (!list) return;
  setUploadFiles((f) => [...f, ...Array.from(list)]);
}

function onUploadDragOver(e: React.DragEvent) { e.preventDefault(); }

function removeUploadFile(idx: number) { setUploadFiles((f) => f.filter((_, i) => i !== idx)); }

function sortBy(key: string) {
  let direction: "asc" | "desc" = "asc";

  if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
    direction = "desc";
  }

  setSortConfig({ key: key as keyof Project, direction });
}

  async function doUploadFiles() {
  if (!uploadTarget || !uploadTarget.projectId) {
    alert('Tidak ada project terpilih');
    return;
  }

  try {
    setLoadingIndex(uploadTarget.statusIndex ?? null);

    const fd = new FormData();
    fd.append('projectId', String(uploadTarget.projectId));
    if (uploadTarget.materialId) fd.append('materialId', String(uploadTarget.materialId));
    if (uploadTarget.statusIndex != null) fd.append('statusIndex', String(uploadTarget.statusIndex));
    uploadFiles.forEach((f) => fd.append('files', f));

    const res = await fetch('/api/uploads', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'Upload failed');
    }
    const data = await res.json();

    await reloadProjects();
    if (selectedProjectId) {
      const r2 = await fetch(`/api/uploads?projectId=${selectedProjectId}`);
      if (r2.ok) setProjectUploads(await r2.json());
    }

    setShowUploadModal(false);
    setShowUploadSuccess(true);
    setTimeout(() => setShowUploadSuccess(false), 1600);
  } catch (err: any) {
    console.error('Upload failed', err);
    alert('Upload gagal: ' + (err?.message || String(err)));
  } finally {
    setLoadingIndex(null); 
  }
}

  async function deleteProjectById(projectId: number) {
    if (!window.confirm('Hapus project ini?')) return;
    try {
      const res = await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: projectId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Gagal menghapus project');
      await reloadProjects();
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        try { if (typeof window !== 'undefined') window.localStorage.removeItem('selectedProjectId'); } catch (err) { /* ignore */ }
      }
    } catch (err: any) {
      console.error('Delete failed', err);
      alert('Gagal menghapus project: ' + (err?.message || String(err)));
    }
  }

async function openAttachments(statusIndex: number) {
  if (!selectedProjectId) return;

  try {
    const res = await fetch(`/api/uploads?projectId=${selectedProjectId}&statusIndex=${statusIndex}`);
    const projectFiles = res.ok ? await res.json() : [];

    const proj = projects.find((p) => p.id === selectedProjectId);
    const materialFiles: any[] = [];

    if (proj) {
      (proj.materials || []).forEach((m: any) => {
        (m.attachments || []).forEach((a: any) => {
          materialFiles.push({
            ...a,
            materialId: m.id,
            materialName: m.name,
            path: a.path || '', 
          });
        });
      });
    }

    const items = [
      ...(projectFiles.map((f: any) => ({ ...f, materialName: null })) || []),
      ...materialFiles,
    ];

    setAttachmentsModal({ open: true, statusIndex, items });
  } catch (err) {
    console.error('Failed to load attachments', err);
    setAttachmentsModal({ open: true, statusIndex, items: [] });
  }
}
  const q = searchQuery.trim().toLowerCase();
  let filteredProjects = q.length === 0 ? projects : projects.filter((proj) => {
    return (
      (proj.name || '').toLowerCase().includes(q) ||
      (proj.customer || '').toLowerCase().includes(q) ||
      (proj.application || '').toLowerCase().includes(q) ||
      (proj.productLine || '').toLowerCase().includes(q)
    );
  })

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

const [form, setForm] = useState({
  name: "",
  customer: "",
  application: "",
  productLine: "",
  anualVolume: "",
  estSop: "",
  material: "",
});

const [errors, setErrors] = useState({
  name: "",
  customer: "",
  application: "",
  productLine: "",
  anualVolume: "",
  estSop: "",
  material: "",
});


const options = [
  "Innering",
  "Outer Ring",
  "Seal",
  "Cage",
  "Ball",
  "Grease",
];
const handleSaveProject = () => {
  let newErrors = {
    name: form.name ? "" : "Project Name is required",
    customer: form.customer ? "" : "Customer is required",
    application: form.application ? "" : "Application is required",
    productLine: form.productLine ? "" : "Product Line is required",
    anualVolume: form.anualVolume ? "" : "Anual Volume is required",
    estSop: form.estSop ? "" : "Est Sop is required",
    material: materials.length > 0 ? "" : "Material is required", 
  };

  setErrors(newErrors);

  const isValid = Object.values(newErrors).every(x => x === "");
  if (!isValid) return;

  handleSave();  
};
  if (sortConfig) {
    filteredProjects.sort((a, b) => {
      const key = sortConfig.key;

      let A: any = a[key];
      let B: any = b[key];

      if (key === "percent") {
        A = a.percent ?? 0;
        B = b.percent ?? 0;
      } else {
        A = String(A).toLowerCase();
        B = String(B).toLowerCase();
      }

      if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
      if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div>
      <div className="top-line">Project Tracking Data Master</div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="page-title">Projects List</div>
      </div>

      <div className="card spaced">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn" onClick={() => setShowModal(true)}>Add Project</button>
          <div style={{ width: '56%' }}>
            <div className="search-row" style={{ position: "relative" }}>
              <input
                className="search-input"
                placeholder="Search project"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%" }}
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 120,       
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "#000000"
                  }}
                >
                  ✕
                </button>
              )}

              <button className="search-btn">Search</button>
            </div>

          </div>
        </div>

        <table className="projects-table spaced" aria-label="Projects table">
          <thead>
            <tr>
              <th onClick={() => sortBy("name")}>
                Project Name {getSortIcon("name")}
              </th>
              <th onClick={() => sortBy("customer")}>
                Customer {getSortIcon("customer")}
              </th>
              <th>Application</th>
              <th>Product Line</th>
              <th>Anual Volume</th>
              <th>Est SOP Plan</th>
              <th onClick={() => sortBy("percent")}>
                Status {getSortIcon("percent")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">No Data</td>
              </tr>
            ) : (
              currentProjects.map((proj) => {
                const sortedMaterials = [...proj.materials].sort((a, b) => a.id - b.id);
                const projStatuses = statuses[proj.id] 
                  ?? sortedMaterials.map((m) =>
                      Array.isArray((m as any).status)
                        ? (m as any).status.map((v: any) => Boolean(v))
                        : Array(STATUS_COUNT).fill(false)
                    );

                let projPercent = 0;
                if (proj.materials.length > 0) {
                  const total = proj.materials.reduce((acc, m, mi) => {
                    const checks = projStatuses[mi] ?? Array(STATUS_COUNT).fill(false);
                    return acc + computeMaterialPercentFromChecks(checks);
                  }, 0);
                  projPercent = Math.round(total / Math.max(1, proj.materials.length));
                }
                return (
                <tr key={proj.id} className={`clickable ${proj.id === selectedProjectId ? 'selected' : ''}text-base`} onClick={() => selectProject(proj.id)}>
                  <td>{proj.name}</td>
                  <td>{proj.customer}</td>
                  <td>{proj.application}</td>
                  <td>{proj.productLine}</td>
                  <td>{proj.anualVolume}</td>
                  <td>{proj.estSop}</td>
                  <td className="status-percent">{proj.percent ?? projPercent}%</td>
  <td>
  <div className="flex items-center">

    {/* Tombol View */}
    <button
      className="icon-view flex items-center justify-center w-10 h-10 rounded-lg bg-[#0071c5]"
      title="View project"
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/project/${proj.id}`);
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>

    {/* Tombol Delete */}
    <button
      className="icon-delete flex items-center justify-center w-10 h-10 rounded-lg bg-[#e63946]"
      title="Delete project"
      onClick={(e) => {
        e.stopPropagation();
        deleteProjectById(proj.id);
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14H6L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
      </svg>
    </button>
  </div>
  </td>
  </tr>
  );
})
)}
</tbody>
</table>

  <div className="pagination">
    <button
      className="btn secondary"
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
    >
      Previous
    </button>

    <div className="page-pill">{currentPage} / {totalPages}</div>

    <button
      className="btn secondary"
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
</div>

  <div className="card spaced" style={{ marginTop: 28 }}>
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8, // jarak antara teks kiri dan kanan
        fontSize: 20,
        fontWeight: 700,
        marginBottom: 20,
      }}
    >
    <div>
    <span>Detail Status Project </span>

    {selectedProjectId && (
      <span style={{ fontSize: 18, fontWeight: 600, color: "#005bbb" }}>
        - {projects.find((p) => p.id === selectedProjectId)?.name}
      </span>
    )}
  </div>
</div>

    <div style={{ overflowX: 'auto' }}>
      <table className="status-grid" style={{ minWidth: 1000 }}>
        <thead>
          <tr>
            <th>Material</th>
            <th>Sourching</th>
            <th>Quotation</th>
            <th>PO Sample</th>
            <th>Sample Received</th>
            <th>Trial Proses & Report</th>
            <th>MOC Release</th>
            <th>PPAP & PSW</th>
            <th>PO Maspro</th>
            <th>Item Receive</th>
            <th>Status (%)</th>
          </tr>
          <tr>
            <th></th>

{Array.from({ length: STATUS_COUNT }).map((_, i) => (
  <th key={i} style={{ fontWeight: 600 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <button
        className="upload-btn"
        onClick={async (e) => {
          e.stopPropagation();
          if (!selectedProjectId) {
            alert('Pilih project terlebih dahulu');
            return;
          }
          setLoadingIndex(i); 
          try {
            await openUpload(selectedProjectId, undefined, undefined, i); 
          } finally {
            setLoadingIndex(null); 
          }
        }}
        aria-label={`Upload column ${i}`}
        disabled={loadingIndex === i} 
      >
        {loadingIndex === i ? "Uploading…" : "⬆ Upload"}
      </button>

      <button
        className="attach-btn"
        onClick={(e) => { e.stopPropagation(); if (!selectedProjectId) { alert('Pilih project terlebih dahulu'); return; } openAttachments(i); }}
        aria-label={`Attachments column ${i}`}
      >
        📎 {projectUploads.filter((u) => Number(u && (u as any).status_index) === i).length}
      </button>

      <button
        className="remark-btn"
        onClick={(e) => { e.stopPropagation(); if (!selectedProjectId) { alert('Pilih project terlebih dahulu'); return; } setRemarkModal({ open: true, statusIndex: i, text: '' }); }}
        aria-label={`Remark column ${i}`}
      >
        📝 Remark
      </button>

      {remarksMap && remarksMap[i] && remarksMap[i].length > 0 && (
        <div onClick={(e) => { e.stopPropagation(); openRemarks(i); }} style={{ marginTop: 6, maxWidth: 160, textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{remarksMap[i][0].text}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(remarksMap[i][0].created_at).toLocaleString()}</div>
        </div>
      )}
    </div>
  </th>
))}

                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedProjectId == null ? (
                <tr>
                  <td colSpan={11} className="table-empty">Pilih project untuk melihat detail material</td>
                </tr>
              ) : (
                (() => {
                  const proj = projects.find((p) => p.id === selectedProjectId);
                  if (!proj || proj.materials.length === 0) {
                    return (
                      <tr>
                        <td colSpan={11} className="table-empty">No materials for selected project</td>
                      </tr>
                    );
                  }


                  const sortedMaterials = [...proj.materials].sort((a, b) => a.id - b.id);
                  const projectStatuses = statuses[proj.id] ?? proj.materials.map(() => Array(STATUS_COUNT).fill(false));

                  return sortedMaterials.map((m, mi) => {
                    const checks = projectStatuses[mi] || Array(STATUS_COUNT).fill(false);
                    const percent = computeMaterialPercentFromChecks(checks);
                    return (
                      <tr key={m.id ?? mi}>
                        <td style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700 }}>{m.name}</div>
                            {(m as any).attachments && (m as any).attachments.length > 0 && (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {(m as any).attachments.map((a: any) => (
                                  <a
                                    href={a.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 12, color: 'var(--blue)' }}
                                  >
                                    🔗 {a.filename}
                                  </a>

                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        {checks.map((c, si) => (
                          <td key={si}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => toggleStatus(proj.id, mi, si)}
                                className={`status-check ${c ? 'checked' : ''}`}
                                title={c ? 'Completed' : 'Mark as done'}
                              >
                                {c ? '✓' : ''}
                              </button>

                            </div>
                          </td>
                        ))}
                        <td className="status-percent" onMouseEnter={(e)=>showHover(proj.id, mi, e)} onMouseLeave={hideHover}>{percent}%</td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Project</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-row">
              <label className="form-label">Project Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-row">
              <label className="form-label">Customer</label>
              <input
                className={`input ${errors.customer ? "input-error" : ""}`}
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              />
              {errors.customer && <span className="error-text">{errors.customer}</span>}
            </div>
                        <div className="form-row">
              <label className="form-label">Application</label>
              <input
                className={`input ${errors.application ? "input-error" : ""}`}
                value={form.application}
                onChange={(e) => setForm({ ...form, application: e.target.value })}
              />
              {errors.application && <span className="error-text">{errors.application}</span>}
            </div>
                      <div className="form-row">
              <label className="form-label">Product Line</label>
              <input
                className={`input ${errors.productLine ? "input-error" : ""}`}
                value={form.productLine}
                onChange={(e) => setForm({ ...form, productLine: e.target.value })}
              />
              {errors.productLine && <span className="error-text">{errors.productLine}</span>}
            </div>

                        <div className="row">
              <div className="grow form-row">
                <label className="form-label">Anual Volume</label>
                <input
                  className={`input ${errors.anualVolume ? "input-error" : ""}`}
                  value={form.anualVolume}
                  onChange={(e) => setForm({ ...form, anualVolume: e.target.value })}
                />
                {errors.anualVolume && <span className="error-text">{errors.anualVolume}</span>}
              </div>

              <div style={{ width: 180 }} className="form-row">
                <label className="form-label">Est SOP Plan</label>
                <input
                  className={`input ${errors.estSop ? "input-error" : ""}`}
                  value={form.estSop}
                  onChange={(e) => setForm({ ...form, estSop: e.target.value })}
                />
                {errors.estSop && <span className="error-text">{errors.estSop}</span>}
              </div>
            </div>

<div style={{ maxWidth: "100%", overflowX: "auto", marginTop: 10 }}>
  <table
    className="table-input"
    style={{
      width: "100%",
      tableLayout: "fixed",
      borderCollapse: "collapse",
      border: "1px solid #ccc",
    }}
  >
    <thead>
      <tr style={{ background: "#f2f2f2" }}>
        <th style={{ width: "18%", border: "1px solid #ccc", padding: "6px" }}>Material</th>
        <th style={{ width: "18%", border: "1px solid #ccc", padding: "6px" }}>Component</th>
        <th style={{ width: "14%", border: "1px solid #ccc", padding: "6px" }}>Category</th>
        <th style={{ width: "14%", border: "1px solid #ccc", padding: "6px" }}>
          BOM Qty
          <div style={{ fontSize: "8px", color: "red", fontWeight: "normal" }}>
            Gunakan titik (.) sebagai desimal
          </div>
        </th>
        <th style={{ width: "12%", border: "1px solid #ccc", padding: "6px" }}>UoM</th>
        <th style={{ width: "18%", border: "1px solid #ccc", padding: "6px" }}>Supplier</th>
        <th style={{ width: "6%", border: "1px solid #ccc", padding: "6px" }}></th>
      </tr>
    </thead>

    <tbody>
      {materials.map((row, index) => (
        <tr key={index}>
          {/* Material dropdown */}
          <td style={{ border: "1px solid #ccc" }}>
            <select
              style={{ width: "100%", border: "none", padding: "4px" }}
              value={row.material}
              onChange={(e) => handleChange(index, "material", e.target.value)}
            >
              <option value="">Select</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </td>

          {/* Component input */}
          <td style={{ border: "1px solid #ccc" }}>
            <input
              style={{ width: "100%", border: "none", padding: "4px" }}
              value={row.component}
              onChange={(e) => handleChange(index, "component", e.target.value)}
            />
          </td>

          {/* Category dropdown */}
          <td style={{ border: "1px solid #ccc" }}>
            <select
              style={{ width: "100%", border: "none", padding: "4px" }}
              value={row.category}
              onChange={(e) => handleChange(index, "category", e.target.value)}
            >
              <option value="">Select</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </td>

          {/* Qty */}
          <td style={{ border: "1px solid #ccc" }}>
            <input
              style={{ width: "100%", border: "none", padding: "4px" }}
              value={row.qty}
              onChange={(e) => handleChange(index, "qty", e.target.value)}
            />
          </td>

          {/* UoM */}
          <td style={{ border: "1px solid #ccc" }}>
            <input
              style={{ width: "100%", border: "none", padding: "4px" }}
              value={row.uom}
              onChange={(e) => handleChange(index, "uom", e.target.value)}
            />
          </td>

          {/* Supplier */}
          <td style={{ border: "1px solid #ccc" }}>
            <input
              style={{ width: "100%", border: "none", padding: "4px" }}
              value={row.supplier}
              onChange={(e) => handleChange(index, "supplier", e.target.value)}
            />
          </td>

          {/* Delete button */}
          <td style={{ border: "1px solid #ccc", textAlign: "center" }}>
            <button
              onClick={() => deleteRow(index)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "#cc0000",
              }}
              title="Delete"
            >
              🗑
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<button className="add-btn" onClick={addRow}>+ Add Material</button>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
              <button className="btn" onClick={handleSaveProject}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-overlay">
          <div className="success-box">
            <div className="success-icon">✓</div>
            <div className="success-title">Success!</div>
            <div className="success-sub">Data added successfully</div>
          </div>
        </div>
      )}
      {/* Confirmation modal for marking complete */}
      {confirm.open && (
        <div className="modal-overlay" role="dialog">
          <div className="confirm-modal">
            <div className="confirm-header">
              <div className="confirm-icon">?</div>
              <h3 style={{ margin: 0 }}>Confirmation</h3>
              <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', fontSize: 20 }} onClick={confirmNo}>✕</button>
            </div>
            <div className="confirm-body">Apakah Anda yakin ingin menandai sebagai selesai?</div>
            <div className="confirm-actions">
              <button className="btn secondary" onClick={confirmNo}>Tidak</button>
              <button className="btn" onClick={confirmYes}>Ya</button>
            </div>
            {loadingProgress > 0 && (
              <div className="progress-bar" aria-hidden>
                <div className="progress-fill" style={{ width: `${loadingProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload modal for per-cell uploads in the detail grid */}
      {showUploadModal && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="upload-modal" onDrop={onUploadDrop} onDragOver={onUploadDragOver}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--blue)' }}>Upload Files</h2>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>Pilih berkas untuk diupload ke material</div>
              </div>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>

            <div className="drop-area" style={{ marginTop: 16 }}>
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ fontSize: 44, color: '#bfc7cc' }}>☁︎</div>
                <div style={{ color: 'var(--blue)', fontWeight: 700, marginTop: 8 }}>Drag and drop files here</div>
                <div style={{ color: 'var(--muted)', marginTop: 6 }}>- OR -</div>
                <label className="browse-btn" style={{ display: 'inline-block', marginTop: 12, cursor: 'pointer' }}>
                  Browse Files
                  <input type="file" multiple style={{ display: 'none' }} onChange={onUploadFileChange} />
                </label>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <strong>Upload Files</strong>
              <div className="file-list" style={{ marginTop: 8 }}>
                {uploadFiles.length === 0 ? (
                  <div style={{ color: 'var(--muted)' }}>No files selected</div>
                ) : uploadFiles.map((f, i) => (
                  <div key={i} className="file-item">
                    <div>
                      <div style={{ fontWeight: 700 }}>{f.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>{Math.round(f.size/1024)} KB</div>
                    </div>
                    <button className="icon-btn" onClick={() => removeUploadFile(i)}>🗑</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="upload-actions">
              <button className="btn secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button
                className="btn"
                onClick={doUploadFiles}
                disabled={uploadFiles.length === 0 || loadingIndex !== null} // disable saat loading
              >
                {loadingIndex !== null ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload success popup */}
      {showUploadSuccess && (
        <div className="modal-overlay">
          <div className="success-large">
            <div className="success-icon" style={{ background: '#2ecc71' }}>✓</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>Success!</div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>File Uploaded successfully</div>
          </div>
        </div>
      )}

      {/* Attachments modal (opened from header) */}
      {attachmentsModal.open && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal" style={{ maxWidth: 820 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>Attachments</h3>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Files for project and column {attachmentsModal.statusIndex}</div>
              </div>
              <button className="modal-close" onClick={() => setAttachmentsModal({ open: false })}>✕</button>
            </div>

            <div style={{ marginTop: 12 }}>
              {(attachmentsModal.items || []).length === 0 ? (
                <div style={{ color: 'var(--muted)' }}>No attachments</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {(attachmentsModal.items || []).map((a: any) => (
                    <div key={a.id || `${a.materialId}-${a.filename || a.path}` } style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 20 }}>📎</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{a.filename}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.materialName ? `Material: ${a.materialName}` : 'Project file' } • {a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a className="btn secondary" href={a.path} target="_blank" rel="noreferrer">
                          Open
                        </a>
                        <button
                          className="btn"
                          onClick={() => downloadFile(a.path, a.filename)}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remarks history modal (view/edit/delete) */}
      {remarksModal.open && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>Remarks</h3>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Column {remarksModal.statusIndex}</div>
              </div>
              <button className="modal-close" onClick={() => setRemarksModal({ open: false })}>✕</button>
            </div>

            <div style={{ marginTop: 12 }}>
              {(remarksModal.items || []).length === 0 ? (
                <div style={{ color: 'var(--muted)' }}>No remarks</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {(remarksModal.items || []).map((r: any) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div style={{ flex: 1 }}>
                        {remarksModal.editingId === r.id ? (
                          <textarea value={remarksModal.editingText || ''} onChange={(e) => setRemarksModal((s) => ({ ...s, editingText: e.target.value }))} style={{ width: '100%', minHeight: 80, padding: 8 }} />
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700 }}>{r.text}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {remarksModal.editingId === r.id ? (
                          <>
                            <button className="btn secondary" onClick={() => setRemarksModal((s) => ({ ...s, editingId: undefined, editingText: '' }))}>Cancel</button>
                            <button className="btn" onClick={saveEditRemark}>Save</button>
                          </>
                        ) : (
                          <>
                            <button className="btn secondary" onClick={() => startEditRemark(r.id, r.text)}>Edit</button>
                            <button className="btn" onClick={() => deleteRemark(r.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remark modal (simple local-only flow) */}
      {remarkModal.open && (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>Add Remark</h3>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Column {remarkModal.statusIndex}</div>
              </div>
              <button className="modal-close" onClick={() => setRemarkModal({ open: false })}>✕</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <textarea style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} value={remarkModal.text || ''} onChange={(e) => setRemarkModal((s) => ({ ...s, text: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button className="btn secondary" onClick={() => setRemarkModal({ open: false })}>Cancel</button>
              <button className="btn" onClick={async () => {
                try {
                  if (!selectedProjectId) { alert('Pilih project terlebih dahulu'); return; }
                  const si = remarkModal.statusIndex;
                  const text = (remarkModal.text || '').trim();
                  if (si == null) { alert('Invalid column'); return; }
                  if (!text) { alert('Masukkan remark terlebih dahulu'); return; }
                  const res = await fetch('/api/remarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: selectedProjectId, statusIndex: si, text }) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || 'Gagal menyimpan remark');

                  // refresh remarks for selected project
                  try {
                    const r = await fetch(`/api/remarks?projectId=${selectedProjectId}`);
                    if (r.ok) {
                      const list = await r.json();
                      const grouped: Record<number, any[]> = {};
                      (list || []).forEach((it: any) => {
                        const idx = Number(it.status_index);
                        grouped[idx] = grouped[idx] || [];
                        grouped[idx].push(it);
                      });
                      setRemarksMap(grouped);
                    }
                  } catch (err) {
                    console.error('Failed to refresh remarks', err);
                  }

                  setRemarkModal({ open: false });
                } catch (err: any) {
                  console.error(err);
                  alert(err?.message || 'Gagal menyimpan remark');
                }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Hover preview */}
      {hover.open && hover.items && (
        <div
          className="status-hover-popup"
          style={{ position: 'fixed', left: hover.x, top: hover.y }}
          onMouseEnter={() => setHover(prev => ({ ...prev, open: true }))}
          onMouseLeave={() => hideHover()}
        >
          <div style={{ padding: 10 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Detail</strong>
            {hover.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div><input type="checkbox" checked={it.checked} readOnly /> {it.label}</div>
                <div style={{ fontWeight: 700 }}>{it.weight}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
