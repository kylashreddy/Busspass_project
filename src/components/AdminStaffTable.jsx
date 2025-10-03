import React, { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, setDoc, writeBatch, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";

export default function AdminStaffTable() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live list from 'staff'
  React.useEffect(() => {
    try {
      const q = query(collection(db, "staff"));
      const unsub = onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        // sort by createdAt desc if present
        list.sort((a, b) => {
          const toMs = (v) => (v && typeof v.toDate === 'function') ? v.toDate().getTime() : (v instanceof Date ? v.getTime() : 0);
          return toMs(b.createdAt) - toMs(a.createdAt);
        });
        setStaff(list);
        setLoading(false);
      }, (err) => {
        console.error("Load staff failed:", err);
        setError("Failed to load staff: " + err.message);
        setLoading(false);
      });
      return () => unsub();
    } catch (err) {
      console.error("Prepare staff query failed:", err);
      setError("Failed to prepare staff query: " + err.message);
      setLoading(false);
    }
  }, []);

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

      {loading ? (
        <p>Loading staff…</p>
      ) : staff.length === 0 ? (
        <p>No staff found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <thead style={{ background: '#f3f3f3' }}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>USN</th>
                <th style={th}>Email</th>
                <th style={th}>Department</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td style={td}>{s.name || '—'}</td>
                  <td style={td}>{s.usn || '—'}</td>
                  <td style={td}>{s.email || '—'}</td>
                  <td style={td}>{s.department || '—'}</td>
                  <td style={td}>{s.createdAt && typeof s.createdAt.toDate === 'function' ? s.createdAt.toDate().toLocaleString() : '—'}</td>
                  <td style={td}>
                    <button onClick={async () => {
                      try {
                        const name = prompt('Name', s.name || '');
                        if (name === null) return;
                        const usn = prompt('USN', s.usn || '');
                        if (usn === null) return;
                        const email = prompt('Email', s.email || '');
                        if (email === null) return;
                        const department = prompt('Department', s.department || '');
                        if (department === null) return;
                        await updateDoc(doc(db, 'staff', s.id), { name, usn, email, department, role: 'teacher', updatedAt: new Date() });
                        alert('✅ Staff updated');
                      } catch (err) {
                        console.error('Update failed:', err);
                        alert('Failed to update: ' + err.message);
                      }
                    }} style={smallBtn('blue')}>Edit</button>
                    <button onClick={async () => {
                      try {
                        if (!window.confirm(`Delete staff ${s.name || s.email || s.id}?`)) return;
                        await deleteDoc(doc(db, 'staff', s.id));
                        alert('🗑️ Staff deleted');
                      } catch (err) {
                        console.error('Delete failed:', err);
                        alert('Failed to delete: ' + err.message);
                      }
                    }} style={smallBtn('red')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { padding: '10px', border: '1px solid #ddd', textAlign: 'left' };
const td = { padding: '10px', border: '1px solid #ddd' };
const smallBtn = (color) => ({
  padding: '6px 10px',
  marginRight: 6,
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  background: color === 'red' ? '#dc2626' : '#2563eb',
  cursor: 'pointer'
});
