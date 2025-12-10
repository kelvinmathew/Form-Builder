import React, { useState, useEffect, useMemo } from 'react';
import { flattenComponents } from '../utils/formHelpers';

const CustomFormRenderer = ({ schema, initialData, onFormReady }) => {
    // 1. MOVED UP: Flatten schema first so we can use it to calculate defaults
    const allComponents = useMemo(() => {
        return schema?.components ? flattenComponents(schema.components) : [];
    }, [schema]);

    // 2. UPDATED: Initialize state by merging Schema Defaults + Initial Data
    const [formData, setFormData] = useState(() => {
        const defaults = {};
        // Extract default values from schema
        allComponents.forEach(comp => {
            if (comp.defaultValue !== undefined && comp.defaultValue !== null && comp.defaultValue !== "") {
                defaults[comp.key] = comp.defaultValue;
            }
        });
        // Merge: InitialData takes priority over defaults (e.g. when editing)
        return { ...defaults, ...(initialData || {}) };
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Handle Form Submission / Data Retrieval requests from parent
    useEffect(() => {
        if (onFormReady) {
            onFormReady({
                submit: () => {
                    return new Promise((resolve, reject) => {
                        const validationErrors = {};

                        allComponents.forEach((comp) => {
                            if (comp.type === 'calculated') return; 
                            
                            const val = formData[comp.key];
                            // Check if the field is strictly empty
                            const isEmpty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);

                            // 1. REQUIRED CHECK
                            if (comp.validate?.required) {
                                if (isEmpty) {
                                    validationErrors[comp.key] = `${comp.label} is required`;
                                }
                            }

                            // 2. FORMAT VALIDATION (Only if value exists)
                            if (!isEmpty) {
                                // Email Validation
                                if (comp.type === 'email') {
                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                    if (!emailRegex.test(val)) {
                                        validationErrors[comp.key] = "Invalid email format (e.g., user@example.com)";
                                    }
                                }

                                // Number Validation
                                if (comp.type === 'number') {
                                    if (isNaN(Number(val))) {
                                        validationErrors[comp.key] = "Please enter a valid number";
                                    }
                                }
                            }
                        });

                        if (Object.keys(validationErrors).length > 0) {
                            setErrors(validationErrors);
                            // Mark all as touched to show errors visually
                            const allTouched = {};
                            allComponents.forEach(c => allTouched[c.key] = true);
                            setTouched(allTouched);
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

    // 3. UPDATED: Ensure defaults are re-applied if initialData changes (e.g., reset)
    useEffect(() => {
        const defaults = {};
        allComponents.forEach(comp => {
            if (comp.defaultValue !== undefined && comp.defaultValue !== null && comp.defaultValue !== "") {
                defaults[comp.key] = comp.defaultValue;
            }
        });
        setFormData({ ...defaults, ...(initialData || {}) });
    }, [initialData, allComponents]);

    // --- Handlers ---

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setTouched((prev) => ({ ...prev, [key]: true }));
        
        if (errors[key]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (key, optionValue, isChecked) => {
        setFormData((prev) => {
            const currentValues = Array.isArray(prev[key]) ? prev[key] : [];
            let newValues;
            if (isChecked) {
                newValues = [...currentValues, optionValue];
            } else {
                newValues = currentValues.filter((v) => v !== optionValue);
            }
            return { ...prev, [key]: newValues };
        });
        setTouched((prev) => ({ ...prev, [key]: true }));

        if (errors[key]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    // --- Render Logic ---

    const renderField = (component) => {
        const { key, label, type, placeholder, validate } = component;
        if (type === 'calculated') return null;

        const value = formData[key] !== undefined ? formData[key] : "";
        const error = errors[key];
        const isRequired = validate?.required;

        // Label UI - UPDATED to 14px
        const labelElement = (
            <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: '14px' }}>
                {label} {isRequired && <span className="text-danger">*</span>}
            </label>
        );

        // Error UI
        const errorElement = error && (
            <div className="text-danger mt-2 d-flex align-items-center animate-shake" style={{ fontSize: '13px' }}>
                <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
            </div>
        );

        // Standard Input Styling
        const baseInputClass = `form-control form-control-lg border-2 shadow-none transition-all`;
        const validationClass = error ? "border-danger bg-danger-subtle" : "border-light-subtle focus-ring";
        const inputClass = `${baseInputClass} ${validationClass}`;

        let inputElement = null;

        switch (type) {
            case 'select':
                inputElement = (
                    <div className="position-relative">
                        <select
                            className={`form-select form-select-lg border-2 shadow-none transition-all ${validationClass}`}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            onBlur={() => setTouched(p => ({...p, [key]: true}))}
                            // UPDATED: fontSize 14px
                            style={{ borderRadius: '12px', minHeight: '50px', fontSize: '14px' }}
                        >
                            <option value="">Select an option...</option>
                            {component.data?.values?.map((opt, i) => (
                                <option key={i} value={opt.value || opt.label}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
                break;

            case 'radio':
                inputElement = (
                    <div className={error ? "p-3 border border-danger border-2 rounded-4 bg-danger-subtle" : ""}>
                        <div className="d-flex flex-column gap-2">
                            {component.values?.map((opt, i) => {
                                const optVal = opt.value || opt.label;
                                const isSelected = value === optVal;
                                return (
                                    <label 
                                        key={i} 
                                        className={`option-card d-flex align-items-center p-3 border rounded-3 cursor-pointer w-100 ${isSelected ? 'border-primary bg-primary-subtle text-primary fw-bold shadow-sm' : 'border-light-subtle bg-white text-dark'}`}
                                        style={{ transition: 'all 0.2s' }}
                                    >
                                        <input
                                            className="form-check-input me-3 mt-0"
                                            type="radio"
                                            name={key}
                                            value={optVal}
                                            checked={isSelected}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                        />
                                        {/* UPDATED: fontSize 14px */}
                                        <span style={{ fontSize: '14px' }}>{opt.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
                break;

            case 'checkbox':
                inputElement = (
                    <div className={error ? "p-3 border border-danger border-2 rounded-4 bg-danger-subtle" : ""}>
                        <div className="d-flex flex-column gap-2">
                            {component.values?.map((opt, i) => {
                                const currentVals = Array.isArray(value) ? value : [];
                                const optVal = opt.value || opt.label;
                                const isChecked = currentVals.includes(optVal);
                                return (
                                    <label 
                                        key={i} 
                                        className={`option-card d-flex align-items-center p-3 border rounded-3 cursor-pointer w-100 ${isChecked ? 'border-success bg-success-subtle text-success fw-bold shadow-sm' : 'border-light-subtle bg-white text-dark'}`}
                                        style={{ transition: 'all 0.2s' }}
                                    >
                                        <input
                                            className="form-check-input me-3 mt-0"
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => handleCheckboxChange(key, optVal, e.target.checked)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                        />
                                        {/* UPDATED: fontSize 14px */}
                                        <span style={{ fontSize: '14px' }}>{opt.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {(!component.values || component.values.length === 0) && (
                            <div className="text-muted p-3 bg-light rounded-3 text-center fst-italic" style={{fontSize: '14px'}}>No options available</div>
                        )}
                    </div>
                );
                break;

            case 'textarea':
                inputElement = (
                    <textarea
                        className={inputClass}
                        placeholder={placeholder || "Type here..."}
                        rows="4"
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onBlur={() => setTouched(p => ({...p, [key]: true}))}
                        // UPDATED: fontSize 14px
                        style={{ borderRadius: '12px', resize: 'vertical', fontSize: '14px' }}
                    />
                );
                break;

            case 'file':
                inputElement = (
                    <div className={`file-upload-zone p-3 p-md-5 border-2 border-dashed rounded-4 text-center ${error ? 'border-danger bg-danger-subtle' : 'border-secondary-subtle bg-light-subtle'}`} style={{transition: 'all 0.2s'}}>
                         <div className="mb-3">
                            <i className="bi bi-cloud-arrow-up text-primary" style={{fontSize: '2.5rem'}}></i>
                         </div>
                         <h6 className="fw-bold mb-1" style={{fontSize: '14px'}}>Drag and drop or click to upload</h6>
                         <p className="text-muted mb-3" style={{fontSize: '13px'}}>Support for images, docs, pdf</p>
                         
                         <label className="btn btn-primary rounded-pill px-4 py-2 cursor-pointer shadow-sm" style={{fontSize: '14px'}}>
                             Browse Files
                             <input
                                type="file"
                                className="d-none"
                                onChange={(e) => handleChange(key, e.target.value)}
                            />
                         </label>
                         {value && (
                            <div className="mt-3 p-2 bg-white rounded border d-inline-flex align-items-center animate-up" style={{maxWidth: '100%', overflow: 'hidden'}}>
                                <i className="bi bi-file-earmark-check text-success me-2"></i>
                                <span className="fw-bold text-dark text-truncate" style={{fontSize: '13px', maxWidth: '150px'}}>{value.split('\\').pop()}</span>
                            </div>
                         )}
                    </div>
                );
                break;

            case 'datetime':
            case 'date':
                inputElement = (
                    <div className="input-group">
                        <span className="input-group-text bg-white border-light-subtle border-2 text-muted ps-3" style={{borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', borderRight: 'none'}}>
                            <i className="bi bi-calendar-event fs-5"></i>
                        </span>
                        <input
                            type="date"
                            className={inputClass}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            // UPDATED: fontSize 14px
                            style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', fontSize: '14px' }}
                        />
                    </div>
                );
                break;

            case 'time':
                inputElement = (
                    <div className="input-group">
                         <span className="input-group-text bg-white border-light-subtle border-2 text-muted ps-3" style={{borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', borderRight: 'none'}}>
                            <i className="bi bi-clock fs-5"></i>
                        </span>
                        <input
                            type="time"
                            className={inputClass}
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            // UPDATED: fontSize 14px
                            style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', fontSize: '14px' }}
                        />
                    </div>
                );
                break;

            default: // Text, Number, Email
                inputElement = (
                    <input
                        type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
                        className={inputClass}
                        placeholder={placeholder || "Enter value..."}
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onBlur={() => setTouched(p => ({...p, [key]: true}))}
                        // UPDATED: fontSize 14px
                        style={{ borderRadius: '12px', minHeight: '50px', fontSize: '14px' }}
                    />
                );
                break;
        }

        return (
            <div className="col-12 animate-up" key={key}>
                <div className="form-group-container mb-3">
                    {labelElement}
                    {inputElement}
                    {errorElement}
                </div>
            </div>
        );
    };

    return (
        <div className="custom-form-renderer px-1 pb-3">
            <style>{`
                .custom-form-renderer {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                .focus-ring:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                }
                .option-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    border-color: #94a3b8 !important;
                }
                .animate-up {
                    animation: fadeInUp 0.4s ease-out backwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .border-dashed { border-style: dashed !important; }
                .cursor-pointer { cursor: pointer; }
                ::placeholder { color: #94a3b8 !important; opacity: 1; font-size: 14px; }
            `}</style>
            
            <div className="row g-4">
                {allComponents.map(renderField)}
            </div>
        </div>
    );
};

export default CustomFormRenderer;