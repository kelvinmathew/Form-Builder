import React from 'react';

const DataEntryList = ({ data, columnOrder, allComponents, onEdit }) => {
    // Show 4 preview keys as before
    const previewKeys = columnOrder.slice(0, 4);

    return (
        <div className="d-flex flex-column gap-3">
            {data.map((row, idx) => (
                <div
                    key={row._rowId || idx}
                    className="card border-0 shadow-sm w-100 cursor-pointer entry-card"
                    onClick={() => onEdit(row)}
                    style={{ borderRadius: "12px", transition: "all 0.2s ease-in-out", backgroundColor: "#fff" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(201, 28, 28, 0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(143, 34, 34, 0.04)"; }}
                >
                    <div className="card-body p-4">
                        <div className="row align-items-center g-4">
                            
                            {/* 1. Entry Info Section (Left) */}
                            <div className="col-12 col-md-3 d-flex flex-column justify-content-center border-end-md">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1 fw-bold " style={{ fontSize: "14px" }}>
                                        <i className="bi bi-hash me-0"></i> {idx + 1}
                                    </div>
                                </div>
                                <div className="d-flex align-items-center text-muted" style={{ fontSize: "14px" }}>
                                    <i className="bi bi-clock me-1"></i>
                                    <span>{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : 'Just now'}</span>
                                </div>
                            </div>

                            {/* 2. Data Preview Section (Middle) */}
                            <div className="col-12 col-md-7">
                                <div className="row g-4">
                                    {previewKeys.map(key => {
                                        const comp = allComponents.find(c => c.key === key);
                                        
                                        // Logic to get Label instead of Internal ID
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
                                            <div key={key} className="col-6 col-lg-3">
                                                {/* HEADER: 16px (14px + 2px) */}
                                                <div className="text-black fw-bold mb-3 text-uppercase" style={{ fontSize: "12.3px", letterSpacing: "0.0px" }}>
                                                    {comp?.label || key}
                                                </div>
                                                {/* VALUE: 14px */}
                                                <div className="text-dark text-truncate" style={{ fontSize: "13.5px" }}>
                                                    {displayVal ? displayVal : <span className="text-muted opacity-50">-</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Action Button Section (Right) */}
                            <div className="col-12 col-md-2 text-md-end d-flex align-items-center justify-content-md-end justify-content-start">
                                <button className="btn btn-light rounded-pill px-4 py-2 text-primary fw-bold border-0 d-flex align-items-center gap-2 hover-scale" style={{ fontSize: "14px" }}>
                                    <span></span>
                                    <i className="bi bi-pencil-square"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {data.length === 0 && (
                <div className="text-center py-5 rounded-4 border border-dashed" style={{backgroundColor: "#f8f9fa"}}>
                    <i className="bi bi-inbox text-muted fs-1 mb-3 d-block opacity-50"></i>
                    <h6 className="text-muted fw-bold" style={{ fontSize: "16px" }}>No entries found</h6>
                    <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Create a new entry to get started.</p>
                </div>
            )}

            <style>{`
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.05); background-color: #eef2ff; }
                @media (min-width: 768px) {
                    .border-end-md { border-right: 1px solid #f0f0f0; }
                }
            `}</style>
        </div>
    );
};

export default DataEntryList;