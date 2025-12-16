"use client";

import { useEffect, useState } from "react";

type BP = {
  id: number;
  currency: string;
  bp_value: string;
};

export default function DataBPPage() {
  const [bps, setBps] = useState<BP[]>([]);
  const [currency, setCurrency] = useState("");
  const [bpValue, setBpValue] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  /* ================= PAGINATION ================= */
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(bps.length / ITEMS_PER_PAGE);
  const paginatedData = bps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ================= LOAD DATA ================= */
  async function loadBP() {
    const res = await fetch("/api/bp");
    const json = await res.json();

    // ✅ terbaru di atas
    const sorted = [...json].sort((a, b) => b.id - a.id);
    setBps(sorted);
  }

  useEffect(() => {
    loadBP();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [bps]);

  /* ================= ADD BP ================= */
  async function submitBP(e: React.FormEvent) {
    e.preventDefault();

    if (!currency || !bpValue) {
      setToast({
        show: true,
        message: "Currency dan BP wajib diisi",
        type: "error",
      });
      autoHideToast();
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/bp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          bp_value: bpValue,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambahkan BP");
      }

      setCurrency("");
      setBpValue("");
      await loadBP();

      setToast({
        show: true,
        message: "Data BP berhasil ditambahkan",
        type: "success",
      });
      autoHideToast();

    } catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: "error",
      });
      autoHideToast();
    } finally {
      setSaving(false);
    }
  }

  /* ================= DELETE BP ================= */
  async function deleteBP(id: number) {
    if (!confirm("Yakin mau hapus BP ini?")) return;

    try {
      const res = await fetch("/api/bp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus BP");
      }

      await loadBP();

      setToast({
        show: true,
        message: "Data BP berhasil dihapus",
        type: "success",
      });
      autoHideToast();

    } catch (err: any) {
      setToast({
        show: true,
        message: err.message,
        type: "error",
      });
      autoHideToast();
    }
  }

  function autoHideToast() {
    setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3000);
  }

  return (
    <div className="p-6 max-w-3xl">

      {/* TOAST */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}
          `}
        >
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Data BP
        </h1>
        <p className="text-sm text-gray-500">
          Master data BP berdasarkan currency
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
        {saving && (
          <div className="h-1 w-full bg-blue-100 overflow-hidden rounded mb-3">
            <div className="h-full bg-blue-600 animate-pulse w-2/3" />
          </div>
        )}

        <form onSubmit={submitBP} className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500">Currency</label>
            <input
              className="border px-3 py-2 rounded-lg w-28 text-sm"
              value={currency}
              onChange={(e) =>
                setCurrency(e.target.value.toUpperCase())
              }
            />
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-500">BP Value</label>
            <input
              className="border px-3 py-2 rounded-lg w-full text-sm"
              value={bpValue}
              onChange={(e) => setBpValue(e.target.value)}
            />
          </div>

          <button
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-sm font-medium text-white
              ${saving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}
            `}
          >
            {saving ? "Saving..." : "Add"}
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Currency</th>
              <th className="px-4 py-3 text-right">BP</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {bps.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  Belum ada data
                </td>
              </tr>
            ) : (
              paginatedData.map((bp) => (
                <tr key={bp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {bp.currency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {bp.bp_value}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteBP(bp.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded
                  ${currentPage === i + 1 ? "bg-blue-600 text-white" : ""}
                `}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
