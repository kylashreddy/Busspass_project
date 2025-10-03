import React, { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import AdminUsersTable from "./AdminUsersTable";

export default function AdminStaffTable() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const backfillStaffFromTeachers = async () => {
    if (running) return;
    const ok = window.confirm(
      "This will copy all teacher profiles from the 'users' collection into the 'staff' collection. Proceed?"
    );
    if (!ok) return;

    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const q = query(collection(db, "users"), where("role", "==", "teacher"));
      const snap = await getDocs(q);

      let processed = 0;
      let batches = 0;
      let batch = writeBatch(db);
      let opsInBatch = 0;

      for (const d of snap.docs) {
        const data = d.data();
        const staffDoc = {
          userId: d.id,
          role: "teacher",
          name: data.name || null,
          email: data.email || null,
          usn: data.usn || null,
          department: data.department || null,
          phone: data.phone || null,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        };

        const ref = doc(collection(db, "staff"), d.id);
        batch.set(ref, staffDoc, { merge: true });
        opsInBatch += 1;
        processed += 1;

        if (opsInBatch >= 400) { // keep a safety margin under 500
          await batch.commit();
          batches += 1;
          batch = writeBatch(db);
          opsInBatch = 0;
        }
      }

      if (opsInBatch > 0) {
        await batch.commit();
        batches += 1;
      }

      setResult({ processed, batches });
    } catch (err) {
      console.error("Backfill failed:", err);
      setError(err.message || String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>👥 Staff</h2>
        <button
          onClick={backfillStaffFromTeachers}
          disabled={running}
          style={{
            padding: "8px 12px",
            border: "none",
            borderRadius: 6,
            background: running ? "#9CA3AF" : "#2563eb",
            color: "#fff",
            cursor: running ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {running ? "Backfilling…" : "Backfill staff from teachers"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#dc2626", marginTop: 0 }}>Error: {error}</p>
      )}
      {result && (
        <p style={{ color: "#16a34a", marginTop: 0 }}>
          Done. Processed {result.processed} teachers in {result.batches} batch{result.batches === 1 ? "" : "es"}.
        </p>
      )}

      <AdminUsersTable roleFilter="teacher" title="Staff" />
    </div>
  );
}
