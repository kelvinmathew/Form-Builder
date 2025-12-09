import React, { useState } from "react";

const FormPreview = ({ formData, onSubmit, onClose, readOnly = false }) => {
    const { title, description, schema } = formData || {}; 
    const fields = schema?.components || [];
    
    const [showSuccess, setShowSuccess] = useState(false);

    // --- TYPOGRAPHY CONSTANTS ---
    const fontText = { fontSize: "14px", fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' };
    const fontHeading = { fontSize: "16px", fontWeight: "bold", fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' };

    const getFieldOptions = (field) => {
        if (field.type === "select") return field.data?.values || [];
        if (field.type === "radio") return field.values || [];
        return [];
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowSuccess(true);
        if (onSubmit) onSubmit();
    };

    const renderField = (field) => {
        const options = getFieldOptions(field);
        // Modern input styling matching your dashboard
        const inputClass = "form-control shadow-none";
        const inputStyle = { 
            ...fontText, 
            backgroundColor: readOnly ? "#f9fafb" : "#fff",
            borderColor: "#e5e7eb",
            borderRadius: "8px",
            padding: "8px 12px",
            minHeight: "40px"
        };

        switch (field.type) {
            case "textarea": 
                return <textarea className={inputClass} style={{...inputStyle, minHeight: "100px"}} placeholder={field.placeholder} disabled={readOnly} rows={4} />;
            
            case "select":
                return (
                    <select className="form-select shadow-none" style={inputStyle} disabled={readOnly}>
                        <option value="">{field.placeholder || "Select..."}</option>
                        {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label || opt}</option>)}
                    </select>
                );
            
            case "radio":
                return (
                    <div className="d-flex flex-column gap-2">
                        {options.map((opt, i) => (
                            <label key={i} className={`d-flex align-items-center p-2 rounded-3 border ${readOnly ? 'bg-light text-muted' : 'bg-white'}`} style={{ cursor: readOnly ? "default" : "pointer", borderColor: "#e5e7eb" }}>
                                <input type="radio" name={`radio_${field.key}`} className="form-check-input me-3 mt-0" disabled={readOnly} />
                                <span style={fontText}>{opt.label || opt}</span>
                            </label>
                        ))}
                    </div>
                );
            
            case "checkbox":
                return (
                    <label className={`d-flex align-items-center p-2 rounded-3 border ${readOnly ? 'bg-light text-muted' : 'bg-white'}`} style={{ cursor: readOnly ? "default" : "pointer", borderColor: "#e5e7eb" }}>
                        <input type="checkbox" className="form-check-input me-3 mt-0" disabled={readOnly} />
                        <span style={fontText}>{field.placeholder || field.label}</span>
                    </label>
                );
            
            case "grid":
                return (
                    <div className="table-responsive border rounded-3 bg-white" style={{ borderColor: "#e5e7eb" }}>
                        <table className="table table-borderless mb-0">
                            <thead className="bg-light border-bottom">
                                <tr>
                                    <th className="p-3 text-muted text-uppercase fw-bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Question</th>
                                    {(field.columns || []).map((c, i) => <th key={i} className="p-3 text-center text-muted text-uppercase fw-bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>{c.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {(field.rows || []).map((r, i) => (
                                    <tr key={i} className="border-top" style={{ borderColor: "#f3f4f6" }}>
                                        <td className="p-3 fw-medium text-dark" style={fontText}>{r.label}</td>
                                        {(field.columns || []).map((c, j) => <td key={j} className="p-3 text-center"><input type="radio" name={`g_${field.key}_${i}`} className="form-check-input" disabled={readOnly} /></td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            
            case "table":
                return (
                    <div className="table-responsive border rounded-3 bg-white" style={{ borderColor: "#e5e7eb" }}>
                        <table className="table table-bordered mb-0">
                            <thead className="bg-light">
                                <tr>{(field.columns || []).map((c, i) => <th key={i} className="p-2 text-muted text-uppercase fw-bold" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>{c.label}</th>)}</tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: field.numRows || 3 }).map((_, i) => (
                                    <tr key={i}>{(field.columns || []).map((c, j) => <td key={j} className="p-1"><input className="form-control form-control-sm border-0 shadow-none" style={fontText} disabled={readOnly} /></td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            
            case "file":
                return (
                    <div className="d-flex flex-column align-items-center justify-content-center p-4 border border-dashed rounded-3 bg-light position-relative hover-bg-light-dark" style={{ borderColor: "#d1d5db", transition: "all 0.2s" }}>
                        <i className="bi bi-cloud-arrow-up text-primary fs-3 mb-2"></i>
                        <span className="text-muted fw-medium" style={fontText}>Click to upload file</span>
                        <input type="file" className="position-absolute w-100 h-100 top-0 start-0 opacity-0" style={{ cursor: "pointer" }} disabled={readOnly} />
                    </div>
                );
            
            default: 
                return <input type={field.type === "datetime" ? "date" : field.type} className={inputClass} style={inputStyle} placeholder={field.placeholder} disabled={readOnly} />;
        }
    };

    return (
        <div className="offcanvas-backdrop-custom">
            <style>{`
                .offcanvas-backdrop-custom {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(2px); z-index: 9999;
                }
                .form-drawer {
                    position: absolute; top: 0; right: 0; height: 100%; width: 100%; max-width: 600px;
                    background: #F3F4F6; /* Grey Background matching your project */
                    box-shadow: -4px 0 25px rgba(0, 0, 0, 0.05);
                    display: flex; flex-direction: column; animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                
                .drawer-header {
                    padding: 16px 24px; 
                    background: #ffffff; 
                    border-bottom: 1px solid #e5e7eb; 
                    display: flex; justify-content: space-between; align-items: center;
                }
                
                .drawer-body {
                    flex: 1; overflow-y: auto; padding: 24px; 
                    display: flex; flex-direction: column;
                }
                
                /* Scrollbar hiding */
                .drawer-body::-webkit-scrollbar { display: none; }
                .drawer-body { -ms-overflow-style: none; scrollbar-width: none; }

                .form-card {
                    background: #ffffff; padding: 32px; border-radius: 12px; 
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .close-btn {
                    width: 32px; height: 32px; 
                    border-radius: 6px; 
                    border: 1px solid #e5e7eb; 
                    background: #fff; 
                    color: #6b7280;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .close-btn:hover { background: #f9fafb; color: #111827; }

                /* Success State Styles */
                .success-card {
                    background: white; padding: 40px; border-radius: 16px; 
                    text-align: center; border: 1px solid #e5e7eb; 
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    max-width: 380px; width: 100%; margin: auto;
                }
                
                .form-label-custom {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: #374151; /* Dark grey */
                    margin-bottom: 6px;
                    display: block;
                }
            `}</style>

            <div className="form-drawer">
                {/* --- HEADER (Clean White) --- */}
                <div className="drawer-header">
                    <div>
                        <h5 className="mb-0 text-dark" style={fontHeading}>Form Preview</h5>
                        <small className="text-muted" style={fontText}>Review form components</small>
                    </div>
                    {onClose && (
                        <button className="close-btn" onClick={onClose} title="Close Preview">
                            <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
                        </button>
                    )}
                </div>

                <div className="drawer-body">
                    {showSuccess ? (
                        <div className="d-flex align-items-center justify-content-center h-100 w-100">
                            <div className="success-card animate-fade-in">
                                <div className="mb-4">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                        <i className="bi bi-check-lg text-success" style={{ fontSize: '32px' }}></i>
                                    </div>
                                </div>
                                <h4 className="text-dark mb-2" style={fontHeading}>Preview Submission</h4>
                                <p className="text-muted mb-4" style={fontText}>This is a preview. No data was actually saved to the database.</p>
                                <button className="btn btn-primary px-4 py-2 w-100" onClick={onClose} style={{ borderRadius: "8px", backgroundColor: "#4F46E5", border: "none", ...fontText }}>
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="form-card">
                            {/* Form Title & Description */}
                            <div className="mb-4 border-bottom pb-4" style={{ borderColor: "#f3f4f6" }}>
                                <h4 className="text-dark mb-2" style={{...fontHeading, fontSize: "20px"}}>{title || "Untitled Form"}</h4>
                                {description && <p className="text-muted mb-0" style={fontText}>{description}</p>}
                            </div>

                            {/* Actual Form Fields */}
                            <form onSubmit={handleSubmit}>
                                {fields.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: "60px", height: "60px"}}>
                                            <i className="bi bi-layout-text-window-reverse text-muted fs-4"></i>
                                        </div>
                                        <p className="text-muted fw-medium" style={fontText}>Form is currently empty</p>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-4">
                                        {fields.map((field) => (
                                            <div key={field.key}>
                                                <label className="form-label-custom">
                                                    {field.label} {field.validate?.required && <span className="text-danger">*</span>}
                                                </label>
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-5 pt-4 border-top d-flex justify-content-end" style={{ borderColor: "#f3f4f6" }}>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary text-white shadow-sm" 
                                        disabled={readOnly || fields.length === 0}
                                        style={{ 
                                            borderRadius: "8px", 
                                            padding: "8px 24px", 
                                            backgroundColor: "#4F46E5", 
                                            border: "none", 
                                            ...fontText 
                                        }}
                                    >
                                        Submit Form
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormPreview;