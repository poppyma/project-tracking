"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
};

export default function PricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quarter, setQuarter] = useState("");

  const [priceFile, setPriceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     LOAD SUPPLIER
  ========================= */
  useEffect(() => {
    fetch("/api/supplier")
      .then((res) => res.json())
      .then((json) => setSuppliers(json.rows || []));
  }, []);

  /* =========================
     AUTO QUARTER
  ========================= */
  useEffect(() => {
    if (!startDate) return;
    const m = new Date(startDate).getMonth() + 1;
    const q = Math.ceil(m / 3);
    setQuarter(`Q${q}-${new Date(startDate).getFullYear()}`);
  }, [startDate]);

  /* =========================
     HANDLE UPLOAD
  ========================= */
  async function handleUpload() {
    if (!selectedSupplier) return alert("Supplier wajib dipilih");
    if (!startDate || !endDate) return alert("Tanggal wajib diisi");
    if (!priceFile) return alert("File CSV wajib dipilih");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", priceFile);
      formData.append("supplier_code", selectedSupplier.supplier_code);
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("quarter", quarter);

      const res = await fetch("/api/price/upload-csv", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      alert(`Upload berhasil (${json.inserted} data)`);
      setPriceFile(null);
      setStartDate("");
      setEndDate("");
      setQuarter("");
    } catch (e: any) {
      alert(e.message || "Upload gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Upload Price (CSV)</h1>

      {/* ================= SUPPLIER ================= */}
      <div>
        <label className="block mb-1 font-medium">Supplier</label>
        <select
          className="border px-3 py-2 w-96"
          value={selectedSupplier?.id || ""}
          onChange={(e) => {
            const s = suppliers.find((x) => x.id === e.target.value);
            setSelectedSupplier(s || null);
          }}
        >
          <option value="">-- Pilih Supplier --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.supplier_code} - {s.supplier_name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= HEADER ================= */}
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        <div>
          <label className="block mb-1">Start Date</label>
          <input
            type="date"
            className="border px-3 py-2 w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">End Date</label>
          <input
            type="date"
            className="border px-3 py-2 w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Quarter</label>
          <input
            type="text"
            className="border px-3 py-2 w-full bg-gray-100"
            value={quarter}
            disabled
          />
        </div>
      </div>

      {/* ================= CSV ================= */}
      <div className="border p-4 bg-gray-50 rounded max-w-xl space-y-2">
        <div className="font-semibold">Upload Price CSV</div>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setPriceFile(e.target.files?.[0] || null)}
        />

        <div className="text-xs text-gray-600">
          Format CSV:
          
        </div>
      </div>

      {/* ================= ACTION ================= */}
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload Price CSV"}
      </button>
    </div>
  );
}
