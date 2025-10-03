import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

function AdminUsersTable({ roleFilter = "student", title }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const base = collection(db, "users");
      const conditions = [];
      if (roleFilter && roleFilter !== "all") {
        conditions.push(where("role", "==", roleFilter));
      }
      // Newest first by createdAt if available
      const q = conditions.length
        ? query(base, ...conditions)
        : query(base);

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = [];
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
          // Optional: local sort by createdAt desc if field exists
          list.sort((a, b) => {
            const toMs = (v) => (v && typeof v.toDate === 'function') ? v.toDate().getTime() : (v instanceof Date ? v.getTime() : 0);
            return toMs(b.createdAt) - toMs(a.createdAt);
          });
          setUsers(list);
          setLoading(false);
        },
        (err) => {
          console.error("Error loading users:", err);
          setError("Failed to load users: " + err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.error("Error preparing users query:", err);
      setError("Failed to prepare users query: " + err.message);
      setLoading(false);
    }
  }, [roleFilter]);

  if (loading) return <p>Loading {roleFilter === 'teacher' ? 'teachers' : 'students'}...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const computedLabel = title || (roleFilter === 'teacher' ? 'Teachers' : roleFilter === 'student' ? 'Students' : 'Users');

  const onEdit = async (u) => {
    try {
      const name = prompt('Name', u.name || '');
      if (name === null) return;
      const usn = prompt('USN', u.usn || '');
      if (usn === null) return;
      const email = prompt('Email', u.email || '');
      if (email === null) return;
      const role = prompt('Role (student/teacher/admin)', u.role || 'student');
      if (role === null) return;

      if (role === 'teacher') {
        // Move to staff collection and remove from users
        const staffDoc = { name, usn, email, role: 'teacher', userId: u.id, createdAt: u.createdAt || new Date(), updatedAt: new Date() };
        await setDoc(doc(db, 'staff', u.id), staffDoc, { merge: true });
        await deleteDoc(doc(db, 'users', u.id));
        alert('✅ Moved user to staff collection');
      } else {
        await updateDoc(doc(db, 'users', u.id), { name, usn, email, role });
        alert('✅ User updated');
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update: ' + err.message);
    }
  };

  const onDelete = async (u) => {
    try {
      if (!window.confirm(`Delete user ${u.name || u.email || u.id}? This removes the Firestore user document.`)) return;
      await deleteDoc(doc(db, 'users', u.id));
      alert('🗑️ User deleted (Firestore doc). Note: Auth account, if any, is not removed.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 6 }}>👥 {computedLabel}</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 0 }}>Total: {users.length}</p>

      {users.length === 0 ? (
        <p>No {computedLabel.toLowerCase()} found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <thead style={{ background: '#f3f3f3' }}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>USN</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={td}>{u.name || '—'}</td>
                  <td style={td}>{u.usn || '—'}</td>
                  <td style={td}>{u.email || '—'}</td>
                  <td style={td}>{u.role || '—'}</td>
                  <td style={td}>{u.createdAt && typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate().toLocaleString() : '—'}</td>
                  <td style={td}>
                    <button onClick={() => onEdit(u)} style={smallBtn('blue')}>Edit</button>
                    <button onClick={() => onDelete(u)} style={smallBtn('red')}>Delete</button>
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

export default AdminUsersTable;
