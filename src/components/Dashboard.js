import React, { useState } from "react";

const Dashboard = ({ forms, onCreate, onEdit, onDelete, onOpen }) => {
  // State to manage the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  
  // UPDATED: Set to 20 items per page as requested
  const itemsPerPage = 20; 

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

  // --- PAGINATION LOGIC ---
  // 1. Sort forms by newest first
  const sortedForms = [...forms].reverse();

  // 2. Calculate indices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // 3. Get current items for this page
  const currentForms = sortedForms.slice(indexOfFirstItem, indexOfLastItem);

  // 4. Calculate total pages
  const totalPages = Math.ceil(forms.length / itemsPerPage);

  // 5. Change page handler
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F3F4F6", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>

      {/* --- HEADER SECTION --- */}
      <div className="bg-white border-bottom sticky-top" style={{ zIndex: 100 }}>
        <div className="container px-4 px-lg-5 py-4">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-6">
              <h4 className="fw-bold text-dark mb-2" style={{ letterSpacing: "0.2px", fontSize: "16px" }}>Dashboard</h4>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Manage your forms and data collection.</p>
            </div>
            <div className="col-12 col-md-6 d-flex flex-column flex-md-row justify-content-md-end gap-3">
              <button
                className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-2 fw-semibold shadow-sm rounded-3"
                onClick={onCreate}
                style={{ backgroundColor: "#4F46E5", color: "#ffffff", fontSize: "14px", border: "none" }}
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
        {forms.length === 0 ? (
          <div className="text-center py-5">
            <div className="d-inline-flex align-items-center justify-content-center mb-4 rounded-circle"
              style={{ width: "80px", height: "80px", backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
              <i className="bi bi-inbox fs-1"></i>
            </div>
            <h4 className="fw-bold text-dark" style={{ fontSize: "14px" }}>No forms found</h4>
            <button className="btn btn-outline-primary px-4 rounded-pill fw-medium mt-3" onClick={onCreate} style={{ fontSize: "14px" }}>
              Create Form
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {/* List Meta Header */}
            <div className="d-flex justify-content-between align-items-center px-2 mb-1">
              <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "14px", letterSpacing: "1px" }}>
                All Forms ({forms.length})
              </span>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
              </span>
            </div>

            {/* Render Paginated Forms (Up to 20) */}
            {currentForms.map((form) => (
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
              >
                <div className="card-body p-4 d-flex align-items-center">
                  <div className="me-4 d-none d-sm-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: "56px", height: "56px", backgroundColor: "#F3F4F6", color: "#6B7280" }}
                  >
                    <i className="bi bi-file-earmark-text fs-4"></i>
                  </div>
                  <div className="flex-grow-1 overflow-hidden me-3">
                    <div className="d-flex align-items-center mb-1">
                      <h5 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: "14px" }}>{form.title}</h5>
                      <span className="badge ms-2 rounded-pill fw-normal" style={{ backgroundColor: "#ECFDF5", color: "#059669", fontSize: "14px" }}>Active</span>
                    </div>
                    <p className="text-muted mb-0 text-truncate" style={{ fontSize: "14px" }}>
                      {form.description || "No description provided."}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-light text-primary" onClick={() => onEdit(form.id)} style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#EEF2FF" }}>
                      <i className="bi bi-pencil-fill" style={{ fontSize: "14px" }}></i>
                    </button>
                    <button className="btn btn-light text-danger" onClick={() => handleDeleteClick(form.id)} style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#FEF2F2" }}>
                      <i className="bi bi-trash-fill" style={{ fontSize: "14px" }}></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* --- PAGINATION CONTROLS --- */}
            {/* Logic: Show pagination bar if there is at least 1 form, even if it's just Page 1 */}
            {forms.length > 0 && (
              <div className="d-flex justify-content-end align-items-center mt-4 gap-2">
                
                {/* Previous Button */}
                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ borderRadius: "8px", fontSize: "14px", height: "35px", width: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`btn shadow-sm fw-semibold ${currentPage === i + 1 ? 'text-white' : 'text-dark bg-white border'}`}
                    style={{
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: currentPage === i + 1 ? "#4F46E5" : "#fff",
                      width: "35px",
                      height: "35px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ borderRadius: "8px", fontSize: "14px", height: "35px", width: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger" style={{ fontSize: "14px" }}>Delete Form?</h5>
                  <button type="button" className="btn-close" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body py-4">
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Are you sure? This action cannot be undone.</p>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button className="btn btn-light rounded-pill px-4" onClick={cancelDelete} style={{ fontSize: "14px" }}>Cancel</button>
                  <button className="btn btn-danger rounded-pill px-4" onClick={confirmDelete} style={{ fontSize: "14px" }}>Delete</button>
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