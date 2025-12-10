import React, { useState, useRef, useEffect } from 'react';

const FORMULA_TYPES = [
    { value: 'SUM', label: 'Sum - Add numbers' },
    { value: 'AVERAGE', label: 'Average - Calculate average' },
    { value: 'CONCATENATE', label: 'Concatenate - Join with space' },
    { value: 'MERGE', label: 'Merge - Join with comma' },
    { value: 'COUNT', label: 'Count - Count non-empty values' },
];

const AddCalculatedColumnModal = ({ show, onClose, onSave, existingColumns }) => {
    const [colName, setColName] = useState("");
    const [formulaType, setFormulaType] = useState("SUM");
    
    // Multi-Select Dropdown States
    const [selectedCols, setSelectedCols] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    // --- ERROR MODAL STATE ---
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!show) {
            setColName("");
            setFormulaType("SUM");
            setSelectedCols([]);
            setSearchTerm("");
            setIsDropdownOpen(false);
            setShowError(false);
        }
    }, [show]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) && 
                !event.target.closest('.btn-add-column-action') 
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!show) return null;

    // Filter columns based on search term inside the dropdown
    const filteredColumns = existingColumns.filter(col => 
        col.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectColumn = (key) => {
        if (!selectedCols.includes(key)) {
            setSelectedCols([...selectedCols, key]);
        }
        setSearchTerm(""); // Reset search after selection
    };

    const handleRemoveColumn = (key, e) => {
        e.stopPropagation(); 
        setSelectedCols(prev => prev.filter(k => k !== key));
    };

    const handleSave = () => {
        if (!colName.trim()) {
            setErrorMessage("Please enter a column name.");
            setShowError(true);
            return;
        }
        if (selectedCols.length === 0) {
            setErrorMessage("Please select at least one column to calculate.");
            setShowError(true);
            return;
        }

        const newColumnConfig = {
            label: colName,
            key: colName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
            type: 'calculated',
            formula: formulaType,
            targets: selectedCols 
        };

        onSave(newColumnConfig);
        onClose();
    };

    return (
        <>
            {/* --- MAIN MODAL --- */}
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                {/* Responsive Width: Added mx-3 for mobile margin */}
                <div className="modal-dialog modal-dialog-centered mx-3 mx-md-auto">
                    <div className="modal-content border-0 shadow-lg rounded-4" style={{ minHeight: '400px' }}>
                        <div className="modal-header border-bottom-3 pb-2">
                            <h5 className="modal-title fw-bold">Add Custom Column</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        
                        <div className="modal-body">
                            {/* 1. Column Name */}
                            <div className="mb-4">
                                <label className="fw-bold small mb-2">Column Name <span className="text-danger">*</span></label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g., Total Score"
                                    value={colName}
                                    onChange={(e) => setColName(e.target.value)}
                                    style={{ fontSize: '14px', padding: '10px' }}
                                />
                            </div>

                            {/* 2. Formula Type */}
                            <div className="mb-4">
                                <label className="fw-bold small mb-2">Formula Type <span className="text-danger">*</span></label>
                                <select 
                                    className="form-select"
                                    value={formulaType}
                                    onChange={(e) => setFormulaType(e.target.value)}
                                    style={{ fontSize: '14px', padding: '10px' }}
                                >
                                    {FORMULA_TYPES.map(ft => (
                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Select Columns (Multi-Select Dropdown) */}
                            <div className="mb-4" ref={dropdownRef}>
                                <label className="fw-bold small mb-2">Select Columns <span className="text-danger">*</span></label>
                                
                                <div 
                                    className="form-control d-flex flex-wrap align-items-center gap-2" 
                                    style={{ minHeight: '45px', cursor: 'pointer', backgroundColor: '#fff', padding: '8px' }}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {selectedCols.length === 0 && (
                                        <span className="text-muted small">Search columns...</span>
                                    )}

                                    {selectedCols.map(key => {
                                        const col = existingColumns.find(c => c.key === key);
                                        return (
                                            <span key={key} className="badge bg-success-subtle text-success border border-success-subtle rounded-pill d-flex align-items-center px-2 py-1" style={{fontSize: '12px'}}>
                                                <span className="text-truncate" style={{maxWidth: '100px'}}>{col ? col.label : key}</span>
                                                <i 
                                                    className="bi bi-x ms-1 cursor-pointer" 
                                                    style={{ fontSize: '1.1em' }}
                                                    onClick={(e) => handleRemoveColumn(key, e)}
                                                ></i>
                                            </span>
                                        );
                                    })}
                                    
                                    <i className={`bi bi-chevron-${isDropdownOpen ? 'up' : 'down'} ms-auto text-muted`}></i>
                                </div>

                                {isDropdownOpen && (
                                    <div className="card shadow-sm w-100 mt-1 overflow-hidden" style={{ maxHeight: '200px', zIndex: 1060 }}>
                                        <div className="p-2 border-bottom bg-light">
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm" 
                                                placeholder="Type to filter..."
                                                autoFocus
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()} 
                                            />
                                        </div>
                                        
                                        <div className="list-group list-group-flush overflow-auto" style={{maxHeight: '160px' }}>
                                            {filteredColumns.length > 0 ? (
                                                filteredColumns.map(col => {
                                                    const isSelected = selectedCols.includes(col.key);
                                                    return (
                                                        <button 
                                                            key={col.key} 
                                                            type="button"
                                                            className={`list-group-item list-group-item-action small d-flex justify-content-between align-items-center text-black ${isSelected ? 'bg-light' : ''}`}
                                                            onClick={() => isSelected ? handleRemoveColumn(col.key, { stopPropagation: () => {} }) : handleSelectColumn(col.key)}
                                                            style={{ fontSize: '14px', padding: '10px 15px' }}
                                                        >
                                                            <span>{col.label}</span>
                                                            {isSelected && <i className="bi bi-check-circle-fill text-success "></i>}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-3 text-center text-muted small">No columns found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer border-top-0 pt-0 pb-3">
                            <button className="btn btn-light rounded-pill" onClick={onClose}>Cancel</button>
                            <button className="btn btn-success text-white rounded-3 px-4 btn-add-column-action" onClick={handleSave}>
                                Add Column
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ERROR / ATTENTION MODAL --- */}
            {showError && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm mx-4 mx-md-auto">
                        <div className="modal-content shadow-sm border-0 rounded-4">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3 text-warning bg-warning-subtle rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-exclamation-circle text-warning fs-3"></i>
                                </div>
                                <h6 className="fw-bold mb-2 text-dark">Attention</h6>
                                <p className="text-muted small mb-4">{errorMessage}</p>
                                <button className=" btn btn-primary btn-sm rounded-6 px-3" onClick={() => setShowError(false)}>
                                    Okay, Got it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddCalculatedColumnModal;