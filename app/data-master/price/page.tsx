"use client";

import { useEffect, useState } from "react";

/* ================= TYPES ================= */

type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  currency: string;
  incoterm: string;
  top: number;
};

type PriceHeaderForm = {
  start_date: string;
  end_date: string;
  quarter: string;
};

type PriceDetailForm = {
  ipd_siis: string;
  description: string;
  steel_spec: string;
  material_source: string;
  tube_route: string;
  price: string;
  valid_ipd: boolean;
};

/* ================= PAGE ================= */

export default function PricePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const [header, setHeader] = useState<PriceHeaderForm>({
    start_date: "",
    end_date: "",
    quarter: "",
  });

  const [details, setDetails] = useState<PriceDetailForm[]>([
    {
      ipd_siis: "",
      description: "",
      steel_spec: "",
      material_source: "",
      tube_route: "",
      price: "",
      valid_ipd: false,
    },
  ]);

  const [loading, setLoading] = useState(false);

  /* ================= UTILS ================= */

  function getQuarterLabel(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q}-${d.getFullYear()}`;
  }

  /* ================= LOAD SUPPLIER ================= */

  useEffect(() => {
    fetch("/api/supplier")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  /* ================= IPD VERIFY ================= */

  async function verifyIPD(index: number, ipd_siis: string) {
    const normalized = ipd_siis.trim();
    if (!normalized) return;

    try {
      const res = await fetch(
        `/api/ipd/verify?ipd_siis=${encodeURIComponent(normalized)}`
      );
      const data = await res.json();

      const copy = [...details];

      if (!data.hasQuotation) {
        copy[index].price = "";
        copy[index].valid_ipd = false;
      } else {
        copy[index].price = data.price ?? "";
        copy[index].valid_ipd = true;
      }

      setDetails(copy);
    } catch (err) {
      console.error("VERIFY IPD ERROR:", err);
    }
  }

  /* ================= SAVE ================= */

  async function handleSave() {
    if (!selectedSupplier) return alert("Supplier wajib dipilih");
    if (!header.start_date || !header.end_date)
      return alert("Start & End Date wajib diisi");

    for (const d of details) {
      if (!d.valid_ipd) {
        alert(
          `IPD SIIS ${d.ipd_siis || "(kosong)"} belum memiliki IPD Quotation`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          header,
          details,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      alert("Data berhasil disimpan");

      setHeader({ start_date: "", end_date: "", quarter: "" });
      setDetails([
        {
          ipd_siis: "",
          description: "",
          steel_spec: "",
          material_source: "",
          tube_route: "",
          price: "",
          valid_ipd: false,
        },
      ]);
    } catch (e: any) {
      alert(e.message || "Gagal simpan data");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-4 text-xs">
      <h1 className="text-2xl font-bold">Input Price</h1>

      {/* SUPPLIER */}
      <select
        className="border px-2 py-1"
        onChange={(e) =>
          setSelectedSupplier(
            suppliers.find((s) => s.id === e.target.value) || null
          )
        }
      >
        <option value="">-- Select Supplier --</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.supplier_code} - {s.supplier_name}
          </option>
        ))}
      </select>

      {/* HEADER */}
      <div className="border p-3 grid grid-cols-3 gap-4 bg-gray-50">
        <div>
          <div>Start Date</div>
          <input
            type="date"
            className="border px-2 py-1 w-full"
            value={header.start_date}
            onChange={(e) =>
              setHeader({
                ...header,
                start_date: e.target.value,
                quarter: getQuarterLabel(e.target.value),
              })
            }
          />
        </div>

        <div>
          <div>End Date</div>
          <input
            type="date"
            className="border px-2 py-1 w-full"
            value={header.end_date}
            onChange={(e) =>
              setHeader({ ...header, end_date: e.target.value })
            }
          />
        </div>

        <div className="font-bold text-lg flex items-end">
          {header.quarter}
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead className="bg-yellow-200">
          <tr>
            <th className="border">IPD SIIS</th>
            <th className="border">Description</th>
            <th className="border">Steel Spec</th>
            <th className="border">Material Source</th>
            <th className="border">Tube Route</th>
            <th className="border">Price</th>
            <th className="border"></th>
          </tr>
        </thead>

        <tbody>
          {details.map((row, i) => (
            <tr key={i}>
              <td className="border">
                <input
                  className="w-full px-1"
                  value={row.ipd_siis}
                  onChange={(e) => {
                    const copy = [...details];
                    copy[i].ipd_siis = e.target.value;
                    copy[i].valid_ipd = false;
                    setDetails(copy);
                  }}
                  onBlur={(e) =>
                    verifyIPD(i, e.target.value)
                  }
                />
              </td>

              <td className="border">
                <input className="w-full px-1" />
              </td>

              <td className="border">
                <input className="w-full px-1" />
              </td>

              <td className="border">
                <input className="w-full px-1" />
              </td>

              <td className="border">
                <input className="w-full px-1" />
              </td>

              <td className="border">
                <input
                  className="w-full px-1"
                  value={row.price}
                  disabled={!row.valid_ipd}
                  placeholder={
                    !row.valid_ipd ? "No IPD Quotation" : ""
                  }
                />
              </td>

              <td className="border text-center">
                ✕
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
