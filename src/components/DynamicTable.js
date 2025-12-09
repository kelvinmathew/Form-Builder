import React, { useState, useEffect, useRef } from 'react'; 
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
    onLayoutChange,
    themeColor, 
    onThemeColorChange
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

    // 2. Create a Ref to trigger the hidden color input
    const colorInputRef = useRef(null);

    // --- Logic ---
    const showDnColumn = allComponents.some(c => c.key === dnKey);
    const showRemarksColumn = allComponents.some(c => c.key === remarksKey);

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
        if (onLayoutChange) onLayoutChange({ headers: newHeaders, footers: localFooters });
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
        if (onLayoutChange) onLayoutChange({ headers: localHeaders, footers: newFooters });
    };

    // --- TYPOGRAPHY STYLES ---
    const fontText = { fontSize: "14px" };
    const fontHeading = { fontSize: "16px", fontWeight: "bold" };

    const getHeaderStyle = (isDragging = false) => ({
        backgroundColor: isReportMode ? themeColor : (isDragging ? "#e9ecef" : "#F9FAFB"),
        color: isReportMode ? "white" : "#545757",
        border: isReportMode ? "none" : "1px solid #dee2e6",
        cursor: "move", 
        userSelect: "none",
        whiteSpace: "nowrap",
        ...fontText // 14px for table headers
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
            <div className="col-5 text-muted" style={fontText}>{label}:</div>
            <div className="col-7 border-bottom position-relative" style={{ minHeight: "24px", borderColor: "#dee2e6" }}>
                {value && <span className="fw-bold text-dark position-absolute bottom-0 start-0 ps-2" style={fontText}>{value}</span>}
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
        <div className={`bg-transparent`} onClick={() => setColumnToDelete(null)}>
            
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
                                    <button type="button" className="btn btn-outline-secondary btn-sm rounded-6 px-3" onClick={(e) => { e.stopPropagation(); setColumnToDelete(null); }}>Cancel</button>
                                    <button type="button" className="btn btn-danger btn-sm rounded-6 px-3" onClick={(e) => { e.stopPropagation(); confirmDelete(); }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REPORT MODE HEADER CONTROLS --- */}
            {isReportMode && (
                <div className="d-flex justify-content-between align-items-center mb-4 position-relative">
                    {/* LEFT SIDE: Export Buttons */}
                    <div className="d-flex gap-2 align-items-center">
                        {/* Green Excel Button */}
                        <button className="btn btn-success text-white rounded-3 border-0" onClick={onExportExcel} style={{backgroundColor: "#107c41", ...fontText}}>
                            <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
                        </button>
                        {/* Red PDF Button */}
                        <button className="btn btn-danger text-white rounded-3 border-0" onClick={onExportPDF} style={{backgroundColor: "#dc2626", ...fontText}}>
                            <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
                        </button>
                        
                        {/* Theme Color Button */}
                        <div className="ms-2">
                            <button 
                                className="btn btn-light border text-muted" 
                                onClick={() => colorInputRef.current.click()}
                                title="Change Theme Color"
                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: "6px" }}
                            >
                                <i className="bi bi-palette-fill"></i>
                            </button>
                            <input 
                                ref={colorInputRef}
                                type="color" 
                                value={themeColor} 
                                onChange={(e) => onThemeColorChange(e.target.value)}
                                style={{ display: 'none' }} 
                            />
                        </div>
                    </div>

                    {/* CENTER: Title (Position Absolute to ensure perfect centering) */}
                    <span className="fw-bold text-dark position-absolute start-50 translate-middle-x" style={fontHeading}>
                        {formTitle || "Report"}
                    </span>

                    {/* RIGHT SIDE: Add Column Button */}
                    <div>
                        <button className="btn btn-outline-primary text-nowrap rounded-3" onClick={onAddColumn} style={fontText}>
                            <i className="bi bi-plus me-1"></i> Add Column
                        </button>
                    </div>
                </div>
            )}

            {/* --- 1. PROJECT DETAILS BOX (Curved White Box) --- */}
            {isReportMode && (
                <div className="card border shadow-sm mb-4 rounded-3 overflow-hidden">
                    {/* Header Strip */}
                    <div 
                        className="text-white fw-bold py-2 px-4" 
                        style={{ 
                            backgroundColor: themeColor,
                            ...fontHeading // 16px
                        }}
                    >
                        Project Details
                    </div>
                    
                    {/* Details Body */}
                    <div className="p-4 bg-white">
                        <div className="row g-4">
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
                                        border: draggedHeader === index ? `2px dashed ${themeColor}` : '2px solid transparent',
                                        borderRadius: '4px'
                                    }}
                                    title="Drag to reorder"
                                >
                                    {renderDetailLine(item.label, item.value)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- 2. DATA TABLE BOX (Separate Curved White Box) --- */}
            <div className="card border shadow-sm rounded-3 overflow-hidden">
                {!isReportMode && (
                    <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0" style={fontHeading}>{title}</h5>
                        <div>
                            <button className="btn btn-sm btn-outline-primary me-3" onClick={onAddColumn} style={fontText}><i className="bi bi-plus-circle me-1"></i> Add Column</button>
                            <small className="text-muted text-end d-inline-block">Drag headers to move columns.</small>
                        </div>
                    </div>
                )}

                <div className="table-responsive hide-scrollbar">
                    <table className={`table mb-0 ${isReportMode ? "table-sm w-100" : ""}`} style={{ minWidth: '100%' }}>
                        <thead>
                            {/* Report Mode: Table Headers have colored background */}
                            <tr style={{ backgroundColor: isReportMode ? themeColor : "transparent" }}>
                                {/* CONDITIONAL DN HEADER */}
                                {showDnColumn && (
                                    <th className="py-3 px-3 text-center text-white" style={{ ...getHeaderStyle(), cursor: 'default', minWidth: '63px' }}>{dnLabel}</th>
                                )}
                                
                                {columnOrder.map((key) => {
                                    const comp = allComponents.find(c => c.key === key);
                                    const isCustom = customColumns.find(c => c.key === key);
                                    return (
                                        <th
                                            key={key}
                                            className="py-3 px-3 text-center position-relative group-hover text-white"
                                            draggable={true}
                                            onDragStart={() => setDraggedColumn(key)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => { onColumnDrop(draggedColumn, key); setDraggedColumn(null); }}
                                            style={{ ...getHeaderStyle(draggedColumn === key), minWidth: '100px' }}
                                        >
                                            <div className="d-flex align-items-center justify-content-center gap-1">
                                                <span>{getColumnLabel(key, comp)}</span>
                                                {isCustom && (
                                                    <div 
                                                        className="d-inline-flex align-items-center justify-content-center ms-1 text-danger bg-white rounded-circle "
                                                        style={{width: '18px', height: '18px', cursor: 'pointer', transition: 'all 0.2s'}}
                                                        onClick={(e) => { e.stopPropagation(); setColumnToDelete(key); }} 
                                                    >
                                                        <i className="bi bi-trash3" style={{fontSize: '0.7rem'}}></i>
                                                    </div>
                                                )}
                                                {!isReportMode && <i className="bi bi-grip-vertical text-white ms-1 opacity-50"></i>}
                                            </div>
                                        </th>
                                    );
                                })}
                                
                                {/* CONDITIONAL REMARKS HEADER */}
                                {showRemarksColumn && (
                                    <th className="py-3 px-3 text-center text-white" style={{ ...getHeaderStyle(), cursor: 'default', minWidth: '100px' }}>Remarks</th>
                                )}
                                
                                {!isReportMode && <th className="text-center" style={{ ...getHeaderStyle(), cursor: 'default', width: "80px" }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {data.map((row, idx) => (
                                <tr key={row._rowId || idx} style={{borderBottom: "1px solid #f0f0f0"}}>
                                    {/* CONDITIONAL DN CELL */}
                                    {showDnColumn && (
                                        <td className="px-3 py-3 text-center fw-bold" style={fontText}>
                                            {row[dnKey] || "-"}
                                        </td>
                                    )}

                                    {columnOrder.map(key => {
                                        const comp = allComponents.find(c => c.key === key);
                                        const isCustom = customColumns.find(c => c.key === key);
                                        const isCalculated = isCustom && isCustom.type === 'calculated';
                                        
                                        const isReadOnly = key === 'createdBy' || key === 'createdAt';
                                        
                                        let displayValue = calculateCellValue(row, isCustom || comp || { key });

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
                                                className={`px-3 py-3 text-center ${isEditable ? "cursor-pointer" : ""} ${isCalculated ? "bg-light-subtle fw-bold text-primary" : ""}`}
                                                onClick={() => { if (isEditable && !isEditing) setEditingCell({ rowId: row._rowId, colKey: key }); }}
                                                style={{ whiteSpace: "nowrap", ...fontText }} 
                                            >
                                                {isEditing ? (
                                                    <input 
                                                        autoFocus type="text" className="form-control text-center p-0" defaultValue={row[key] || ""}
                                                        onBlur={(e) => handleCellSave(row._rowId, key, e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(row._rowId, key, e.currentTarget.value); }}
                                                        style={{minWidth: "60px", fontSize: "14px", height: "24px"}} 
                                                    />
                                                ) : (
                                                    formatDisplayValue(displayValue)
                                                )}
                                            </td>
                                        );
                                    })}
                                    
                                    {showRemarksColumn && (
                                        <td className="px-3 py-3 text-center" style={{ whiteSpace: "nowrap", ...fontText }}>{row[remarksKey] || "-"}</td>
                                    )}

                                    {!isReportMode && <td className="text-center"><button className="btn btn-sm text-danger" onClick={() => onDeleteRow(row._rowId)}><i className="bi bi-trash3-fill"></i></button></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- FOOTER SECTION --- */}
            {isReportMode && (
                <div className="mt-4 pb-4 px-2 d-flex flex-column gap-4"> 
                    {localFooters.map((footer, index) => {
                        const isSignature = footer.type === 'image';
                        
                        return (
                            <div 
                                className="d-block draggable-footer-item" 
                                key={footer.id || index} 
                                style={{ 
                                    width: '100%', 
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
                            >
                                <div 
                                    className="ps-2 pt-1 position-relative" 
                                    style={{
                                        userSelect: 'none', 
                                        borderBottom: isSignature ? '1px solid black' : 'none', 
                                        paddingBottom: '5px', 
                                        minHeight: '40px',
                                        width: isSignature ? '300px' : 'auto' 
                                    }}
                                >
                                    {isSignature && footer.value ? (
                                        <img 
                                            src={footer.value} 
                                            alt="Signature" 
                                            style={{ height: '50px', maxWidth: '100%', objectFit: 'contain', position: 'absolute', bottom: '5px', left: '10px' }} 
                                        />
                                    ) : (
                                        <span className="fw-bold" style={fontText}>{footer.value}</span>
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