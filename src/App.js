// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { logLoginEvent } from "./utils/logLoginEvent";
import { motion } from 'framer-motion';
import AnimatedCursor from './components/AnimatedCursor';
import TrackingPlaceholder from './components/TrackingPlaceholder';
import Home from './components/Home';

import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import BusPassRequestForm from './components/BusPassRequestForm';
import AdminDashboard from './components/AdminDashboard';
import AdminComplaints from './components/AdminComplaints';
import StudentBusPassView from './components/StudentBusPassView';
import Navbar from "./components/Navbar";
import ContactUs from "./components/ContactUs";
import AdminUsersTable from './components/AdminUsersTable';
import AdminStaffTable from './components/AdminStaffTable';
import AdminLoginLogs from './components/AdminLoginLogs';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApprovedPass, setHasApprovedPass] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#F9FAFB";
    document.documentElement.style.backgroundColor = "#F9FAFB";

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role || "student"); // fallback
          } else {
            // If no doc yet, assume student (SignUpForm writes one)
            setUserRole("student");
          }

          // Log login on session restore or external login (avoid duplicate if already logged via LoginForm)
          try {
            const profile = userDocSnap.exists() ? userDocSnap.data() : null;
            await logLoginEvent(db, currentUser, profile);
          } catch (logErr) {
            console.warn("Login log (App) failed:", logErr);
          }

          // Only check passes for students
          if (userDocSnap.exists() && userDocSnap.data().role === "student") {
            const q = query(
              collection(db, "busPassRequests"),
              where("studentId", "==", currentUser.uid),
              where("status", "==", "approved")
            );
            const querySnapshot = await getDocs(q);

            const toDate = (v) => {
              if (!v) return null;
              if (typeof v.toDate === 'function') return v.toDate();
              return v instanceof Date ? v : null;
            };

            let isAnyValid = false;
            const now = new Date();
            querySnapshot.forEach((docSnap) => {
              const d = docSnap.data();
              const approvedAt = toDate(d.approvedAt) || toDate(d.requestDate);
              const validUntil = toDate(d.validUntil) || (approvedAt ? new Date(approvedAt.getTime() + 365 * 24 * 60 * 60 * 1000) : null);
              if (validUntil && validUntil > now) {
                isAnyValid = true;
              }
            });
            setHasApprovedPass(isAnyValid);
          } else {
            setHasApprovedPass(false);
          }
        } catch (err) {
          console.error("Error fetching user doc:", err);
          setUserRole(null);
          setHasApprovedPass(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setHasApprovedPass(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        fontFamily: 'Poppins, sans-serif',
        minHeight: '100vh',
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <p>Loading user session...</p>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedCursor />
      {/* Navbar always visible */}
      <Navbar user={user} userRole={userRole} handleLogout={handleLogout} hasApprovedPass={hasApprovedPass} />

      {user ? (
        <>
          {/* STUDENT ROUTES */}
          {userRole === "student" && (
            <Routes>
              <Route path="/" element={<Navigate to="/epass" replace />} />
              <Route
                path="/home"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <Home />
                  </motion.div>
                }
              />

              <Route
                path="/epass"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    {hasApprovedPass ? <StudentBusPassView /> : <BusPassRequestForm />}
                  </motion.div>
                }
              />

              <Route
                path="/tracking"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
<TrackingPlaceholder />
                  </motion.div>
                }
              />

              <Route
                path="/apply"
                element={
                  hasApprovedPass ? (
                    <Navigate to="/epass" replace />
                  ) : (
                    <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                      <BusPassRequestForm />
                    </motion.div>
                  )
                }
              />

              <Route
                path="/contact"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <ContactUs />
                  </motion.div>
                }
              />

              {/* student cannot access admin */}
              <Route
                path="/admin/*"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <h2>Access Denied</h2>
                  </motion.div>
                }
              />

              <Route
                path="*"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <h2>404 - Page Not Found</h2>
                  </motion.div>
                }
              />
            </Routes>
          )}

          {/* ADMIN ROUTES */}
          {userRole === "admin" && (
            <Routes>
              {/* Default route → requests */}
              <Route path="/" element={<Navigate to="/admin/requests" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/requests" replace />} />


              {/* Requests page */}
              <Route
                path="/admin/requests"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <AdminDashboard filterProfileType="all" />
                  </motion.div>
                }
              />

              {/* Users tables */}
              <Route
                path="/admin/users"
                element={<Navigate to="/admin/users/students" replace />}
              />
              <Route
                path="/admin/users/students"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <AdminUsersTable roleFilter="student" />
                  </motion.div>
                }
              />
              <Route
                path="/admin/users/teachers"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <AdminUsersTable roleFilter="teacher" />
                  </motion.div>
                }
              />
              <Route
                path="/admin/users/staff"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <AdminStaffTable />
                  </motion.div>
                }
              />

              {/* Login log */}
              <Route
                path="/admin/logins"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <AdminLoginLogs />
                  </motion.div>
                }
              />

              {/* Complaints page */}
              <Route
                path="/admin/complaints"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <AdminComplaints />
                  </motion.div>
                }
              />

              {/* Catch all */}
              <Route
                path="*"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <h2>404 - Page Not Found</h2>
                  </motion.div>
                }
              />
            </Routes>
          )}

          {/* TEACHER ROUTES */}
          {userRole === "teacher" && (
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <Home />
                  </motion.div>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          )}
        </>
      ) : (
        // UNAUTHENTICATED ROUTES: keep login at "/", add public "/home"
        <Routes>
          <Route
            path="/"
            element={
              <motion.div className="auth-container" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <div className="auth-left">
                  <img src="/logo.png" alt="Bus" />
                  <h2>CampusBus Login</h2>
                  <p>Access bus e-pass, tracking, and payments with your university credentials.</p>
                </div>

                <div className="card">
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                    <img
                      src="/logo.png"
                      alt="CampusBus Logo"
                      style={{ width: "50px", height: "50px", marginRight: "12px", borderRadius: "50%" }}
                    />
                    <div>
                      <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>CampusBus Portal</h1>
                      <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>Student • Teacher • Admin</p>
                    </div>
                  </div>

                  {showRegister ? <SignUpForm /> : <LoginForm />}

                  <p style={{ marginTop: "20px" }}>
                    {showRegister ? (
                      <>Already registered?{' '}
                        <span onClick={() => setShowRegister(false)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>
                          Login here
                        </span>
                      </>
                    ) : (
                      <>Not registered yet?{' '}
                        <span onClick={() => setShowRegister(true)} style={{ color: "#3B82F6", cursor: "pointer", fontWeight: "bold" }}>
                          Register here
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            }
          />

          <Route
            path="/home"
            element={
              <motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <Home />
              </motion.div>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
