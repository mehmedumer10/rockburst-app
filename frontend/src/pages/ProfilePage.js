// frontend/src/pages/ProfilePage.js
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUser, FiEdit3, FiCamera,
  FiTrash2, FiSave, FiX,
  FiAlertTriangle, FiLock
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "./ProfilePage.css";

export default function ProfilePage() {
  const {
    user, profile, logout,
    uploadProfilePicture, removeProfilePicture,
    updateUserProfile, deleteAccount
  } = useAuth();

  const navigate   = useNavigate();
  const fileRef    = useRef(null);
  const [editMode,       setEditMode]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showDeleteDlg,  setShowDeleteDlg]  = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting,       setDeleting]       = useState(false);

  const [form, setForm] = useState({
    displayName:  profile?.displayName  || user?.displayName  || "",
    organization: profile?.organization || "",
    country:      profile?.country      || "",
    bio:          profile?.bio          || "",
  });

  // Keep the form in sync with the live profile from context.
  // Without this, if `profile` was still loading (or updates later via
  // the real-time listener) the form would be stuck with whatever values
  // existed at the very first render — and saving it back would silently
  // overwrite real Firestore data with blanks. We skip this sync while
  // the user is actively editing so we don't clobber in-progress changes.
  useEffect(() => {
    if (!editMode) {
      setForm({
        displayName:  profile?.displayName  || user?.displayName  || "",
        organization: profile?.organization || "",
        country:      profile?.country      || "",
        bio:          profile?.bio          || "",
      });
    }
  }, [profile, user, editMode]);

  // Upload photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be <2 MB"); return;
    }
    setUploading(true);
    try {
      await uploadProfilePicture(file);
      toast.success("Photo updated!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      await removeProfilePicture();
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(form);
      toast.success("Profile updated!");
      setEditMode(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password"); return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success("Account deleted");
      navigate("/");
    } catch (e) {
      toast.error(
        e.code === "auth/wrong-password"
          ? "Wrong password"
          : "Deletion failed"
      );
    } finally {
      setDeleting(false);
    }
  };

  const photoURL = profile?.photoURL || user?.photoURL;
  const initials = (form.displayName || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-page__container">
        <motion.h1
          className="profile-page__title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FiUser size={26} />
          My Profile
        </motion.h1>

        <div className="profile-grid">
          {/* ── Avatar card ── */}
          <motion.div
            className="profile-avatar-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="avatar-wrapper">
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-initials">{initials}</div>
              )}
              {uploading && (
                <div className="avatar-overlay">
                  <span className="spinner" />
                </div>
              )}
            </div>

            <h2 className="profile-name">
              {form.displayName || "User"}
            </h2>
            <p className="profile-email">{user?.email}</p>
            {form.organization && (
              <p className="profile-org">{form.organization}</p>
            )}

            {/* Photo actions */}
            <div className="avatar-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
              <button
                className="btn btn--ghost"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <FiCamera size={16} /> Change Photo
              </button>
              {photoURL && (
                <button
                  className="btn btn--ghost"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  <FiX size={16} /> Remove
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat__value">
                  {profile?.totalPredictions || 0}
                </span>
                <span className="profile-stat__label">Predictions</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat__value">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).getFullYear()
                    : "—"}
                </span>
                <span className="profile-stat__label">Member Since</span>
              </div>
            </div>
          </motion.div>

          {/* ── Details card ── */}
          <motion.div
            className="profile-details-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="card-header">
              <h3>Account Details</h3>
              {!editMode ? (
                <button
                  className="btn btn--ghost"
                  onClick={() => setEditMode(true)}
                >
                  <FiEdit3 size={16} /> Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn--ghost"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <span className="spinner" /> : <FiSave size={16} />}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="details-form">
              {[
                { key: "displayName",  label: "Display Name",  type: "text" },
                { key: "organization", label: "Organization",   type: "text" },
                { key: "country",      label: "Country",        type: "text" },
              ].map(f => (
                <div key={f.key} className="details-field">
                  <label>{f.label}</label>
                  {editMode ? (
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({
                        ...p, [f.key]: e.target.value
                      }))}
                      className="form-input"
                    />
                  ) : (
                    <span className="details-value">
                      {form[f.key] || "—"}
                    </span>
                  )}
                </div>
              ))}

              <div className="details-field details-field--full">
                <label>Bio</label>
                {editMode ? (
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Tell us about your research..."
                  />
                ) : (
                  <span className="details-value">
                    {form.bio || "—"}
                  </span>
                )}
              </div>

              <div className="details-field">
                <label>Email</label>
                <span className="details-value">{user?.email}</span>
              </div>
            </div>

            {/* Danger zone */}
            <div className="danger-zone">
              <h4><FiAlertTriangle size={16} /> Danger Zone</h4>
              <p>
                Deleting your account permanently removes all data
                including prediction history.
              </p>
              <button
                className="btn btn--danger"
                onClick={() => setShowDeleteDlg(true)}
              >
                <FiTrash2 size={16} /> Delete Account
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Delete dialog ── */}
        {showDeleteDlg && (
          <div className="modal-overlay" onClick={() => setShowDeleteDlg(false)}>
            <motion.div
              className="modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3>
                <FiAlertTriangle color="#ef4444" />
                Confirm Account Deletion
              </h3>
              <p>
                This action is <strong>irreversible</strong>.
                All your predictions will be permanently deleted.
              </p>
              <div className="form-group">
                <label className="form-label">
                  <FiLock size={14} /> Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn--ghost"
                  onClick={() => setShowDeleteDlg(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? <span className="spinner" /> : <FiTrash2 size={16} />}
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}