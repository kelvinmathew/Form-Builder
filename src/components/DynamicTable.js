import React, { useState, useEffect } from 'react';
import { calculateCellValue } from '../utils/formHelpers';

const DynamicTable = ({ 
    data, 
    title, 
    formTitle, 
    isReportMode, 
    columnOrder, 
    allComponents, 
    customColumns, 
    projectDetails, 
    dnKey, 
    dnLabel,
    remarksKey,
    onAddColumn,
    onDeleteColumn,
    onColumnDrop, 
    onUpdateEntry,
    onDeleteRow,
    onExportExcel,
    onExportPDF,
    onLayoutChange // <--- NEW PROP to sync layout with parent
}) => {
    // --- State ---
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [editingCell, setEditingCell] = useState(null); 
    
    // Header Reordering State
    const [localHeaders, setLocalHeaders] = useState([]);
    const [draggedHeader, setDraggedHeader] = useState(null);

    // Footer Reordering State
    const [localFooters, setLocalFooters] = useState([]);
    const [draggedFooter, setDraggedFooter] = useState(null);

    // --- Modal State ---
    const [columnToDelete, setColumnToDelete] = useState(null);

    // --- Logic: Hide DN/Remarks Column if not in components ---
    const showDnColumn = allComponents.some(c => c.key === dnKey);
    const showRemarksColumn = allComponents.some(c => c.key === remarksKey);

    const themeColor = "#00B050"; 

    // --- Effects ---
    useEffect(() => {
        if (projectDetails?.headers && Array.isArray(projectDetails.headers)) {
            setLocalHeaders(projectDetails.headers);
        }
        if (projectDetails?.footers && Array.isArray(projectDetails.footers)) {
            setLocalFooters(projectDetails.footers);
        }
    }, [projectDetails]);

    // --- Header Handlers ---
    const handleHeaderDragStart = (e, index) => { setDraggedHeader(index); e.dataTransfer.effectAllowed = "move"; };
    const handleHeaderDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    const handleHeaderDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedHeader === null || draggedHeader === targetIndex) return;
        const newHeaders = [...localHeaders];
        const [movedItem] = newHeaders.splice(draggedHeader, 1);
        newHeaders.splice(targetIndex, 0, movedItem);
        
        setLocalHeaders(newHeaders);
        setDraggedHeader(null);

        // Notify Parent of layout change for PDF sync
        if (onLayoutChange) {
            onLayoutChange({ headers: newHeaders, footers: localFooters });
        }
    };

    // --- Footer Handlers ---
    const handleFooterDragStart = (e, index) => { setDraggedFooter(index); e.dataTransfer.effectAllowed = "move"; };
    const handleFooterDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    
    const handleFooterDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedFooter === null || draggedFooter === targetIndex) return;
        const newFooters = [...localFooters];
        const [movedItem] = newFooters.splice(draggedFooter, 1);
        newFooters.splice(targetIndex, 0, movedItem);
        
        setLocalFooters(newFooters);
        setDraggedFooter(null);

        // Notify Parent of layout change for PDF sync
        if (onLayoutChange) {
            onLayoutChange({ headers: localHeaders, footers: newFooters });
        }
    };

    const getHeaderStyle = (isDragging = false) => ({
        backgroundColor: isReportMode ? themeColor : (isDragging ? "#e9ecef" : "#F9FAFB"),
        color: isReportMode ? "white" : "#545757",
        fontSize: "0.8rem",
        border: isReportMode ? "1px solid white" : "1px solid #dee2e6",
        cursor: "move", 
        userSelect: "none",
        whiteSpace: "nowrap"
    });

    const handleCellSave = (rowId, key, newValue) => {
        if (onUpdateEntry) onUpdateEntry(rowId, key, newValue);
        setEditingCell(null);
    };

    const formatDate = (val) => {
        if (!val) return "";
        const date = new Date(val);
        if (isNaN(date.getTime())) return val; 
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDisplayValue = (val) => {
        if (val === undefined || val === null || val === "") return "-";
        if (Array.isArray(val)) {
            if (val.length === 0) return "-";
            return val.join(", ");
        }
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
    };

    const renderDetailLine = (label, value) => (
        <div className="row mb-2 align-items-end" key={label} style={{ pointerEvents: 'none' }}> 
            <div className="col-5 text-muted">{label}:</div>
            <div className="col-7 border-bottom position-relative" style={{ minHeight: "24px", borderColor: "#dee2e6" }}>
                {value && <span className="fw-bold text-dark position-absolute bottom-0 start-0 ps-2" style={{fontSize: '1rem'}}>{value}</span>}
            </div>
        </div>
    );

    const getColumnLabel = (key, comp) => {
        if (key === 'createdAt') return 'Created Date';
        if (key === 'createdBy') return 'Created By';
        return comp?.label || key;
    };

    const confirmDelete = () => {
        if (columnToDelete) {
            onDeleteColumn(columnToDelete);
            setColumnToDelete(null);
        }
    };

    return (
        <div className={`bg-white ${!isReportMode ? "card border-0 shadow-sm rounded-4 overflow-hidden" : ""}`} onClick={() => setColumnToDelete(null)}>
            
            {/* --- DELETE CONFIRMATION MODAL --- */}
            {columnToDelete && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <div className="modal-body text-center p-4">
                                <div className="mb-3 text-danger bg-danger-subtle rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                                    <i className="bi bi-trash3-fill fs-3"></i>
                                </div>
                                <h6 className="fw-bold mb-2">Delete Column?</h6>
                                <p className="text-muted small mb-4">Are you sure you want to remove this column? This action cannot be undone.</p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={(e) => { e.stopPropagation(); setColumnToDelete(null); }}>Cancel</button>
                                    <button type="button" className="btn btn-danger rounded-pill px-4 fw-bold" onClick={(e) => { e.stopPropagation(); confirmDelete(); }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REPORT MODE HEADER --- */}
            {isReportMode && (
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center pt-2 mb-4 px-3">
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-success text-white rounded-3" onClick={onExportExcel}><i className="bi bi-file-earmark-excel me-2 "></i>Export Excel</button>
                            <button className="btn btn-sm btn-danger text-white rounded-3" onClick={onExportPDF}><i className="bi bi-file-earmark-pdf me-2"></i>Export PDF</button>
                        </div>
                        <h4 className="fw-bold text-dark m-0 position-absolute start-50 translate-middle-x">{formTitle || "Report"}</h4>
                        <button className="btn btn-sm btn-outline-primary text-nowrap rounded-3" onClick={onAddColumn}><i className="bi bi-plus-circle me-1"></i> Add Column</button>
                    </div>
                    <div className="text-white fw-bold py-1 px-3 mb-3" style={{ backgroundColor: themeColor }}>Project Details</div>
                    <div className="row mb-4 px-2" style={{ fontSize: "1.0rem", fontWeight: "800" }}>
                        {localHeaders.map((item, index) => (
                            <div 
                                className="col-md-6 draggable-header-item" 
                                key={item.id}
                                draggable={true}
                                onDragStart={(e) => handleHeaderDragStart(e, index)}
                                onDragOver={(e) => handleHeaderDragOver(e, index)}
                                onDrop={(e) => handleHeaderDrop(e, index)}
                                style={{
                                    cursor: 'move',
                                    opacity: draggedHeader === index ? 0.4 : 1,
                                    transition: 'all 0.2s ease',
                                    border: draggedHeader === index ? '2px dashed #00B050' : '2px solid transparent',
                                    borderRadius: '4px'
                                }}
                                title="Drag to reorder"
                            >
                                {renderDetailLine(item.label, item.value)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TABLE HEADER --- */}
            {!isReportMode && (
                <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">{title}</h5>
                    <div>
                        <button className="btn btn-sm btn-outline-primary me-3" onClick={onAddColumn}><i className="bi bi-plus-circle me-1"></i> Add Column</button>
                        <small className="text-muted text-end d-inline-block">Drag headers to move columns.</small>
                    </div>
                </div>
            )}

            {/* --- TABLE BODY --- */}
            <div className={isReportMode ? "" : "table-responsive"}>
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                <div className="hide-scrollbar" style={{ overflowX: 'auto', width: '100%' }}>
                    <table className={`table table-bordered align-middle mb-0 ${isReportMode ? "table-sm w-100" : ""}`} style={{ minWidth: '100%' }}>
                        <thead>
                            <tr>
                                {/* CONDITIONAL DN HEADER */}
                                {showDnColumn && (
                                    <th className="py-3 px-2 text-center" style={{ ...getHeaderStyle(), cursor: 'default', minWidth: '63px' }}>{dnLabel}</th>
                                )}
                                
                                {columnOrder.map((key) => {
                                    const comp = allComponents.find(c => c.key === key);
                                    const isCustom = customColumns.find(c => c.key === key);
                                    return (
                                        <th
                                            key={key}
                                            className="py-2 px-1 text-center position-relative group-hover"
                                            draggable={true}
                                            onDragStart={() => setDraggedColumn(key)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => { onColumnDrop(draggedColumn, key); setDraggedColumn(null); }}
                                            style={{ ...getHeaderStyle(draggedColumn === key), minWidth: '100px' }}
                                        >
                                            <div className="d-flex align-items-center justify-content-center gap-1">
                                                <span>{getColumnLabel(key, comp)}</span>
                                                {/* Delete Icon for Custom Columns */}
                                                {isCustom && (
                                                    <div 
                                                        className="d-inline-flex align-items-center justify-content-center ms-1 text-danger bg-danger-subtle rounded-circle"
                                                        style={{width: '19px', height: '19px', cursor: 'pointer', transition: 'all 0.2s'}}
                                                        onClick={(e) => { e.stopPropagation(); setColumnToDelete(key); }} 
                                                        title="Delete Column"
                                                    >
                                                        <i className="bi bi-trash3" style={{fontSize: '0.73rem'}}></i>
                                                    </div>
                                                )}
                                                {!isReportMode && <i className="bi bi-grip-vertical text-muted ms-1 opacity-50"></i>}
                                            </div>
                                        </th>
                                    );
                                })}
                                
                                {/* CONDITIONAL REMARKS HEADER */}
                                {showRemarksColumn && (
                                    <th className="py-2 px-1 text-center" style={{ ...getHeaderStyle(), cursor: 'default', minWidth: '100px' }}>Remarks</th>
                                )}
                                
                                {!isReportMode && <th className="text-center" style={{ ...getHeaderStyle(), cursor: 'default', width: "80px" }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {data.map((row, idx) => (
                                <tr key={row._rowId || idx}>
                                    {/* CONDITIONAL DN CELL */}
                                    {showDnColumn && (
                                        <td className="px-3 py-3 text-center small fw-bold">{row[dnKey] || "-"}</td>
                                    )}

                                    {columnOrder.map(key => {
                                        const comp = allComponents.find(c => c.key === key);
                                        const isCustom = customColumns.find(c => c.key === key);
                                        const isCalculated = isCustom && isCustom.type === 'calculated';
                                        
                                        const isReadOnly = key === 'createdBy' || key === 'createdAt';
                                        
                                        let displayValue = calculateCellValue(row, isCustom || comp || { key });

                                        // --- Convert Internal Values to Labels for Select/Radio/Checkbox ---
                                        if (comp && (comp.type === 'select' || comp.type === 'radio' || comp.type === 'checkbox')) {
                                            const options = comp.values || comp.data?.values || [];
                                            if (options.length > 0) {
                                                if (Array.isArray(displayValue)) {
                                                    displayValue = displayValue.map(val => {
                                                        const match = options.find(opt => opt.value === val);
                                                        return match ? match.label : val;
                                                    }); 
                                                } else {
                                                    const match = options.find(opt => opt.value === displayValue);
                                                    if (match) displayValue = match.label;
                                                }
                                            }
                                        }

                                        if (key === 'createdAt' || comp?.type === 'date' || comp?.type === 'datetime') {
                                            displayValue = formatDate(displayValue);
                                        }

                                        const isEditing = editingCell?.rowId === row._rowId && editingCell?.colKey === key;
                                        const isEditable = !isReadOnly && (!isCustom || (isCustom && !isCalculated));
                                        
                                        return (
                                            <td 
                                                key={key} 
                                                className={`px-3 py-3 text-center small ${isEditable ? "cursor-pointer bg-light" : ""} ${isCalculated ? "bg-light-subtle fw-bold text-primary" : ""}`}
                                                onClick={() => { if (isEditable && !isEditing) setEditingCell({ rowId: row._rowId, colKey: key }); }}
                                                style={{ whiteSpace: "nowrap" }}
                                            >
                                                {isEditing ? (
                                                    <input 
                                                        autoFocus type="text" className="form-control form-control-sm text-center p-0" defaultValue={row[key] || ""}
                                                        onBlur={(e) => handleCellSave(row._rowId, key, e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(row._rowId, key, e.currentTarget.value); }}
                                                        style={{minWidth: "60px"}}
                                                    />
                                                ) : (
                                                    formatDisplayValue(displayValue)
                                                )}
                                            </td>
                                        );
                                    })}
                                    
                                    {/* CONDITIONAL REMARKS CELL */}
                                    {showRemarksColumn && (
                                        <td className="px-3 py-3 text-center small" style={{ whiteSpace: "nowrap" }}>{row[remarksKey] || "-"}</td>
                                    )}

                                    {!isReportMode && <td className="text-center"><button className="btn btn-sm text-danger" onClick={() => onDeleteRow(row._rowId)}><i className="bi bi-trash3-fill"></i></button></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- UPDATED: FOOTER SECTION (Value or Image) --- */}
            {isReportMode && (
                <div className="mt-5 pt-4 pb-4 px-2 d-flex flex-wrap gap-4">
                    {localFooters.map((footer, index) => {
                        // Check if this footer item is a "Signature/Image" type
                        const isSignature = footer.type === 'image';
                        
                        return (
                            <div 
                                className="d-inline-block draggable-footer-item" 
                                key={footer.id || index} 
                                style={{ 
                                    minWidth: '200px',
                                    cursor: 'move',
                                    opacity: draggedFooter === index ? 0.4 : 1,
                                    transition: 'all 0.2s ease',
                                    borderRadius: '4px',
                                    padding: '4px'
                                }}
                                draggable={true}
                                onDragStart={(e) => handleFooterDragStart(e, index)}
                                onDragOver={(e) => handleFooterDragOver(e, index)}
                                onDrop={(e) => handleFooterDrop(e, index)}
                                title="Drag to reorder"
                            >
                                <div 
                                    className="w-100 ps-2 pt-1 position-relative" 
                                    style={{
                                        userSelect: 'none', 
                                        // UPDATED: Border (underline) ONLY for Image/Signature type
                                        borderBottom: isSignature ? '2px solid black' : 'none', 
                                        paddingBottom: '5px', 
                                        minHeight: '40px'
                                    }}
                                >
                                    {isSignature && footer.value ? (
                                        <img 
                                            src={footer.value} 
                                            alt="Signature" 
                                            style={{
                                                height: '50px', 
                                                maxWidth: '100%', 
                                                objectFit: 'contain',
                                                position: 'absolute', 
                                                bottom: '5px',        
                                                left: '10px'
                                            }} 
                                        />
                                    ) : (
                                        <span className="fw-bold">{footer.value}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DynamicTable;