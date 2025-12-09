import React, { useState } from 'react';

const DataEntryList = ({ data, columnOrder, allComponents, onEdit }) => {
    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // --- PAGINATION LOGIC ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Show 4 preview keys
    const previewKeys = columnOrder.slice(0, 4);

    const fontStyleText = { fontSize: "14px" };

    return (
        <div className="d-flex flex-column gap-3">
            
            {/* List Meta Header */}
            {data.length > 0 && (
                <div className="d-flex justify-content-end px-2 mb-1">
                    <span className="text-muted small">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            )}

            {currentData.map((row, idx) => {
                const absoluteRowNumber = indexOfFirstItem + idx + 1;

                return (
                    <div
                        key={row._rowId || idx}
                        className="card border-0 shadow-sm w-100 cursor-pointer entry-card"
                        onClick={() => onEdit(row)}
                        style={{ borderRadius: "12px", transition: "all 0.2s ease-in-out", backgroundColor: "#fff" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(201, 28, 28, 0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(143, 34, 34, 0.04)"; }}
                    >
                        <div className="card-body p-4 d-flex align-items-center">
                            
                            {/* 1. LEFT: ID + Date (Stacked) */}
                            <div className="me-5 d-flex flex-column align-items-start" style={{ minWidth: "100px" }}>
                                <div className="rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1 fw-bold mb-2" style={fontStyleText}>
                                    <i className="bi bi-hash me-1"></i> {absoluteRowNumber}
                                </div>
                                <div className="d-flex align-items-center text-muted" style={fontStyleText}>
                                    {/* UPDATED: Calendar Icon */}
                                    <i className="bi bi-calendar4 me-2"></i>
                                    {/* Format Date only */}
                                    <span>{row.createdAt ? row.createdAt.split(',')[0] : 'No Date'}</span>
                                </div>
                            </div>

                            {/* 2. MIDDLE: Data Columns (Horizontal Layout) */}
                            <div className="flex-grow-1 d-none d-md-flex align-items-center ">
                                <div className="row w-100 ">
                                    {previewKeys.map(key => {
                                        const comp = allComponents.find(c => c.key === key);
                                        let displayVal = row[key];

                                        if (comp && (comp.type === 'select' || comp.type === 'radio' || comp.type === 'checkbox')) {
                                            const options = comp.values || comp.data?.values || [];
                                            if (options.length > 0) {
                                                if (Array.isArray(displayVal)) {
                                                    displayVal = displayVal.map(val => {
                                                        const match = options.find(opt => opt.value === val);
                                                        return match ? match.label : val;
                                                    }).join(", ");
                                                } else {
                                                    const match = options.find(opt => opt.value === displayVal);
                                                    if (match) displayVal = match.label;
                                                }
                                            }
                                        }

                                        return (
                                            <div key={key} className="col">
                                                {/* HEADER: Uppercase, Small, Grey, Bold */}
                                                <div className="text-black fw-bold mb-2 text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                                                    {comp?.label || key}
                                                </div>
                                                {/* VALUE: 14px Standard */}
                                                <div className="text-dark text-truncate fw-medium" style={fontStyleText}>
                                                    {displayVal ? displayVal : <span className="text-muted opacity-25">-</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. RIGHT: Edit Button */}
                            <div className="ms-4">
                                <button 
                                    className="btn d-flex align-items-center justify-content-center"
                                    style={{ 
                                        width: "40px", 
                                        height: "40px", 
                                        borderRadius: "50%", // Circular button
                                        backgroundColor: "#eff6ff", 
                                        color: "#3b82f6", 
                                        border: "none",
                                        ...fontStyleText
                                    }}
                                >
                                    <i className="bi bi-pencil-square"></i>
                                </button>
                            </div>

                        </div>
                    </div>
                );
            })}

            {/* --- PAGINATION CONTROLS (CENTERED) --- */}
            {data.length > 0 && (
              <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ borderRadius: "8px", height: "35px", width: "35px", display: "flex", alignItems: "center", justifyContent: "center", ...fontStyleText }}
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
                      ...fontStyleText
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ borderRadius: "8px", height: "35px", width: "35px", display: "flex", alignItems: "center", justifyContent: "center", ...fontStyleText }}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}

            {data.length === 0 && (
                <div className="text-center py-5 rounded-4 border border-dashed" style={{backgroundColor: "#f8f9fa"}}>
                    <i className="bi bi-inbox text-muted fs-1 mb-3 d-block opacity-50"></i>
                    <h6 className="text-muted fw-bold" style={fontStyleText}>No entries found</h6>
                    <p className="text-muted mb-0" style={fontStyleText}>Create a new entry to get started.</p>
                </div>
            )}

            <style>{`
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.05); background-color: #eef2ff; }
            `}</style>
        </div>
    );
};

export default DataEntryList;