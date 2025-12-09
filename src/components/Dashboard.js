import React, { useState } from "react";

const Dashboard = ({ forms, onCreate, onEdit, onDelete, onOpen }) => {
  // State to manage the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
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
  const sortedForms = [...forms].reverse();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentForms = sortedForms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(forms.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Common font styles to ensure consistency
  const fontStyleMain = { fontSize: "14px" };
  const fontStyleHeading = { fontSize: "16px", fontWeight: "bold" };

  return (
    <div 
      className="min-vh-100" 
      style={{ 
        backgroundColor: "#F3F4F6" // The grey body background
      }}
    >

      {/* --- HEADER SECTION --- */}
      <div className="bg-light border-bottom sticky-top" style={{ zIndex: 100 }}>
        <div className="container px-4 px-lg-5 py-4">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-6">
              {/* Heading updated to 16px */}
              <h4 className="text-black fs-5 mb-2" style={fontStyleHeading}>
                Dashboard
              </h4>
              <p className="text-muted mb-0" style={fontStyleMain}>Manage your forms and data collection.</p>
            </div>
            <div className="col-12 col-md-6 d-flex flex-column flex-md-row justify-content-md-end gap-3">
              <button
                className="btn d-flex align-items-center justify-content-center gap-1 px-3 py-2 fw-semibold shadow-sm rounded-3"
                onClick={onCreate}
                // Button text 14px
                style={{ backgroundColor: "#4F46E5", color: "#ffffff", border: "none", ...fontStyleMain }}
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
            <h4 className="text-dark" style={fontStyleHeading}>
                No forms found
            </h4>
            <button className="btn btn-outline-primary px-4 rounded-pill fw-medium mt-3" onClick={onCreate} style={fontStyleMain}>
              Create Form
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {/* List Meta Header */}
            <div className="d-flex justify-content-between align-items-center px-2 mb-1">
              <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                All Forms ({forms.length})
              </span>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
              </span>
            </div>

            {/* Render Paginated Forms */}
            {currentForms.map((form) => (
              <div
                key={form.id}
                onClick={() => onOpen(form.id)}
                className="card border-0 shadow-sm"
                style={{
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "#FAFAFA" // Changed from #fff to #FAFAFA (Off-white)
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
                      {/* Form Title updated to 16px */}
                      <h5 className="text-black mb-0 text-truncate" style={fontStyleHeading}>
                        {form.title}
                      </h5>
                      <span className="badge ms-2 rounded-pill fw-normal" style={{ backgroundColor: "#ECFDF5", color: "#059669", fontSize: "12px" }}>Active</span>
                    </div>
                    {/* Description updated to 14px */}
                    <p className="text-muted mb-0 text-truncate" style={fontStyleMain}>
                      {form.description || "No description provided."}
                    </p>
                  </div>
                  
                  <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    
                    {/* --- UPDATED EDIT BUTTON --- */}
                    <button 
                        className="btn d-flex align-items-center justify-content-center"
                        onClick={() => onEdit(form.id)} 
                        title="Edit Form"
                        style={{ 
                            width: "40px", 
                            height: "40px", 
                            borderRadius: "10px", 
                            backgroundColor: "#eff6ff", 
                            color: "#3b82f6",           
                            border: "none",
                            ...fontStyleMain
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                    >
                      <i className="bi bi-pencil-square" style={{fontSize: "18px"}}></i>
                    </button>

                    {/* Delete Button */}
                    <button 
                        className="btn btn-light text-danger d-flex align-items-center justify-content-center" 
                        onClick={() => handleDeleteClick(form.id)} 
                        style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#FEF2F2", ...fontStyleMain }}
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* --- PAGINATION CONTROLS (CENTERED) --- */}
            {forms.length > 0 && (
              <div className="d-flex justify-content-center align-items-center mt-4 gap-2"> 
                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ borderRadius: "8px", height: "35px", width: "35px", display: "flex", alignItems: "center", justifyContent: "center", ...fontStyleMain }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`btn shadow-sm fw-semibold ${currentPage === i + 1 ? 'text-white' : 'text-dark bg-white border'}`}
                    style={{
                      borderRadius: "8px",
                      backgroundColor: currentPage === i + 1 ? "#4F46E5" : "#fff",
                      width: "35px",
                      height: "35px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...fontStyleMain // Ensures number is 14px
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ borderRadius: "8px", height: "35px", width: "35px", display: "flex", alignItems: "center", justifyContent: "center", ...fontStyleMain }}
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
                  <h5 className="modal-title text-danger" style={fontStyleHeading}>
                    Delete Form?
                  </h5>
                  <button type="button" className="btn-close" onClick={cancelDelete}></button>
                </div>
                <div className="modal-body py-4">
                  <p className="text-muted mb-0" style={fontStyleMain}>Are you sure? This action cannot be undone.</p>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button className="btn btn-outline-secondary btn-sm rounded-6 px-3" onClick={cancelDelete} style={fontStyleMain}>Cancel</button>
                  <button className="btn btn-danger btn-sm rounded-6 px-3" onClick={confirmDelete} style={fontStyleMain}>Delete</button>
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