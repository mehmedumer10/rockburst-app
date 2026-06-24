// frontend/src/components/Navbar.js
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiZap, FiClock, FiUser,
  FiLogOut, FiMenu, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: <FiZap  size={16} /> },
  { to: "/predict",   label: "Predict",   icon: <FiZap  size={16} /> },
  { to: "/history",   label: "History",   icon: <FiClock size={16} /> },
  { to: "/profile",   label: "Profile",   icon: <FiUser  size={16} /> },
];

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  const photoURL = profile?.photoURL || user?.photoURL;
  const initials = (user?.displayName || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/dashboard" className="navbar__logo">
          <span>⛰</span>
          <span>RockburstAI</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar__links">
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar__link ${
                location.pathname === l.to ? "navbar__link--active" : ""
              }`}
            >
              {l.icon}
              {l.label}
              {location.pathname === l.to && (
                <motion.div
                  className="navbar__active-dot"
                  layoutId="active-dot"
                />
              )}
            </Link>
          ))}
        </div>

        {/* User area */}
        <div className="navbar__user">
          {photoURL ? (
            <img src={photoURL} alt="Avatar" className="navbar__avatar" />
          ) : (
            <div className="navbar__avatar-initials">{initials}</div>
          )}
          <button
            className="btn btn--ghost navbar__logout"
            onClick={handleLogout}
          >
            <FiLogOut size={16} /> Sign Out
          </button>

          {/* Mobile menu toggle */}
          <button
            className="navbar__mobile-toggle"
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          className="navbar__mobile-menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="navbar__mobile-link"
              onClick={() => setOpen(false)}
            >
              {l.icon} {l.label}
            </Link>
          ))}
          <button
            className="navbar__mobile-link navbar__mobile-logout"
            onClick={handleLogout}
          >
            <FiLogOut size={16} /> Sign Out
          </button>
        </motion.div>
      )}
    </nav>
  );
}