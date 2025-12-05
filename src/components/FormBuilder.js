import React, { useState } from "react";
import FormPreview from "./FormPreview"; // Importing the separate component

const FIELD_TYPES = [
    { type: "textfield", label: "Text Input", icon: "bi-input-cursor-text" },
    { type: "number", label: "Number", icon: "bi-123" },
    { type: "email", label: "Email", icon: "bi-envelope" },
    { type: "textarea", label: "Text Area", icon: "bi-text-paragraph" },
    { type: "select", label: "Dropdown", icon: "bi-menu-button-wide" },
    { type: "checkbox", label: "Checkbox Group", icon: "bi-check-square" },
    { type: "radio", label: "Radio Buttons", icon: "bi-ui-radios" },
    { type: "datetime", label: "Date", icon: "bi-calendar" },
    { type: "time", label: "Time", icon: "bi-clock" },
    { type: "file", label: "File Upload", icon: "bi-upload" },
];

const FormBuilder = ({ initialData, onSave, onCancel }) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");

    const [projectDetails, setProjectDetails] = useState(() => {
        const savedDetails = initialData?.projectDetails || {};
        return {
            headers: savedDetails.headers || [{ id: 'h1', label: "", value: "" }],
            footers: savedDetails.footers || [{ id: 'f1', type: "text", value: "" }]
        };
    });

    const [detailErrors, setDetailErrors] = useState({});
    const [showReportConfig, setShowReportConfig] = useState(false);
    const [fields, setFields] = useState(initialData?.schema?.components || []);
    const [editingField, setEditingField] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggedFieldIndex, setDraggedFieldIndex] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // deleteConfirm now handles 'headers', 'footers', and 'field'
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, section: null, id: null });

    const addDetailField = (section) => {
        const newField = section === 'footers'
            ? { id: Date.now().toString(), type: "text", value: "" }
            : { id: Date.now().toString(), label: "", value: "" };

        setProjectDetails(prev => ({
            ...prev,
            [section]: [...(prev[section] || []), newField]
        }));
    };

    const updateDetailField = (section, id, key, newValue) => {
        setProjectDetails(prev => ({
            ...prev,
            [section]: prev[section].map(item =>
                item.id === id ? { ...item, [key]: newValue } : item
            )
        }));

        const errorKey = `${section}_${id}_${key}`;
        if (detailErrors[errorKey]) {
            setDetailErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const handleFooterImageUpload = (section, id, file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateDetailField(section, id, 'value', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Generic delete request (handles canvas fields + header/footer)
    const requestDeleteDetail = (section, id) => {
        setDeleteConfirm({ show: true, section, id });
    };

    // Consolidated confirm logic
    const confirmDeleteDetail = () => {
        const { section, id } = deleteConfirm;
        if (!section || !id) return;

        // CASE 1: Deleting a Field from Canvas
        if (section === 'field') {
            setFields(fields.filter((f) => f.key !== id));
            if (editingField?.key === id) setEditingField(null);
        }
        // CASE 2: Deleting Header or Footer details
        else {
            setProjectDetails(prev => ({
                ...prev,
                [section]: prev[section].filter(item => item.id !== id)
            }));
            setDetailErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`${section}_${id}_label`];
                delete newErrors[`${section}_${id}_value`];
                return newErrors;
            });
        }

        setDeleteConfirm({ show: false, section: null, id: null });
    };

    const cancelDeleteDetail = () => {
        setDeleteConfirm({ show: false, section: null, id: null });
    };

    const validateDetails = () => {
        let errors = {};
        let isValid = true;

        if (projectDetails.headers) {
            projectDetails.headers.forEach(item => {
                if (!item.label || item.label.trim() === "") {
                    errors[`headers_${item.id}_label`] = "Label required";
                    isValid = false;
                }
                if (!item.value || item.value.trim() === "") {
                    errors[`headers_${item.id}_value`] = "Value required";
                    isValid = false;
                }
            });
        }

        if (projectDetails.footers) {
            projectDetails.footers.forEach(item => {
                if (!item.value || item.value.trim() === "") {
                    errors[`footers_${item.id}_value`] = item.type === 'image' ? "Image required" : "Text required";
                    isValid = false;
                }
            });
        }

        setDetailErrors(errors);
        return isValid;
    };

    const generateKey = (label) => {
        return label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now();
    };

    const addNewField = (fieldType) => {
        const key = generateKey(fieldType.label);
        const defaultOptions = [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" }
        ];

        const newField = {
            type: fieldType.type,
            key: key,
            label: fieldType.label,
            placeholder: "",
            input: true,
            validate: { required: false },
            ...(fieldType.type === "select" && {
                data: { values: defaultOptions },
                defaultValue: ""
            }),
            ...(fieldType.type === "radio" && {
                values: defaultOptions,
                defaultValue: ""
            }),
            ...(fieldType.type === "checkbox" && {
                values: defaultOptions,
                defaultValue: []
            }),
        };
        setFields([...fields, newField]);
        setEditingField(newField);
    };

    // Drag and Drop Logic
    const handleDragStart = (e, fieldType) => { setDraggedItem(fieldType); e.dataTransfer.effectAllowed = "copy"; };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };
    const handleDrop = (e) => {
        e.preventDefault();
        if (draggedItem) {
            addNewField(draggedItem);
        }
        setDraggedItem(null);
    };

    const handleSortStart = (e, index) => { setDraggedFieldIndex(index); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", index); };
    const handleSortOver = (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; };
    const handleSortDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedFieldIndex !== null && draggedFieldIndex !== undefined) {
            e.stopPropagation();
            if (draggedFieldIndex === targetIndex) { setDraggedFieldIndex(null); return; }
            const newFields = [...fields];
            const [movedItem] = newFields.splice(draggedFieldIndex, 1);
            newFields.splice(targetIndex, 0, movedItem);
            setFields(newFields);
            setDraggedFieldIndex(null);
        }
    };

    const handleDoubleClick = (fieldType) => addNewField(fieldType);
    const handleFieldUpdate = (updatedField) => { setFields(fields.map((f) => (f.key === updatedField.key ? updatedField : f))); setEditingField(updatedField); };

    // Note: handleDeleteField logic is now inside confirmDeleteDetail

    const handleMoveField = (index, direction) => {
        const newFields = [...fields]; const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < fields.length) { [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]; setFields(newFields); }
    };

    const handleSaveClick = () => {
        if (!title.trim()) {
            setErrorMessage("Please enter a form title before saving.");
            setShowErrorModal(true);
            return;
        }

        for (const field of fields) {
            if (['select', 'radio', 'checkbox'].includes(field.type)) {
                const options = getFieldOptions(field);
                if (!options || options.length === 0) {
                    setErrorMessage(`The field "${field.label}" has no options. You must add at least one option.`);
                    setShowErrorModal(true);
                    setEditingField(field);
                    return;
                }
            }
        }

        if (!validateDetails()) {
            if (!showReportConfig) setShowReportConfig(true);
            return;
        }

        onSave({ title, description, projectDetails, schema: { display: "form", components: fields } });
    };

    const getFieldOptions = (field) => {
        if (field.type === "select") return field.data?.values || [];
        if (field.type === "radio" || field.type === "checkbox") return field.values || [];
        return [];
    };

    const updateFieldOptions = (field, newOptions) => {
        let newDefaultValue = field.defaultValue;

        if (field.type === "checkbox" && Array.isArray(newDefaultValue)) {
            newDefaultValue = newDefaultValue.filter(val => newOptions.find(o => o.value === val));
        } else if (typeof newDefaultValue === 'string') {
            if (!newOptions.find(o => o.value === newDefaultValue)) newDefaultValue = "";
        }

        if (field.type === "select") return { ...field, defaultValue: newDefaultValue, data: { ...field.data, values: newOptions } };
        if (field.type === "radio" || field.type === "checkbox") return { ...field, defaultValue: newDefaultValue, values: newOptions };
        return field;
    };

    const renderCardPreview = (field) => {
        const commonProps = {
            className: "form-control form-control-sm",
            placeholder: field.placeholder || "",
            readOnly: true,
            style: { backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' }
        };

        switch (field.type) {
            case "textfield": return <input type="text" {...commonProps} />;
            case "number": return <input type="number" {...commonProps} />;
            case "email": return <input type="email" {...commonProps} />;
            case "textarea": return <textarea className="form-control form-control-sm" rows="2" readOnly placeholder={field.placeholder || ""} style={{ cursor: 'pointer', backgroundColor: '#fff', fontSize: '14px' }}></textarea>;

            case "select":
                return (
                    <select className="form-select form-select-sm" style={{ pointerEvents: 'none', fontSize: '14px' }} value={field.defaultValue || ""}>
                        <option value="">Select an option</option>
                        {field.data?.values?.map((opt, i) => (
                            <option key={i} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case "radio":
                return (
                    <div style={{ fontSize: '14px' }}>
                        {field.values?.map((opt, i) => (
                            <div className="form-check" key={i}>
                                <input className="form-check-input" type="radio" name={field.key} readOnly checked={field.defaultValue === opt.value} />
                                <label className="form-check-label">{opt.label}</label>
                            </div>
                        ))}
                        {(!field.values || field.values.length === 0) && <small className="text-muted">No options added</small>}
                    </div>
                );
            case "checkbox":
                return (
                    <div style={{ fontSize: '14px' }}>
                        {field.values?.map((opt, i) => (
                            <div className="form-check" key={i}>
                                <input className="form-check-input" type="checkbox" readOnly checked={Array.isArray(field.defaultValue) && field.defaultValue.includes(opt.value)} />
                                <label className="form-check-label">{opt.label}</label>
                            </div>
                        ))}
                        {(!field.values || field.values.length === 0) && <small className="text-muted">No options added</small>}
                    </div>
                );
            case "datetime": return <input type="date" {...commonProps} />;
            case "time": return <input type="time" {...commonProps} />;
            case "file": return <input type="file" className="form-control form-control-sm" style={{ fontSize: '14px' }} />;
            default: return <input className="form-control form-control-sm" readOnly placeholder={field.type} style={{ fontSize: '14px' }} />;
        }
    };

    const getHighlightStyle = (value) => {
        return value && value.trim() !== "" ? "border-success bg-success-subtle shadow-sm" : "";
    };

    return (
        <div className="d-flex flex-column h-100">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet" />

            <style>{`
                * { box-sizing: border-box; }
                html, body { margin: 0; padding: 0; background-color: #f8f9fa; font-size: 14px; }
                .editor-toolbar { background-color: #f8f9fa; padding-bottom: 10px; border-bottom: none; }
                .field-types-container { position: sticky; top: 80px; height: calc(100vh - 100px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef; display: flex; flex-direction: column; background: white; overflow: hidden; border-radius: 12px; z-index: 1000; }
                .settings-panel { position: sticky; top: 80px; max-height: calc(100vh - 100px); background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 14px; overflow-y: auto; scrollbar-width: none; z-index: 1000; }
                .field-sidebar { flex: 1; overflow-y: auto; padding: 8px 12px 20px 12px; scrollbar-width: thin; scrollbar-color: #cbd5e0 transparent; }
                .field-sidebar::-webkit-scrollbar { width: 8px; display: block; }
                .field-sidebar::-webkit-scrollbar-track { background: transparent; }
                .field-sidebar::-webkit-scrollbar-thumb { background-color: #cbd5e0; border-radius: 4px; }
                .field-type-item { padding: 10px 12px; margin-bottom: 8px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border: 1px solid #e9ecef; border-radius: 8px; cursor: grab; transition: all 0.3s ease; display: flex; align-items: center; gap: 10px; user-select: none; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .field-type-item:hover { background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%); border-color: #0d6efd; box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15); transform: translateY(-1px); }
                .canvas-area { min-height: 400px; height: auto; border: 2px dashed #dee2e6; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%); transition: all 0.3s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
                .canvas-area.drag-over { border-color: #0d6efd; background: linear-gradient(135deg, #f0f7ff 0%, #e7f3ff 100%); box-shadow: inset 0 2px 8px rgba(13, 110, 253, 0.1); }
                .field-card { background: #fff; border: 1px solid #e9ecef; border-radius: 10px; padding: 14px; margin-bottom: 12px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .field-card:hover { border-color: #0d6efd; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15); transform: translateY(-2px); }
                .field-card.active { border-color: #0d6efd; background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%); box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15); transform: translateY(-1px); }
                .settings-panel::-webkit-scrollbar { display: none; }
                .content-wrapper { flex: 1; }
                .form-control, .form-select { transition: border-color 0.2s, background-color 0.2s; font-size: 14px; }
                .btn { font-size: 14px; }
                
                fieldset.custom-fieldset { border: 1px solid #dee2e6; border-radius: 0.5rem; padding: 0.75rem 1rem 1rem 1rem; position: relative; background-color: white; }
                /* Updated Legend Style */
                .custom-fieldset legend { font-size: 0.9rem; font-weight: 600; width: auto; float: none; margin-bottom: 0; }
                .custom-fieldset legend.clickable-legend:hover { filter: brightness(95%); }
            `}</style>

            {/* --- EDITOR TOOLBAR --- */}
            <div className="editor-toolbar pt-3 px-2">
                <div className="bg-white p-2 rounded-3 shadow-sm d-flex justify-content-between align-items-center border">
                    <div>
                        <h6 className="mb-1 fw-bold" style={{ color: '#212529', fontSize: '14px' }}>
                            {initialData ? "Edit Form Template" : "Create New Template"}
                        </h6>
                        <small className="text-muted" style={{ fontSize: '14px' }}>
                            Drag or double-click fields to add
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-dark  px-1 rounded-3" onClick={() => setShowPreview(true)}>
                            <i className="bi bi-eye me-1" ></i>Preview Form
                        </button>
                        <div className="vr mx-1"></div>
                        <button className="btn btn-sm btn-light border rounded-3 px-3" onClick={onCancel || (() => alert("Cancelled"))}>
                            <i className="bi bi-x-circle me-1"></i>Cancel
                        </button>
                        <button className="btn btn-sm btn-primary rounded-3 px-2" onClick={handleSaveClick}>
                            <i className="bi bi-check-circle me-1"></i>Save Form
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="container-fluid pb-5 px-2 mt-2">

                {/* --- SECTION 1: TITLE & DESCRIPTION --- */}
                <fieldset className="custom-fieldset shadow-sm mb-4">
                    <legend className="px-2 text-muted d-flex align-items-center">
                        <i className="bi bi-info-circle me-2 text-primary" style={{ fontSize: '16px' }}></i>
                        <span style={{ fontSize: '15px', fontWeight: '650' }}>Basic Information</span>
                    </legend>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold mb-1" style={{ fontSize: '13px', color: '#6c757d' }}>Form Title</label>
                            <input
                                className={`form-control ${getHighlightStyle(title)}`}
                                placeholder="Enter Form Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold mb-1" style={{ fontSize: '13px', color: '#6c757d' }}>Description</label>
                            <input
                                className={`form-control ${getHighlightStyle(description)}`}
                                placeholder="Enter Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>
                    </div>
                </fieldset>

                {/* --- SECTION 2: REPORT CONFIGURATION (UPDATED) --- */}
                <fieldset className="custom-fieldset shadow-sm mb-2 border-primary border-opacity-50">
                    <legend
                        className="d-flex justify-content-between align-items-center w-100 clickable-legend alert alert-primary border-primary shadow-sm py-2 px-3"
                        onClick={() => setShowReportConfig(!showReportConfig)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title={showReportConfig ? "Click to Collapse" : "Click to Expand"}
                    >
                        <span className="fw-bold text-black"><i className="bi bi-layout-text-window-reverse me-2"></i>Manage Header & Footer Details</span>
                        <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '28px', height: '28px' }}>
                            <i className={`bi ${showReportConfig ? 'bi-chevron-up' : 'bi-chevron-down'} fw-bold`} style={{ fontSize: '14px' }}></i>
                        </div>
                    </legend>

                    {showReportConfig && (
                        <div className="mt-2 px-1">
                            {/* Header Section */}
                            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                                <h6 className="fw-bold small text-uppercase text-muted mb-0" style={{ fontSize: '13px' }}>Header Details</h6>
                                <button
                                    className="btn btn-xs btn-primary py-0 px-2 rounded-2 d-flex align-items-center"
                                    style={{ fontSize: '10px' }}
                                    onClick={() => addDetailField('headers')}
                                >
                                    <i className="bi bi-plus me-1 d-flex align-items-center"></i>
                                    Add
                                </button>
                            </div>

                            <div className="mb-3">
                                {projectDetails.headers && projectDetails.headers.map((item) => (
                                    <div className="row g-2 mb-2 align-items-start" key={item.id}>
                                        <div className="col-5">
                                            <input
                                                className={`form-control form-control-sm ${detailErrors[`headers_${item.id}_label`] ? 'is-invalid' : ''} ${getHighlightStyle(item.label)}`}
                                                placeholder="Label (e.g. Station)"
                                                value={item.label}
                                                onChange={e => updateDetailField('headers', item.id, 'label', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <input
                                                className={`form-control form-control-sm ${detailErrors[`headers_${item.id}_value`] ? 'is-invalid' : ''} ${getHighlightStyle(item.value)}`}
                                                placeholder="Value"
                                                value={item.value}
                                                onChange={e => updateDetailField('headers', item.id, 'value', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-1 text-end">
                                            <button className="btn btn-sm btn-outline-danger border-0 py-0" onClick={() => requestDeleteDetail('headers', item.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!projectDetails.headers || projectDetails.headers.length === 0) && <p className="text-muted small fst-italic text-center">No header fields.</p>}
                            </div>

                            {/* Footer Section */}
                            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1 mt-3">
                                <h6 className="fw-bold small text-uppercase text-muted mb-0" style={{ fontSize: '13px' }}>Footer Details</h6>
                                <button
                                    className="btn btn-xs btn-primary py-0 px-2 rounded-2 d-flex align-items-center"
                                    style={{ fontSize: '10px' }}
                                    onClick={() => addDetailField('headers')}
                                >
                                    <i className="bi bi-plus me-1 d-flex align-items-center"></i>
                                    Add
                                </button>
                            </div>

                            <div>
                                {projectDetails.footers && projectDetails.footers.map((item) => (
                                    <div className="card border-0 shadow-sm mb-2 p-2 bg-light" key={item.id}>
                                        <div className="row g-2 align-items-center">

                                            {/* 1. Type Selector (First) */}
                                            <div className="col-md-4">
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={item.type || "text"}
                                                    onChange={e => updateDetailField('footers', item.id, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="image">Signature/Image</option>
                                                </select>
                                            </div>

                                            {/* 2. Value Input (Conditional: Text or Image Upload) */}
                                            <div className="col-md-7">
                                                {item.type === 'image' ? (
                                                    <div className="d-flex align-items-start gap-2">
                                                        <div className="flex-grow-1">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className={`form-control form-control-sm ${detailErrors[`footers_${item.id}_value`] ? 'is-invalid' : ''} ${getHighlightStyle(item.value)}`}
                                                                onChange={(e) => handleFooterImageUpload('footers', item.id, e.target.files[0])}
                                                            />
                                                            {detailErrors[`footers_${item.id}_value`] && (
                                                                <div className="invalid-feedback d-block text-start">
                                                                    <i className="bi bi-exclamation-circle me-1"></i>
                                                                    {detailErrors[`footers_${item.id}_value`]}
                                                                </div>
                                                            )}
                                                            <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>Upload signature</small>
                                                        </div>
                                                        {item.value && (
                                                            <div className="border rounded bg-white p-1 text-center" style={{ minWidth: '50px' }}>
                                                                <img src={item.value} alt="Preview" style={{ height: '30px', maxWidth: '50px', objectFit: 'contain' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input
                                                        className={`form-control form-control-sm ${detailErrors[`footers_${item.id}_value`] ? 'is-invalid' : ''} ${getHighlightStyle(item.value)}`}
                                                        placeholder="Enter footer text (e.g. Approved By)"
                                                        value={item.value}
                                                        onChange={e => updateDetailField('footers', item.id, 'value', e.target.value)}
                                                    />
                                                )}
                                            </div>

                                            {/* 3. Delete Button */}
                                            <div className="col-md-1 text-end">
                                                <button className="btn btn-sm btn-outline-danger border-0 py-0" onClick={() => requestDeleteDetail('footers', item.id)}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                                {(!projectDetails.footers || projectDetails.footers.length === 0) && <p className="text-muted small fst-italic text-center">No footer fields.</p>}
                            </div>
                        </div>
                    )}
                </fieldset>

                <div className="row g-2 mt-2">
                    <div className="col-md-3">
                        <div className="field-types-container">
                            <div className="d-flex align-items-center p-3 border-bottom mb-2 bg-light">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"><i className="bi bi-plus-circle text-primary"></i></div>
                                <h6 className="fw-bold mb-0" style={{ fontSize: '14px', color: '#212529' }}>Choose Elements From Here</h6>
                            </div>
                            <div className="field-sidebar">
                                {FIELD_TYPES.map((fieldType) => (
                                    <div key={fieldType.type} className="field-type-item" draggable onDragStart={(e) => handleDragStart(e, fieldType)} onDoubleClick={() => handleDoubleClick(fieldType)} title="Drag or double-click to add">
                                        <i className={`bi ${fieldType.icon}`}></i><span>{fieldType.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-md-5">
                        <div className={`canvas-area ${draggedItem ? "drag-over" : ""}`} onDragOver={handleDragOver} onDrop={handleDrop}>
                            {fields.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                                    <p style={{ fontSize: '14px' }}>Drag and drop fields here</p>
                                </div>
                            ) : (
                                fields.map((field, index) => (
                                    <div
                                        key={field.key}
                                        draggable
                                        onDragStart={(e) => handleSortStart(e, index)}
                                        onDragOver={handleSortOver}
                                        onDrop={(e) => handleSortDrop(e, index)}
                                        className={`field-card ${editingField?.key === field.key ? "active" : ""}`}
                                        onClick={() => setEditingField(field)}
                                        style={{ opacity: draggedFieldIndex === index ? 0.5 : 1, cursor: 'move' }}
                                    >
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <label className="form-label fw-bold mb-0" style={{ fontSize: '14px' }}>{field.label}{field.validate?.required && <span className="text-danger ms-1">*</span>}</label>
                                            <div className="btn-group btn-group-sm">
                                                <button className="btn btn-outline-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleMoveField(index, -1); }} disabled={index === 0}><i className="bi bi-arrow-up"></i></button>
                                                <button className="btn btn-outline-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleMoveField(index, 1); }} disabled={index === fields.length - 1}><i className="bi bi-arrow-down"></i></button>
                                                {/* UPDATED: Delete Button now calls requestDeleteDetail with 'field' section */}
                                                <button className="btn btn-outline-danger btn-sm" onClick={(e) => { e.stopPropagation(); requestDeleteDetail('field', field.key); }}><i className="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                        {renderCardPreview(field)}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="col-md-4">
                        {editingField ? (
                            <div className="settings-panel">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"><i className="bi bi-gear text-primary"></i></div>
                                    <h6 className="fw-bold mb-0" style={{ fontSize: '14px', color: '#212529' }}>Field Settings</h6>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small fw-bold mb-1" style={{ fontSize: '14px' }}>Label</label>
                                    <input className="form-control form-control-sm" value={editingField.label} onChange={(e) => handleFieldUpdate({ ...editingField, label: e.target.value })} style={{ fontSize: '14px' }} />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small fw-bold mb-1" style={{ fontSize: '14px' }}>Placeholder</label>
                                    <input className="form-control form-control-sm" value={editingField.placeholder || ""} onChange={(e) => handleFieldUpdate({ ...editingField, placeholder: e.target.value })} style={{ fontSize: '14px' }} />
                                </div>
                                <div className="mb-2">
                                    <div className="form-check">
                                        <input type="checkbox" className="form-check-input" checked={editingField.validate?.required || false} onChange={(e) => handleFieldUpdate({ ...editingField, validate: { ...editingField.validate, required: e.target.checked, }, })} />
                                        <label className="form-check-label small" style={{ fontSize: '14px' }}>Required field</label>
                                    </div>
                                </div>

                                {(editingField.type === "select" || editingField.type === "radio" || editingField.type === "checkbox") && (
                                    <div className="mb-2 border-top pt-2">
                                        <label className="form-label small fw-bold mb-1" style={{ fontSize: '14px' }}>Options</label>
                                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '8px' }}>
                                            {getFieldOptions(editingField).map((opt, i) => (
                                                <div key={i} className="input-group input-group-sm mb-1">
                                                    <input
                                                        className="form-control"
                                                        value={opt.label || opt}
                                                        onChange={(e) => {
                                                            const options = getFieldOptions(editingField);
                                                            const newOptions = options.map((o, idx) => idx === i ? { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') } : o);
                                                            handleFieldUpdate(updateFieldOptions(editingField, newOptions));
                                                        }}
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                    <div className="input-group-text bg-white">
                                                        <input
                                                            className="form-check-input mt-0"
                                                            type={editingField.type === "checkbox" ? "checkbox" : "radio"}
                                                            name={editingField.type === "checkbox" ? undefined : "defaultOptionSelector"}
                                                            title="Set as default"
                                                            checked={
                                                                editingField.type === "checkbox"
                                                                    ? editingField.defaultValue?.includes(opt.value)
                                                                    : editingField.defaultValue === opt.value
                                                            }
                                                            onChange={() => {
                                                                if (editingField.type === "checkbox") {
                                                                    const currentDefaults = editingField.defaultValue || [];
                                                                    let newDefaults;
                                                                    if (currentDefaults.includes(opt.value)) {
                                                                        newDefaults = currentDefaults.filter(v => v !== opt.value);
                                                                    } else {
                                                                        newDefaults = [...currentDefaults, opt.value];
                                                                    }
                                                                    handleFieldUpdate({ ...editingField, defaultValue: newDefaults });
                                                                } else {
                                                                    if (editingField.defaultValue === opt.value) {
                                                                        handleFieldUpdate({ ...editingField, defaultValue: "" });
                                                                    } else {
                                                                        handleFieldUpdate({ ...editingField, defaultValue: opt.value });
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <button className="btn btn-outline-danger" onClick={() => {
                                                        const options = getFieldOptions(editingField);
                                                        const newOptions = options.filter((_, idx) => idx !== i);
                                                        handleFieldUpdate(updateFieldOptions(editingField, newOptions));
                                                    }}>
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn btn-outline-primary btn-sm w-100 mb-3" onClick={() => {
                                            const options = getFieldOptions(editingField);
                                            const newOption = { label: "New Option", value: `option_${Date.now()}` };
                                            handleFieldUpdate(updateFieldOptions(editingField, [...options, newOption]));
                                        }} style={{ fontSize: '14px' }}>
                                            <i className="bi bi-plus me-1"></i>Add Option
                                        </button>
                                    </div>
                                )}
                                <button className="btn btn-outline-secondary btn-sm w-100 mt-2" onClick={() => setEditingField(null)} style={{ fontSize: '14px' }}>Close Settings</button>
                            </div>
                        ) : (
                            <div className="settings-panel text-center text-muted py-3">
                                <i className="bi bi-hand-index fs-4 d-block mb-2"></i><p className="mb-0" style={{ fontSize: '14px' }}>Click on a field to edit its settings</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-sm border-0 rounded-4">
                            <div className="modal-body text-center p-4">
                                <i className="bi bi-trash text-danger fs-1 mb-2"></i>
                                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '16px' }}>Delete Item?</h6>
                                <p className="text-muted small mb-4" style={{ fontSize: '14px' }}>Are you sure you want to delete this item? This action cannot be undone.</p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={cancelDeleteDetail} style={{ fontSize: '14px' }}>Cancel</button>
                                    <button className="btn btn-danger btn-sm rounded-pill px-3" onClick={confirmDeleteDetail} style={{ fontSize: '14px' }}>Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-sm border-0 rounded-4">
                            <div className="modal-body text-center p-4">
                                <i className="bi bi-exclamation-circle text-warning fs-1 mb-2"></i>
                                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '16px' }}>Attention</h6>
                                <p className="text-muted small mb-4" style={{ fontSize: '14px' }}>{errorMessage}</p>
                                <button className="btn btn-primary btn-sm w-100 rounded-pill" onClick={() => setShowErrorModal(false)} style={{ fontSize: '14px' }}>Okay, Got it</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPreview && (
                <FormPreview
                    formData={{
                        title,
                        description,
                        projectDetails,
                        schema: { components: fields }
                    }}
                    onSubmit={() => console.log("Form Submitted in Preview")}
                    onClose={() => setShowPreview(false)}
                    readOnly={false}
                />
            )}
        </div>
    );
};

export default FormBuilder;