import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";

// --- HELPER: Recursively get all input components ---
const flattenComponents = (components, inputs = []) => {
    if (!components) return inputs;

    components.forEach((component) => {
        if (component.columns) {
            component.columns.forEach((col) => flattenComponents(col.components, inputs));
        } else if (component.components) {
            flattenComponents(component.components, inputs);
        }
        if (component.input && component.type !== "button" && component.key && component.type !== 'htmlelement') {
            inputs.push(component);
        }
    });

    return inputs;
};

// --- CUSTOM FORM RENDERER COMPONENT ---
const CustomFormRenderer = ({ schema, initialData, onFormReady }) => {
    const [formData, setFormData] = useState(initialData || {});
    const [errors, setErrors] = useState({});

    const allComponents = useMemo(() => {
        return schema?.components ? flattenComponents(schema.components) : [];
    }, [schema]);

    useEffect(() => {
        if (onFormReady) {
            onFormReady({
                submit: () => {
                    return new Promise((resolve, reject) => {
                        const validationErrors = {};

                        allComponents.forEach((comp) => {
                            if (comp.validate?.required && !formData[comp.key]) {
                                validationErrors[comp.key] = `${comp.label} is required`;
                            }
                        });

                        if (Object.keys(validationErrors).length > 0) {
                            setErrors(validationErrors);
                            reject(validationErrors);
                        } else {
                            setErrors({});
                            resolve({ data: formData });
                        }
                    });
                },
                getData: () => formData,
            });
        }
    }, [formData, allComponents, onFormReady]);

    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const renderField = (component) => {
        const { key, label, type, placeholder, validate, values, data } = component;
        const value = formData[key] !== undefined ? formData[key] : "";
        const error = errors[key];
        const isRequired = validate?.required;

        const labelElement = (
            <label className="form-label fw-medium mb-1">
                {label}
                {isRequired && <span className="text-danger ms-1">*</span>}
            </label>
        );

        const errorElement = error && (
            <div className="text-danger small mt-1">
                <i className="bi bi-exclamation-circle me-1"></i>
                {error}
            </div>
        );

        const inputClass = `form-control ${error ? "is-invalid" : ""}`;

        switch (type) {
            case "textfield":
            case "text":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="text"
                            className={inputClass}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );

            case "number":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="number"
                            className={inputClass}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );

            case "email":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="email"
                            className={inputClass}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );

            case "textarea":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <textarea
                            className={inputClass}
                            placeholder={placeholder}
                            rows={4}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );

            case "select":
                const selectOptions = data?.values || values || [];
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <select
                            className={`form-select ${error ? "is-invalid" : ""}`}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        >
                            <option value="">{placeholder || "Select..."}</option>
                            {selectOptions.map((opt, idx) => (
                                <option key={idx} value={opt.value || opt}>
                                    {opt.label || opt}
                                </option>
                            ))}
                        </select>
                        {errorElement}
                    </div>
                );

            case "checkbox":
                return (
                    <div className="mb-3" key={key}>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className={`form-check-input ${error ? "is-invalid" : ""}`}
                                checked={!!value}
                                onChange={(e) => handleChange(key, e.target.checked)}
                                id={key}
                            />
                            <label className="form-check-label" htmlFor={key}>
                                {label}
                                {isRequired && <span className="text-danger ms-1">*</span>}
                            </label>
                        </div>
                        {errorElement}
                    </div>
                );

            case "radio":
                const radioOptions = values || [];
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        {radioOptions.map((opt, idx) => (
                            <div className="form-check" key={idx}>
                                <input
                                    type="radio"
                                    className={`form-check-input ${error ? "is-invalid" : ""}`}
                                    name={key}
                                    value={opt.value || opt}
                                    checked={value === (opt.value || opt)}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    id={`${key}_${idx}`}
                                />
                                <label className="form-check-label" htmlFor={`${key}_${idx}`}>
                                    {opt.label || opt}
                                </label>
                            </div>
                        ))}
                        {errorElement}
                    </div>
                );

            case "datetime":
            case "date":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="date"
                            className={inputClass}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );

            case "time":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="time"
                            className={inputClass}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );

            case "file":
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="file"
                            className={inputClass}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    handleChange(key, file.name);
                                }
                            }}
                        />
                        {value && typeof value === 'string' && (
                            <small className="text-muted d-block mt-1">
                                Selected: {value}
                            </small>
                        )}
                        {errorElement}
                    </div>
                );

            default:
                return (
                    <div className="mb-3" key={key}>
                        {labelElement}
                        <input
                            type="text"
                            className={inputClass}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {errorElement}
                    </div>
                );
        }
    };

    return (
        <div className="custom-form-renderer">
            {allComponents.map((component) => renderField(component))}
        </div>
    );
};

