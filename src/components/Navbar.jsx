import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Navbar({ user, userRole, handleLogout, hasApprovedPass }) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Build menu items once to reuse in desktop/mobile
  const studentLinks = (
    <>
      <li>
        <Link to="/home" style={navLinkStyle}>Home</Link>
      </li>
      <li>
        <Link to="/epass" style={{ ...navLinkStyle, color: "#18193F", background: "#FFD700" }}>My E-Pass</Link>
      </li>
      <li>
        <Link to="/tracking" style={navLinkStyle}>Tracking</Link>
      </li>
      {!hasApprovedPass && (
        <li>
          <Link to="/apply" style={navLinkStyle}>Apply For E-Pass</Link>
        </li>
      )}
      <li>
        <Link to="/contact" style={navLinkStyle}>Contact</Link>
      </li>
    </>
  );

  const adminLinks = (
    <>
      <li>
        <Link to="/admin/requests" style={{ ...navLinkStyle, color: "#18193F", background: "#FFD700" }}>Requests</Link>
      </li>
      <li>
        <Link to="/admin/users/students" style={navLinkStyle}>Students</Link>
      </li>
      <li>
        <Link to="/admin/users/staff" style={navLinkStyle}>Staff</Link>
      </li>
      <li>
        <Link to="/admin/logins" style={navLinkStyle}>Login Log</Link>
      </li>
      <li>
        <Link to="/admin/complaints" style={navLinkStyle}>Complaints</Link>
      </li>
    </>
  );

  const guestLinks = (
    <>
      <li>
        <Link to="/home" style={navLinkStyle}>Home</Link>
      </li>
      <li>
        <Link to="/" style={{ ...navLinkStyle, color: "#18193F", background: "#FFD700" }}>Login / Register</Link>
      </li>
    </>
  );

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo.png"
            alt="CampusBus Logo"
            style={{ height: "32px", marginRight: "10px", borderRadius: "4px", background: "#fff", padding: "2px" }}
          />
          <span style={{ fontWeight: "bold", fontSize: 18, color: "#fff", letterSpacing: 1 }}>
            {userRole === "admin" ? "CampusBus Admin" : "CampusBus"}
          </span>
        </div>

        {/* Desktop center links */}
        {!isMobile && (
          <ul style={linksRowStyle}>
            {user ? (userRole === "admin" ? adminLinks : studentLinks) : guestLinks}
            {user && (
              <li>
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
              </li>
            )}
          </ul>
        )}

        {/* Right: Social + Mobile Menu Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {!isMobile && (
            <>
              <span style={iconStyle} title="Twitter"><i className="fab fa-twitter"></i></span>
              <span style={iconStyle} title="Facebook"><i className="fab fa-facebook-f"></i></span>
              <span style={iconStyle} title="Instagram"><i className="fab fa-instagram"></i></span>
            </>
          )}

          {isMobile && (
            <button
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: "#FFD700",
                color: "#18193F",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              ☰ Menu
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={mobileMenuStyle}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {user ? (userRole === "admin" ? adminLinks : studentLinks) : guestLinks}
            {user && (
              <li>
                <button onClick={handleLogout} style={{ ...logoutButtonStyle, width: "100%" }}>Logout</button>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

const navStyle = {
  background: "#18193F",
  padding: 0,
  width: "100%",
  minHeight: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(24,25,63,0.08)",
  position: "relative",
  zIndex: 1000,
};

const innerStyle = {
  width: "100%",
  maxWidth: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  margin: "0 auto",
  padding: "6px 10px",
};

const linksRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
  height: 56,
};

const navLinkStyle = {
  color: "#fff",
  padding: "0 20px",
  height: 56,
  display: "flex",
  alignItems: "center",
  fontWeight: 500,
  textDecoration: "none",
  border: "none",
  fontSize: 16,
};

const logoutButtonStyle = {
  background: "#fff",
  color: "#18193F",
  border: "none",
  padding: "8px 14px",
  height: 40,
  display: "flex",
  alignItems: "center",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  borderRadius: 8,
};

const iconStyle = { color: "#fff", marginRight: 8, fontSize: 18, cursor: "pointer" };

const mobileMenuStyle = {
  position: "absolute",
  top: 56,
  left: 0,
  right: 0,
  background: "#18193F",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  padding: 8,
};

export default Navbar;
