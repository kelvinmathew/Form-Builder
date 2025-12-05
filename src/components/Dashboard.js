import React, { useState } from "react";

const Dashboard = ({ forms, onCreate, onEdit, onDelete, onOpen }) => {
  // State to manage the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);

  // Function to trigger the modal opening
  const handleDeleteClick = (id) => {
    setSelectedFormId(id);
    setShowDeleteModal(true);
  };

  // Function to confirm deletion
  const confirmDelete = () => {
    if (selectedFormId) {
      onDelete(selectedFormId);
    }
    setShowDeleteModal(false);
    setSelectedFormId(null);
  };

  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedFormId(null);
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F3F4F6", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>

      {/* --- HEADER SECTION --- */}
      <div className="bg-white border-bottom sticky-top" style={{ zIndex: 100 }}>
        <div className="container px-4 px-lg-5 py-4">
          <div className="row align-items-center g-3">

            {/* Title Area */}
            <div className="col-12 col-md-6">
              <h4 className="fw-bold text-dark mb-2" style={{ letterSpacing: "0.2px", fontSize: "16px" }}>Dashboard</h4>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Manage your forms and data collection.</p>
            </div>

            {/* Actions Area */}
            <div className="col-12 col-md-6 d-flex flex-column flex-md-row justify-content-md-end gap-3">
              {/* Create Button */}
              <button
                className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-2 fw-semibold shadow-sm rounded-3"
                onClick={onCreate}
                style={{
                  backgroundColor: "#4F46E5",
                  color: "#ffffff",
                  fontSize: "14px",
                  border: "none",
                  transition: "transform 0.1s"
                }}
              >
                <i className="bi bi-plus-lg "></i>
                <span>New Form</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="container px-4 px-lg-5 py-5">

        {/* Empty State */}
        {forms.length === 0 ? (
          <div className="text-center py-5">
            <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle"
              style={{ width: "80px", height: "80px", backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
              <i className="bi bi-inbox fs-1"></i>
            </div>
            <h4 className="fw-bold text-dark" style={{ fontSize: "14px" }}>No forms found</h4>
            <p className="text-muted mb-4" style={{ fontSize: "14px" }}>Get started by creating your first form.</p>
            <button className="btn btn-outline-primary px-4 rounded-pill fw-medium" onClick={onCreate} style={{ fontSize: "14px" }}>
              Create Form
            </button>
          </div>
        ) : (
          /* --- MODERN CARD LIST --- */
          <div className="d-flex flex-column gap-3">

            {/* List Meta Header (Subtle) */}
            <div className="d-flex justify-content-between align-items-center px-2 mb-1">
              <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "14px", letterSpacing: "1px" }}>
                All Forms ({forms.length})
              </span>
            </div>

            {/* UPDATED: Added [...forms].reverse() to show latest at top */}
            {[...forms].reverse().map((form) => (
              <div
                key={form.id}
                onClick={() => onOpen(form.id)}
                className="card border-0 shadow-sm"
                style={{
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "#fff"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
                }}
              >
                <div className="card-body p-4 d-flex align-items-center">

                  {/* 1. Icon Box (Left Anchor) */}
                  <div className="me-4 d-none d-sm-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{
                      width: "56px",
                      height: "56px",
                      backgroundColor: "#F3F4F6",
                      color: "#6B7280"
                    }}
                  >
                    <i className="bi bi-file-earmark-text fs-4"></i>
                  </div>

                  {/* 2. Main Content */}
                  <div className="flex-grow-1 overflow-hidden me-3">
                    <div className="d-flex align-items-center mb-1">
                      <h5 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: "14px" }}>
                        {form.title}
                      </h5>
                      {/* Optional Status Badge */}
                      <span className="badge ms-2 rounded-pill fw-normal"
                        style={{ backgroundColor: "#ECFDF5", color: "#059669", fontSize: "14px" }}>
                        Active
                      </span>
                    </div>
                    <p className="text-muted mb-0 text-truncate" style={{ fontSize: "14px" }}>
                      {form.description || "No description provided for this form."}
                    </p>
                  </div>

                  {/* 4. Actions (Hover/Right) */}
                  <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-light text-primary d-flex align-items-center justify-content-center"
                      onClick={() => onEdit(form.id)}
                      title="Edit"
                      style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#EEF2FF" }}
                    >
                      <i className="bi bi-pencil-fill" style={{ fontSize: "14px" }}></i>
                    </button>
                    <button
                      className="btn btn-light text-danger d-flex align-items-center justify-content-center"
                      onClick={() => handleDeleteClick(form.id)}
                      title="Delete"
                      style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#FEF2F2" }}
                    >
                      <i className="bi bi-trash-fill" style={{ fontSize: "14px" }}></i>
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger" style={{ fontSize: "14px" }}>Delete Form?</h5>
                  <button type="button" className="btn-close" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body py-4">
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                    Are you sure you want to delete this form? This action cannot be undone.
                  </p>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={cancelDelete} style={{ fontSize: "14px" }}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger rounded-pill px-4" onClick={confirmDelete} style={{ fontSize: "14px" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;