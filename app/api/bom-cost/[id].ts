import { NextApiRequest, NextApiResponse } from "next";


type BomCost = {
  id: number;
  project_id: number;
  project_name?: string;
  component: string;
  candidate_supplier: string;
  price: string;
  currency: string;
  term: string;
  landed_cost: string;
  tpl: string;
  bp_2026: string;
  landed_idr_price: string;
  cost_bearing: string;
  tooling_cost: string;
};

// Contoh data in-memory
let bomData: BomCost[] = []; // Simulasi DB

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "PUT") {
    const idx = bomData.findIndex((b) => b.id === Number(id));
    if (idx === -1) return res.status(404).json({ message: "BOM Cost tidak ditemukan" });

    bomData[idx] = { ...bomData[idx], ...req.body };
    return res.status(200).json(bomData[idx]);
  }

  res.status(405).json({ message: "Method not allowed" });
}
