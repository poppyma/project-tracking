"use client";

import "./globals.css";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataMasterOpen, setDataMasterOpen] = useState(true);
  const [bomOpen, setBomOpen] = useState(true);
  const pathname = usePathname();

  function isExact(path: string) {
  return pathname === path;
}

function isStartsWith(path: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

function isHome() {
  return pathname === "/" || pathname === "";
}


  return (
    <html lang="en">
      <head>
        <title>Project Tracking App</title>
        <meta name="description" content="Project Tracking App" />
      </head>

      <body className="antialiased">
        <div className="flex min-h-screen bg-gray-100 overflow-hidden">

          {/* SIDEBAR */}
          <aside className="w-[280px] flex-shrink-0 bg-[#0b2a4a] text-white flex flex-col">
            <div className="p-4 flex flex-col gap-8 h-full overflow-y-auto">

              {/* LOGO */}
              <div className="flex justify-center">
                <img src="/skf-logo.svg" alt="SKF" className="h-10" />
              </div>

              {/* NAV */}
              <nav className="flex flex-col gap-2">

                {/* DATA MASTER */}
                <button
                  onClick={() => setDataMasterOpen(!dataMasterOpen)}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <img src="/database.png" className="w-7 h-7" />
                    <span className="font-semibold">Data Master</span>
                  </div>

                  <svg
                    className={`w-4 h-4 transition-transform ${
                      dataMasterOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* DATA MASTER SUB MENU */}
                {dataMasterOpen && (
                  <div className="ml-10 border-l border-white/20 pl-4 flex flex-col gap-1">
                    <Link
                      href="/data-master/ipd"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/data-master/ipd")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      Input IPD
                    </Link>

                    <Link
                      href="/data-master/supplier"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/data-master/supplier")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      Input Supplier
                    </Link>

                    <Link
                      href="/data-master/price"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/data-master/price")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      Input Price
                    </Link>

                    <Link
                      href="/data-master/price/view"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isStartsWith("/data-master/price/view")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      View Price
                    </Link>

                    <Link
                      href="/data-master/total"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/data-master/total")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      View Total IPD
                    </Link>

                    <Link
                      href="/data-master/view-quarters"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/data-master/view-quarters")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      View Quarters
                    </Link>
                    
                    <Link
                      href="/data-master/view-siis"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/data-master/view-siis")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      SIIS
                    </Link>
                  </div>
                )}

                {/* TRACKING */}
                <Link
                  href="/"
                  className={`
                    flex items-center gap-4 py-3 px-4 rounded-xl
                    ${isHome()
                      ? "bg-white/20 text-white font-semibold"
                      : "text-white/80 hover:bg-white/10"}
                  `}
                >
                  <img
                    src="/monitoring-icon.png"
                    className="w-7 h-7"
                  />
                  <span className="font-semibold">Tracking</span>
                </Link>


                {/* BOM COST */}
                <button
                  onClick={() => setBomOpen(!bomOpen)}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src="/calculation.png"
                      className="w-7 h-7"
                    />
                    <span className="font-semibold">BOM Cost</span>
                  </div>

                  {/* ARROW */}
                  <svg
                    className={`w-4 h-4 transition-transform ${bomOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* SUB MENU */}
                {bomOpen && (
                  <div className="ml-10 border-l border-white/20 pl-4 flex flex-col gap-1">
                    <Link
                      href="/bom-cost"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/bom-cost")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      Input Bom Cost
                    </Link>

                    <Link
                      href="/bom-cost/bp"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/bom-cost/bp")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      Data BP
                    </Link>

                     <Link
                      href="/bom-cost/summary"
                      className={`
                        py-2 px-3 text-sm rounded-lg
                        ${isExact("/bom-cost/summary")
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/80 hover:bg-white/10"}
                      `}
                    >
                      Bom Cost List
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 p-6 bg-white overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
