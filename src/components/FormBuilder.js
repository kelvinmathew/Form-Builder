import React, { useState } from "react";

const FIELD_TYPES = [
    { type: "textfield", label: "Text Input", icon: "bi-input-cursor-text" },
    { type: "number", label: "Number", icon: "bi-123" },
    { type: "email", label: "Email", icon: "bi-envelope" },
    { type: "textarea", label: "Text Area", icon: "bi-text-paragraph" },
    { type: "select", label: "Dropdown", icon: "bi-menu-button-wide" },
    { type: "checkbox", label: "Checkbox", icon: "bi-check-square" },
    { type: "radio", label: "Radio Buttons", icon: "bi-ui-radios" },
    { type: "datetime", label: "Date", icon: "bi-calendar" },
    { type: "time", label: "Time", icon: "bi-clock" },
    { type: "file", label: "File Upload", icon: "bi-upload" },
];

const FormBuilder = ({ initialData, onSave, onCancel }) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [fields, setFields] = useState(initialData?.schema?.components || []);
    const [editingField, setEditingField] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);

    const generateKey = (label) => {
        return label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') + '_' + Date.now();
    };

    // Function to add a new field (used by both drag-drop and double-click)
    const addNewField = (fieldType) => {
        const key = generateKey(fieldType.label);
        const newField = {
            type: fieldType.type,
            key: key,
            label: fieldType.label,
            placeholder: "",
            input: true,
            validate: {
                required: false,
            },
            ...(fieldType.type === "select" && {
                data: {
                    values: [
                        { label: "Option 1", value: "option1" },
                        { label: "Option 2", value: "option2" },
                    ],
                },
            }),
            ...(fieldType.type === "radio" && {
                values: [
                    { label: "Option 1", value: "option1" },
                    { label: "Option 2", value: "option2" },
                ],
            }),
        };
        setFields([...fields, newField]);
        setEditingField(newField);
    };

    const handleDragStart = (e, fieldType) => {
        setDraggedItem(fieldType);
        e.dataTransfer.effectAllowed = "copy";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (draggedItem) {
            addNewField(draggedItem);
        }
        setDraggedItem(null);
    };

    // Double-click handler to add field
    const handleDoubleClick = (fieldType) => {
        addNewField(fieldType);
    };

    const handleFieldUpdate = (updatedField) => {
        setFields(fields.map((f) => (f.key === updatedField.key ? updatedField : f)));
        setEditingField(updatedField);
    };

    const handleDeleteField = (fieldKey) => {
        setFields(fields.filter((f) => f.key !== fieldKey));
        if (editingField?.key === fieldKey) {
            setEditingField(null);
        }
    };

    const handleMoveField = (index, direction) => {
        const newFields = [...fields];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < fields.length) {
            [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
            setFields(newFields);
        }
    };

    const handleSaveClick = () => {
        if (!title.trim()) return alert("Please enter a form title");
        onSave({
            title,
            description,
            schema: {
                display: "form",
                components: fields,
            },
        });
    };

    const getFieldOptions = (field) => {
        if (field.type === "select") {
            return field.data?.values || [];
        }
        if (field.type === "radio") {
            return field.values || [];
        }
        return [];
    };

    const updateFieldOptions = (field, newOptions) => {
        if (field.type === "select") {
            return { ...field, data: { values: newOptions } };
        }
        if (field.type === "radio") {
            return { ...field, values: newOptions };
        }
        return field;
    };

    const renderFieldPreview = (field) => {
        const options = getFieldOptions(field);
        
        switch (field.type) {
            case "textarea":
                return <textarea className="form-control" placeholder={field.placeholder} disabled />;
            case "select":
                return (
                    <select className="form-select" disabled>
                        <option>{field.placeholder || "Select..."}</option>
                        {options.map((opt, i) => (
                            <option key={i}>{opt.label || opt}</option>
                        ))}
                    </select>
                );
            case "checkbox":
                return (
                    <div className="form-check">
                        <input type="checkbox" className="form-check-input" disabled />
                        <label className="form-check-label">{field.placeholder || "Checkbox"}</label>
                    </div>
                );
            case "radio":
                return (
                    <div>
                        {options.map((opt, i) => (
                            <div key={i} className="form-check">
                                <input type="radio" className="form-check-input" disabled />
                                <label className="form-check-label">{opt.label || opt}</label>
                            </div>
                        ))}
                    </div>
                );
            case "datetime":
                return <input type="date" className="form-control" disabled />;
            case "time":
                return <input type="time" className="form-control" disabled />;
            case "file":
                return <input type="file" className="form-control" disabled />;
            case "number":
                return <input type="number" className="form-control" placeholder={field.placeholder} disabled />;
            case "email":
                return <input type="email" className="form-control" placeholder={field.placeholder} disabled />;
            default:
                return (
                    <input
                        type="text"
                        className="form-control"
                        placeholder={field.placeholder}
                        disabled
                    />
                );
        }
    };

    return (
        <div className="d-flex flex-column h-100 pb-5">
            <style>{`
                .field-type-item {
                    padding: 10px 12px;
                    margin-bottom: 8px;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    cursor: grab;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    user-select: none;
                }
                .field-type-item:hover {
                    background: #e9ecef;
                    border-color: #0d6efd;
                }
                .field-type-item:active {
                    cursor: grabbing;
                }
                .canvas-area {
                    min-height: 400px;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    padding: 16px;
                    background: #fafbfc;
                    transition: all 0.2s ease;
                }
                .canvas-area.drag-over {
                    border-color: #0d6efd;
                    background: #f0f7ff;
                }
                .field-card {
                    background: #fff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .field-card:hover {
                    border-color: #0d6efd;
                    box-shadow: 0 2px 8px rgba(13, 110, 253, 0.1);
                }
                .field-card.active {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
                }
                .settings-panel {
                    background: #fff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 16px;
                    position: sticky;
                    top: 80px;
                }
            `}</style>

            {/* Header */}
            <div
                className="bg-white p-3 rounded shadow-sm mb-3 d-flex justify-content-between align-items-center sticky-top"
                style={{ zIndex: 1020, top: 0 }}
            >
                <div>
                    <h5 className="mb-0 fw-bold">
                        {initialData ? "Edit Form Template" : "Create New Template"}
                    </h5>
                    <small className="text-muted">Drag or double-click fields to add</small>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-light border" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveClick}>
                        Save Form
                    </button>
                </div>
            </div>

            {/* Metadata */}
            <div className="bg-white p-3 rounded shadow-sm mb-3">
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Form Title</label>
                        <input
                            className="form-control"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Concrete Pouring Log"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Description</label>
                        <input
                            className="form-control"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description..."
                        />
                    </div>
                </div>
            </div>

            {/* Builder Area */}
            <div className="row g-3 flex-grow-1">
                {/* Left Sidebar - Field Types */}
                <div className="col-md-3">
                    <div className="bg-white rounded shadow-sm p-3 sticky-top" style={{ top: 80 }}>
                        <h6 className="fw-bold mb-3">
                            <i className="bi bi-plus-circle me-2"></i>Add Fields
                        </h6>
                        <small className="text-muted d-block mb-3" style={{ fontSize: "0.75rem" }}>
                            Drag or double-click to add
                        </small>
                        {FIELD_TYPES.map((fieldType) => (
                            <div
                                key={fieldType.type}
                                className="field-type-item"
                                draggable
                                onDragStart={(e) => handleDragStart(e, fieldType)}
                                onDoubleClick={() => handleDoubleClick(fieldType)}
                                title="Drag or double-click to add"
                            >
                                <i className={`bi ${fieldType.icon}`}></i>
                                <span>{fieldType.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center - Canvas */}
                <div className="col-md-5">
                    <div
                        className={`canvas-area ${draggedItem ? "drag-over" : ""}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {fields.length === 0 ? (
                            <div className="text-center text-muted py-5">
                                <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                                <p>Drag and drop fields here</p>
                                <small>or double-click on a field type</small>
                            </div>
                        ) : (
                            fields.map((field, index) => (
                                <div
                                    key={field.key}
                                    className={`field-card ${editingField?.key === field.key ? "active" : ""}`}
                                    onClick={() => setEditingField(field)}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <label className="form-label fw-bold mb-0">
                                            {field.label}
                                            {field.validate?.required && <span className="text-danger ms-1">*</span>}
                                        </label>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMoveField(index, -1);
                                                }}
                                                disabled={index === 0}
                                            >
                                                <i className="bi bi-arrow-up"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMoveField(index, 1);
                                                }}
                                                disabled={index === fields.length - 1}
                                            >
                                                <i className="bi bi-arrow-down"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteField(field.key);
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    {renderFieldPreview(field)}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Settings */}
                <div className="col-md-4">
                    {editingField ? (
                        <div className="settings-panel">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-gear me-2"></i>Field Settings
                            </h6>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Label</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={editingField.label}
                                    onChange={(e) =>
                                        handleFieldUpdate({ ...editingField, label: e.target.value })
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold">Placeholder</label>
                                <input
                                    className="form-control form-control-sm"
                                    value={editingField.placeholder || ""}
                                    onChange={(e) =>
                                        handleFieldUpdate({ ...editingField, placeholder: e.target.value })
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={editingField.validate?.required || false}
                                        onChange={(e) =>
                                            handleFieldUpdate({
                                                ...editingField,
                                                validate: {
                                                    ...editingField.validate,
                                                    required: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                    <label className="form-check-label small">Required field</label>
                                </div>
                            </div>

                            {(editingField.type === "select" || editingField.type === "radio") && (
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Options</label>
                                    {getFieldOptions(editingField).map((opt, i) => (
                                        <div key={i} className="input-group input-group-sm mb-2">
                                            <input
                                                className="form-control"
                                                value={opt.label || opt}
                                                onChange={(e) => {
                                                    const options = getFieldOptions(editingField);
                                                    const newOptions = options.map((o, idx) =>
                                                        idx === i
                                                            ? { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                                                            : o
                                                    );
                                                    handleFieldUpdate(updateFieldOptions(editingField, newOptions));
                                                }}
                                            />
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => {
                                                    const options = getFieldOptions(editingField);
                                                    const newOptions = options.filter((_, idx) => idx !== i);
                                                    handleFieldUpdate(updateFieldOptions(editingField, newOptions));
                                                }}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        className="btn btn-outline-primary btn-sm w-100"
                                        onClick={() => {
                                            const options = getFieldOptions(editingField);
                                            const newOption = { label: "New Option", value: `option_${Date.now()}` };
                                            handleFieldUpdate(updateFieldOptions(editingField, [...options, newOption]));
                                        }}
                                    >
                                        <i className="bi bi-plus me-1"></i>Add Option
                                    </button>
                                </div>
                            )}

                            <button
                                className="btn btn-outline-secondary btn-sm w-100 mt-3"
                                onClick={() => setEditingField(null)}
                            >
                                Close Settings
                            </button>
                        </div>
                    ) : (
                        <div className="settings-panel text-center text-muted py-4">
                            <i className="bi bi-hand-index fs-3 d-block mb-2"></i>
                            <p className="mb-0 small">Click on a field to edit its settings</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormBuilder;