"use client";

import { AppShell } from "@/components/app-shell";
import { useSearch } from "@/components/search-context";

const reports = [
  "Daily Safety Summary - March 24",
  "Weekly Gas Level Analysis",
  "Shaft B Incident Report",
  "Monthly Equipment Inspection",
];

export default function ReportsPage() {
  const { query } = useSearch();
  const filtered = reports.filter((r) => r.toLowerCase().includes(query.toLowerCase()));
  const downloadPdf = () => {
    void (async () => {
      const { jsPDF } = await import("jspdf/dist/jspdf.umd.min.js");
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text("Mine Safety Report", 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      reports.forEach((report, index) => {
        pdf.text(`${index + 1}. ${report}`, 20, 45 + index * 10);
      });
      pdf.save("mine-safety-report.pdf");
    })();
  };

  return (
    <AppShell title="Reports" subtitle="View and download generated safety reports">
      <div className="space-y-3">
        <button
          onClick={downloadPdf}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950"
        >
          Download PDF
        </button>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-slate-500">No reports match your search.</p>
          ) : (
            filtered.map((report) => (
            <article key={report} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-800">{report}</p>
              <p className="text-sm text-slate-500">Generated report</p>
            </article>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
