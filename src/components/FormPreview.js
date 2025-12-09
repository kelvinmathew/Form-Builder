import React, { useState } from "react";

const FormPreview = ({ formData, onSubmit, onClose, readOnly = false }) => {
    const { title, description, schema } = formData || {}; 
    const fields = schema?.components || [];
    
    const [showSuccess, setShowSuccess] = useState(false);

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
        const inputClass = "form-control modern-input";

        switch (field.type) {
            case "textarea": return <textarea className={inputClass} placeholder={field.placeholder} disabled={readOnly} rows={4} />;
            case "select":
                return (
                    <select className="form-select modern-input" disabled={readOnly}>
                        <option value="">{field.placeholder || "Select..."}</option>
                        {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label || opt}</option>)}
                    </select>
                );
            case "radio":
                return (
                    <div className="d-flex flex-column gap-2">
                        {options.map((opt, i) => (
                            <label key={i} className={`option-card ${readOnly ? 'disabled' : ''}`}>
                                <input type="radio" name={`radio_${field.key}`} className="form-check-input me-3" disabled={readOnly} />
                                <span>{opt.label || opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case "checkbox":
                return (
                    <label className={`option-card ${readOnly ? 'disabled' : ''}`}>
                        <input type="checkbox" className="form-check-input me-3" disabled={readOnly} />
                        <span>{field.placeholder || field.label}</span>
                    </label>
                );
            case "grid":
                return (
                    <div className="table-responsive border rounded bg-white">
                        <table className="table table-borderless mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="p-3 text-muted small text-uppercase">Question</th>
                                    {(field.columns || []).map((c, i) => <th key={i} className="p-3 text-center text-muted small text-uppercase">{c.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {(field.rows || []).map((r, i) => (
                                    <tr key={i} className="border-top">
                                        <td className="p-3 fw-medium">{r.label}</td>
                                        {(field.columns || []).map((c, j) => <td key={j} className="p-3 text-center"><input type="radio" name={`g_${field.key}_${i}`} className="form-check-input" disabled={readOnly} /></td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case "table":
                return (
                    <div className="table-responsive border rounded bg-white">
                        <table className="table table-bordered mb-0">
                            <thead className="bg-light">
                                <tr>{(field.columns || []).map((c, i) => <th key={i} className="p-2 small text-muted text-uppercase">{c.label}</th>)}</tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: field.numRows || 3 }).map((_, i) => (
                                    <tr key={i}>{(field.columns || []).map((c, j) => <td key={j} className="p-1"><input className="form-control form-control-sm border-0" disabled={readOnly} /></td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case "file":
                return (
                    <div className="file-upload-box">
                        <i className="bi bi-cloud-upload fs-3 text-primary mb-2"></i>
                        <span className="small text-muted">Click to upload file</span>
                        <input type="file" disabled={readOnly} />
                    </div>
                );
            default: return <input type={field.type === "datetime" ? "date" : field.type} className={inputClass} placeholder={field.placeholder} disabled={readOnly} />;
        }
    };

    return (
        <div className="offcanvas-backdrop-custom">
            <style>{`
                .offcanvas-backdrop-custom {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background-color: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px); z-index: 9999;
                    /* Fonts handled by global CSS */
                }
                .form-drawer {
                    position: absolute; top: 0; right: 0; height: 100%; width: 100%; max-width: 600px;
                    background: #f8fafc; box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
                    display: flex; flex-direction: column; animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .drawer-header {
                    padding: 24px 32px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;
                    background: linear-gradient(135deg, #5187ebff 0%, #9189dbff 100%); position: sticky; top: 0; z-index: 10;
                }
                .drawer-header h5 { color: #ffffff !important; font-size: 1.25rem; }
                .drawer-header small { color: rgba(255, 255, 255, 0.85) !important; }
                .drawer-body {
                    flex: 1; overflow-y: auto; padding: 30px; background: #f8f9fa;
                    scrollbar-width: none; -ms-overflow-style: none; display: flex; flex-direction: column;
                }
                .drawer-body::-webkit-scrollbar { display: none; }
                .drawer-content-paper {
                    background: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                }
                .close-btn {
                    background: rgba(255, 255, 255, 0.2); border: none; font-size: 1.3rem; color: #ffffff;
                    cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
                    border-radius: 10px; backdrop-filter: blur(10px); transition: 0.3s;
                }
                .close-btn:hover { background: rgba(255, 255, 255, 0.3); transform: rotate(90deg); }
                .modern-input { padding: 10px 14px; border-radius: 6px; border: 1px solid #dee2e6; transition: 0.2s; }
                .modern-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
                .option-card { display: flex; align-items: center; padding: 10px 14px; border: 1px solid #e9ecef; border-radius: 6px; cursor: pointer; transition: 0.2s; background: #fff; }
                .option-card:hover { background: #f8f9fa; border-color: #dee2e6; }
                .file-upload-box { position: relative; border: 2px dashed #dee2e6; border-radius: 6px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8f9fa; transition: 0.2s; }
                .file-upload-box:hover { border-color: #4f46e5; background: #eef2ff; }
                .file-upload-box input { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
                .btn-submit { background-color: #4f46e5; border: none; padding: 10px 30px; border-radius: 6px; font-weight: 500; transition: 0.2s; }
                .btn-submit:hover { background-color: #4338ca; }
                
                .success-container { flex: 1; display: flex; align-items: center; justify-content: center; height: 100%; animation: fadeIn 0.4s ease; }
                .success-card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; max-width: 400px; width: 100%; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div className="form-drawer">
                <div className="drawer-header">
                    <div>
                        <h5 className="mb-0 fw-bold">Form Preview</h5>
                        <small className="text-muted">Review form components</small>
                    </div>
                    {onClose && (
                        <button className="close-btn" onClick={onClose} title="Close Preview">
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>

                <div className="drawer-body">
                    {showSuccess ? (
                        <div className="success-container">
                            <div className="success-card">
                                <div className="mb-3">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                        <i className="bi bi-check-lg text-success" style={{ fontSize: '40px' }}></i>
                                    </div>
                                </div>
                                <h4 className="fw-bold text-dark mb-2">This is just a preview of your form.</h4>
                                <p className="text-muted mb-4">Go to the dashboard to create your own forms. </p>
                                <button className="btn btn-primary px-4 py-2 rounded-pill" onClick={onClose}>
                                    Okay, Close Preview
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="drawer-content-paper">
                            {/* Form Title & Description */}
                            <div className="mb-4 border-bottom pb-4">
                                <h3 className="fw-bold text-dark mb-2">{title || "Untitled Form"}</h3>
                                {description && <p className="text-muted mb-0">{description}</p>}
                            </div>

                            {/* Actual Form Fields */}
                            <form onSubmit={handleSubmit}>
                                {fields.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-layout-text-window-reverse fs-1 opacity-50"></i>
                                        <p className="mt-2">Form is currently empty</p>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-4">
                                        {fields.map((field) => (
                                            <div key={field.key}>
                                                <label className="fw-bold text-dark mb-2 d-block" style={{ fontSize: '0.95rem' }}>
                                                    {field.label} {field.validate?.required && <span className="text-danger">*</span>}
                                                </label>
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-5 pt-4 border-top d-flex justify-content-end">
                                    <button type="submit" className="btn btn-primary btn-submit text-white" disabled={readOnly || fields.length === 0}>
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