// --- MAIN COMPONENT ---
const FormEntryManager = ({ form, entries, onSubmit, onUpdate, onDeleteRow, onBack }) => {
    const [mode, setMode] = useState("GROUPS");
    const [selectedDn, setSelectedDn] = useState(null);
    const [editingEntry, setEditingEntry] = useState(null);
    const formInstanceRef = useRef(null);
    const [formKey, setFormKey] = useState(0);
    const [columnOrder, setColumnOrder] = useState([]);
    const [draggedColumn, setDraggedColumn] = useState(null);

    const allComponents = useMemo(() => {
        return form?.schema?.components ? flattenComponents(form.schema.components) : [];
    }, [form]);

    const dnComponent = allComponents.find(c => ["delivery note", "dn no.", "dn no", "dn number"].includes(c.label?.trim().toLowerCase()));
    const dnKey = dnComponent ? dnComponent.key : "dnNumber";
    const dnLabel = dnComponent ? dnComponent.label : "DN No.";

    const remarksComponent = allComponents.find(c => c.label?.trim().toLowerCase() === "remarks");
    const remarksKey = remarksComponent ? remarksComponent.key : "remarks";

    useEffect(() => {
        if (allComponents.length > 0) {
            const schemaKeys = allComponents
                .filter(c => c.key !== dnKey && c.key !== remarksKey)
                .map(c => c.key);

            setColumnOrder(prevOrder => {
                const cleanedOrder = prevOrder.filter(key => schemaKeys.includes(key));
                const newKeys = schemaKeys.filter(key => !cleanedOrder.includes(key));
                return [...cleanedOrder, ...newKeys];
            });
        }
    }, [allComponents, dnKey, remarksKey]);

    const handleColumnDrop = (targetKey) => {
        if (!draggedColumn || draggedColumn === targetKey) return;
        const newOrder = [...columnOrder];
        const draggedIdx = newOrder.indexOf(draggedColumn);
        const targetIdx = newOrder.indexOf(targetKey);
        newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, draggedColumn);
        setColumnOrder(newOrder);
        setDraggedColumn(null);
    };

    const groupedData = useMemo(() => {
        if (!entries) return {};
        const groups = {};
        entries.forEach((entry) => {
            const dnValue = entry[dnKey] || "Unknown";
            if (!groups[dnValue]) groups[dnValue] = [];
            groups[dnValue].push(entry);
        });
        return groups;
    }, [entries, dnKey]);

    const dnKeys = Object.keys(groupedData);

    const handleNavigationBack = () => {
        if (mode === "GROUPS") {
            if (onBack) onBack();
        } else if (mode === "ADD_FORM" || mode === "EDIT_FORM") {
            selectedDn ? setMode("DN_ENTRIES") : setMode("GROUPS");
            setEditingEntry(null);
        } else if (mode === "DN_ENTRIES" || mode === "DN_TABLE") {
            setMode("GROUPS");
        } else {
            setMode("GROUPS");
        }
    };

    const handleStartAdd = () => {
        setEditingEntry(null);
        setFormKey(prev => prev + 1);
        setMode("ADD_FORM");
    };

    const handleDnClick = (dn) => {
        setSelectedDn(dn);
        setMode("DN_ENTRIES");
    };

    const handleEditClick = (entry) => {
        setEditingEntry({ ...entry });
        setFormKey(prev => prev + 1);
        setMode("EDIT_FORM");
    };

    const handleFormReady = useCallback((instance) => {
        formInstanceRef.current = instance;
    }, []);

    const handleCustomSubmit = (actionType) => {
        if (!formInstanceRef.current) return;

        formInstanceRef.current.submit().then((submission) => {
            const submittedDn = submission.data[dnKey];
            if (!submittedDn) return alert(`${dnLabel} is required!`);

            const timestamp = new Date().toISOString();

            if (mode === "EDIT_FORM" && editingEntry) {
                const updatedEntry = {
                    ...editingEntry,
                    ...submission.data,
                    updatedAt: timestamp
                };
                updatedEntry._rowId = editingEntry._rowId;

                if (onUpdate) {
                    onUpdate(updatedEntry);
                } else {
                    alert("Error: onUpdate prop is missing.");
                    return;
                }

                setSelectedDn(submittedDn);
                setEditingEntry(null);
                setMode("DN_ENTRIES");
            } else {
                const newEntry = {
                    ...submission.data,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    _rowId: Date.now().toString()
                };
                onSubmit(newEntry);

                if (actionType === 'SAVE_AND_CONTINUE') {
                    setFormKey(prev => prev + 1);
                    setSelectedDn(submittedDn);
                } else {
                    setSelectedDn(submittedDn);
                    setMode("DN_ENTRIES");
                }
            }
        }).catch((error) => console.log("Validation failed", error));
    };

    const getInitialFormData = () => {
        if (mode === "EDIT_FORM" && editingEntry) {
            return editingEntry;
        }
        if (selectedDn) {
            return { [dnKey]: selectedDn };
        }
        return {};
    };

    if (!form) return <div className="p-5 text-center text-muted">Loading configuration...</div>;

    const renderEntryList = (data) => {
        const previewKeys = columnOrder.slice(0, 4);
        return (
            <div className="d-flex flex-column gap-3">
                {data.map((row, idx) => (
                    <div
                        key={row._rowId || idx}
                        className="card border-0 shadow-sm w-100 cursor-pointer entry-card"
                        onClick={() => handleEditClick(row)}
                        style={{ borderRadius: "8px", transition: "transform 0.1s, box-shadow 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.005)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)"; }}
                    >
                        <div className="card-body p-3">
                            <div className="row align-items-center">
                                <div className="col-12 col-md-3 border-end-md mb-2 mb-md-0">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="badge bg-light text-primary border">Entry #{idx + 1}</span>
                                        <span className={`badge ${row.createdAt === row.updatedAt ? "bg-warning text-dark" : "bg-success"}`}>
                                            {row.createdAt === row.updatedAt ? "Pending" : "Completed"}
                                        </span>
                                    </div>
                                    <small className="text-muted d-block text-truncate">
                                        Updated: {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : 'New'}
                                    </small>
                                </div>
                                <div className="col-12 col-md-7 mb-2 mb-md-0">
                                    <div className="row g-2">
                                        {previewKeys.map(key => {
                                            const comp = allComponents.find(c => c.key === key);
                                            return (
                                                <div key={key} className="col-6 col-lg-3">
                                                    <small className="text-muted d-block" style={{ fontSize: "0.7rem" }}>{comp?.label}</small>
                                                    <span className="fw-medium text-dark text-truncate d-block" style={{ fontSize: "0.85rem" }}>
                                                        {row[key] ? row[key] : <span className="text-light-gray">-</span>}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="col-12 col-md-2 text-md-end text-start">
                                    <div className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium">
                                        Edit <i className="bi bi-arrow-right ms-1"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <div className="text-center p-5 text-muted">No entries yet.</div>}
            </div>
        );
    };

    const renderTable = (data, title, isReportMode = false) => {
        const themeColor = "#00B050";
        const getHeaderStyle = (isDragging = false) => ({
            backgroundColor: isReportMode ? themeColor : (isDragging ? "#e9ecef" : "#F9FAFB"),
            color: isReportMode ? "white" : "#545757",
            fontSize: "0.75rem",
            border: isReportMode ? "1px solid white" : "1px solid #dee2e6",
            cursor: isReportMode ? "default" : "move",
            userSelect: "none"
        });

        return (
            <div className={`bg-white ${!isReportMode ? "card border-0 shadow-sm rounded-4 overflow-hidden" : ""}`}>
                {isReportMode && (
                    <div className="mb-4">
                        <div className="text-center mb-4 pt-2">
                            <h4 className="fw-bold text-dark">Fresh Concrete - Site Sampling Report</h4>
                        </div>
                        <div className="text-white fw-bold py-1 px-3 mb-3" style={{ backgroundColor: themeColor }}>
                            Project Details
                        </div>
                        <div className="row mb-4 px-2" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                            <div className="col-md-8">
                                {["Station", "Customer", "Project", "Mix Code"].map(label => (
                                    <div className="row mb-2 align-items-end" key={label}>
                                        <div className="col-3 text-muted">{label}:</div>
                                        <div className="col-9 border-bottom" style={{ minHeight: "24px", borderColor: "#dee2e6" }}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="col-md-4">
                                {["Date", "Req. Slump"].map(label => (
                                    <div className="row mb-2 align-items-end" key={label}>
                                        <div className="col-4 text-muted">{label}:</div>
                                        <div className="col-8 border-bottom" style={{ minHeight: "24px", borderColor: "#dee2e6" }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <h6 className="fw-bold px-1 mb-2">{form.title}</h6>
                    </div>
                )}

                {!isReportMode && (
                    <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">{title}</h5>
                        <small className="text-muted text-end">
                            Drag headers to move columns.<br />Changes apply to "All Data".
                        </small>
                    </div>
                )}

                <div className={isReportMode ? "" : "table-responsive"}>
                    <table className={`table table-bordered align-middle mb-0 ${isReportMode ? "table-sm w-100" : ""}`}>
                        <thead>
                            <tr>
                                <th className="py-3 px-2 text-center" style={{ ...getHeaderStyle(), cursor: 'default' }}>{dnLabel}</th>
                                {columnOrder.map((key) => {
                                    const comp = allComponents.find(c => c.key === key);
                                    return (
                                        <th
                                            key={key}
                                            className="py-2 px-1 text-center"
                                            draggable={!isReportMode}
                                            onDragStart={() => setDraggedColumn(key)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => handleColumnDrop(key)}
                                            style={getHeaderStyle(draggedColumn === key)}
                                        >
                                            {comp?.label || key}
                                            {!isReportMode && <i className="bi bi-grip-vertical text-muted ms-1 opacity-50"></i>}
                                        </th>
                                    );
                                })}
                                <th className="py-2 px-1 text-center" style={{ ...getHeaderStyle(), cursor: 'default' }}>Remarks</th>
                                {!isReportMode && <th className="text-center" style={{ ...getHeaderStyle(), cursor: 'default', width: "80px" }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {data.map((row, idx) => (
                                <tr key={row._rowId || idx}>
                                    <td className="px-3 py-3 text-center small fw-bold">{row[dnKey]}</td>
                                    {columnOrder.map(key => (
                                        <td key={key} className="px-3 py-3 text-center small">
                                            {typeof row[key] === 'object' ? JSON.stringify(row[key]) : (row[key] || "-")}
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 text-center small">{row[remarksKey] || ""}</td>
                                    {!isReportMode && (
                                        <td className="text-center">
                                            <button className="btn btn-sm text-danger" onClick={() => onDeleteRow(row._rowId)}>
                                                <i className="bi bi-trash3-fill"></i>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isReportMode && (
                    <div className="mt-5 pt-4 pb-4 px-2">
                        <div className="d-inline-block">
                            <div className="border-top border-dark border-2" style={{ width: "200px" }}></div>
                            <small className="fw-bold">Signature</small>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-vh-100" style={{ backgroundColor: "#F3F4F6", fontFamily: "'Inter', sans-serif" }}>
            <div className="bg-white border-bottom sticky-top py-3 shadow-sm" style={{ zIndex: 100 }}>
                <div className="container px-4">
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <button onClick={handleNavigationBack} className="btn btn-light border" style={{ borderRadius: "10px" }}>
                                <i className="bi bi-arrow-left"></i>
                            </button>
                            <div>
                                <h5 className="fw-bold mb-0 text-dark">{form.title}</h5>
                                <small className="text-muted" style={{ fontSize: "0.85rem" }}>
                                    {mode === "GROUPS" && "Data Groups"}
                                    {mode === "DN_ENTRIES" && `Managing: ${selectedDn}`}
                                    {(mode === "ADD_FORM" || mode === "EDIT_FORM") && "Entry Form"}
                                    {mode === "PROJECT_SHEET" && "All Records"}
                                </small>
                            </div>
                        </div>
                        <div className="d-flex p-1 rounded-3 bg-light border">
                            <button
                                className={`btn btn-sm px-3 rounded-3 border-0 ${mode === "GROUPS" || mode.includes("DN") || mode.includes("FORM") ? "bg-white shadow-sm text-primary fw-bold" : "text-muted"}`}
                                onClick={() => setMode("GROUPS")}
                            >
                                <i className="bi bi-folder2 me-2"></i> Groups
                            </button>
                            <button
                                className={`btn btn-sm px-3 rounded-3 border-0 ${mode === "PROJECT_SHEET" ? "bg-white shadow-sm text-success fw-bold" : "text-muted"}`}
                                onClick={() => setMode("PROJECT_SHEET")}
                            >
                                <i className="bi bi-table me-2"></i> All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container px-4 py-4">
                {mode === "GROUPS" && (
                    <div className="animate-fade-in">
                        <div className="d-flex justify-content-between align-items-end mb-3">
                            <h6 className="fw-bold mb-0 text-muted">DN Groups</h6>
                            <button className="btn btn-primary btn-sm shadow-sm" onClick={handleStartAdd}>
                                <i className="bi bi-plus-lg me-1"></i> New Entry
                            </button>
                        </div>
                        <div className="row g-3">
                            {dnKeys.map((dn) => (
                                <div key={dn} className="col-12">
                                    <div className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 cursor-pointer" onClick={() => handleDnClick(dn)}>
                                        <div className="bg-light rounded p-3 text-primary"><i className="bi bi-folder-fill fs-3"></i></div>
                                        <div className="flex-grow-1">
                                            <h6 className="fw-bold mb-0">{dn}</h6>
                                            <small className="text-muted">{groupedData[dn].length} entries</small>
                                        </div>
                                        <i className="bi bi-chevron-right text-muted"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(mode === "DN_ENTRIES" || mode === "DN_TABLE") && (
                    <div className="animate-fade-in">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h4 className="fw-bold mb-1">{selectedDn}</h4>
                                <p className="text-muted small mb-0">
                                    {mode === "DN_ENTRIES" ? "Select an entry to complete data." : "View and manage column order."}
                                </p>
                            </div>
                            <div className="btn-group shadow-sm">
                                <button className={`btn btn-sm ${mode === "DN_ENTRIES" ? "btn-primary" : "btn-white border"}`} onClick={() => setMode("DN_ENTRIES")}>
                                    <i className="bi bi-list-ul me-1"></i> List
                                </button>
                                <button className={`btn btn-sm ${mode === "DN_TABLE" ? "btn-primary" : "btn-white border"}`} onClick={() => setMode("DN_TABLE")}>
                                    <i className="bi bi-table me-1"></i> Table
                                </button>
                            </div>
                        </div>
                        {mode === "DN_ENTRIES"
                            ? renderEntryList(groupedData[selectedDn] || [])
                            : renderTable(groupedData[selectedDn] || [], `${dnLabel}: ${selectedDn}`, false)
                        }
                    </div>
                )}

                {mode === "PROJECT_SHEET" && (
                    <div className="animate-fade-in bg-white p-4 shadow-sm" style={{ minHeight: "800px" }}>
                        {renderTable(entries, "Master Report", true)}
                    </div>
                )}

                {(mode === "ADD_FORM" || mode === "EDIT_FORM") && (
                    <div className="d-flex justify-content-center py-4">
                        <div className="card border-0 shadow-sm w-100" style={{ maxWidth: "800px", borderRadius: "16px" }}>
                            <div className="card-header bg-white border-bottom py-3 px-4">
                                <div className="d-flex align-items-center gap-3">
                                    <button onClick={() => selectedDn ? setMode("DN_ENTRIES") : setMode("GROUPS")} className="btn btn-light rounded-circle border"><i className="bi bi-x-lg"></i></button>
                                    <div>
                                        <small className="text-muted fw-bold text-uppercase">{mode === "EDIT_FORM" ? "Fill Balanced Data" : "New Entry"}</small>
                                        <h5 className="fw-bold mb-0">{form.title}</h5>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <CustomFormRenderer
                                    key={formKey}
                                    schema={form.schema}
                                    initialData={getInitialFormData()}
                                    onFormReady={handleFormReady}
                                />
                            </div>
                            <div className="card-footer bg-light py-3 px-4 border-top d-flex justify-content-end gap-2">
                                {mode === "ADD_FORM" && (
                                    <button className="btn btn-white border" onClick={() => handleCustomSubmit('SAVE_AND_CONTINUE')}>Save & Add Another</button>
                                )}
                                <button className="btn btn-primary" onClick={() => handleCustomSubmit('SAVE_AND_EXIT')}>
                                    {mode === "EDIT_FORM" ? "Update & Finish" : "Save & Exit"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormEntryManager;