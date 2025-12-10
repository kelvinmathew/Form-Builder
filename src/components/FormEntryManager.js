import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Cookies from 'js-cookie';

// --- IMPORTS ---
import AddCalculatedColumnModal from './AddCalculatedColumnModal';
import CustomFormRenderer from './CustomFormRenderer';
import DataEntryList from './DataEntryList';
import DynamicTable from './DynamicTable';
import { flattenComponents, calculateCellValue } from '../utils/formHelpers';

const FormEntryManager = ({ form, entries, onSubmit, onUpdate, onDeleteRow, onBack }) => {
    // --- STATE ---
    const [userName, setUserName] = useState("");
    const [isUserSet, setIsUserSet] = useState(false);
    const [tempName, setTempName] = useState(""); 
    const [showNameModal, setShowNameModal] = useState(false);

    // --- PERSISTENCE: LOAD MODE FROM LOCAL STORAGE ---
    const [mode, setMode] = useState(() => {
        return localStorage.getItem("formEntryMode") || "LIST";
    });

    useEffect(() => {
        localStorage.setItem("formEntryMode", mode);
    }, [mode]);

    // --- DELETE MODAL STATE ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    
    // --- OFFCANVAS & DRAFT STATE ---
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasMode, setOffcanvasMode] = useState("ADD"); 
    const [editingEntry, setEditingEntry] = useState(null);
    const [tempEntries, setTempEntries] = useState([]); 

    const [showCalcModal, setShowCalcModal] = useState(false);
    const [reportThemeColor, setReportThemeColor] = useState("#00B050");
    const [columnOrder, setColumnOrder] = useState([]);
    
    // Custom Columns
    const [customColumns, setCustomColumns] = useState(() => {
        if (!form?.id) return [];
        const savedCols = localStorage.getItem(`custom_columns_${form.id}`);
        return savedCols ? JSON.parse(savedCols) : [];
    });

    const [formKey, setFormKey] = useState(0);
    const formInstanceRef = useRef(null);

    const [pdfLayout, setPdfLayout] = useState({ 
        headers: form?.projectDetails?.headers || [], 
        footers: form?.projectDetails?.footers || [] 
    });

    const handleFormReady = useCallback((inst) => { 
        formInstanceRef.current = inst; 
    }, []);

    // --- EFFECTS ---
    useEffect(() => {
        const savedName = Cookies.get('formUser');
        if (savedName) { setUserName(savedName); setIsUserSet(true); }
    }, []);

    useEffect(() => {
        if (form?.id) localStorage.setItem(`custom_columns_${form.id}`, JSON.stringify(customColumns));
    }, [customColumns, form?.id]);

    useEffect(() => {
        if (form?.projectDetails) {
            setPdfLayout({ headers: form.projectDetails.headers || [], footers: form.projectDetails.footers || [] });
        }
    }, [form]);

    const projectDetails = form?.projectDetails || { headers: [], footers: [] };
    
    const allComponents = useMemo(() => {
        if (!form?.schema?.components) return [];
        const original = flattenComponents(form.schema.components);
        return [...original, ...customColumns];
    }, [form, customColumns]);

    // --- COLUMN DEFINITIONS ---
    const dnComponent = allComponents.find(c => ["delivery note", "dn no.", "dn no", "dn number"].includes(c.label?.trim().toLowerCase()));
    const dnKey = dnComponent ? dnComponent.key : "dnNumber";
    const dnLabel = dnComponent ? dnComponent.label : "DN No.";
    const remarksComponent = allComponents.find(c => c.label?.trim().toLowerCase() === "remarks");
    const remarksKey = remarksComponent ? remarksComponent.key : "remarks";

    const showDnColumn = allComponents.some(c => c.key === dnKey);
    const showRemarksColumn = allComponents.some(c => c.key === remarksKey);

    useEffect(() => {
        if (allComponents.length > 0) {
            const schemaKeys = allComponents.filter(c => c.key !== dnKey && c.key !== remarksKey).map(c => c.key);
            setColumnOrder(prev => {
                const existingBase = prev.filter(key => schemaKeys.includes(key) || key === 'createdBy' || key === 'createdAt');
                const newKeys = schemaKeys.filter(key => !existingBase.includes(key));
                let combined = [...existingBase, ...newKeys];
                if (!combined.includes('createdBy')) combined.push('createdBy');
                if (!combined.includes('createdAt')) combined.push('createdAt');
                return combined;
            });
        }
    }, [allComponents, dnKey, remarksKey]);

    const listColumnOrder = useMemo(() => {
        const customKeys = customColumns.map(col => col.key);
        return columnOrder.filter(key => !customKeys.includes(key));
    }, [columnOrder, customColumns]);

    // --- UPDATED SORTING LOGIC: LATEST FIRST (ROBUST FIX) ---
    const displayedEntries = useMemo(() => {
        const combined = [...tempEntries, ...entries];
        return combined.sort((a, b) => {
            const getTimestamp = (item) => {
                if (!item || !item._rowId) return 0;
                
                const strId = item._rowId.toString();
                
                // Case 1: Drafts (format: draft_TIMESTAMP_RANDOM)
                if (strId.startsWith('draft_')) {
                    const parts = strId.split('_');
                    // parts[1] is the timestamp
                    return Number(parts[1]) || 0;
                }

                // Case 2: Saved Entries (format: TIMESTAMP + RANDOM_STRING)
                // We extract the first 13 characters (standard millisecond timestamp)
                // This prevents issues where non-numeric random characters cause NaN
                const timestampStr = strId.substring(0, 13);
                return Number(timestampStr) || 0;
            };

            // Descending order: B (newer) - A (older)
            return getTimestamp(b) - getTimestamp(a);
        });
    }, [entries, tempEntries]);

    // --- HANDLERS ---
    const handleNavigationBack = () => { if (mode === "LIST") { onBack?.(); } else { setMode("LIST"); } };

    const openOffcanvas = (entry = null) => {
        if (entry) {
            setEditingEntry(entry);
            setOffcanvasMode("EDIT");
        } else {
            setEditingEntry(null);
            setOffcanvasMode("ADD");
            setFormKey(p => p + 1); 
        }
        setShowOffcanvas(true);
    };
    const closeOffcanvas = () => { setShowOffcanvas(false); setEditingEntry(null); };

    const handleRequestDelete = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (entryToDelete) {
            if (entryToDelete._isDraft) {
                setTempEntries(prev => prev.filter(e => e._rowId !== entryToDelete._rowId));
            } else {
                onDeleteRow(entryToDelete);
            }
        }
        setShowDeleteModal(false);
        setEntryToDelete(null);
    };

    const handleSaveDraft = () => {
        if (!formInstanceRef.current) return;
        formInstanceRef.current.submit().then((submission) => {
            const timestamp = new Date().toISOString();
            const displayDate = new Date().toLocaleDateString();

            if (offcanvasMode === "EDIT" && editingEntry) {
                const updated = { ...editingEntry, ...submission.data, updatedAt: timestamp };
                if (editingEntry._isDraft) {
                    setTempEntries(prev => prev.map(e => e._rowId === editingEntry._rowId ? updated : e));
                }
                onUpdate(updated); 
            } else {
                const newDraft = {
                    ...submission.data,
                    createdAt: displayDate,
                    createdBy: userName,
                    updatedAt: timestamp,
                    _rowId: `draft_${Date.now()}_${Math.random()}`,
                    _isDraft: true 
                };
                setTempEntries(prev => [newDraft, ...prev]);
                setFormKey(p => p + 1);
            }
            setShowOffcanvas(false);
        }).catch((err) => console.log("Validation failed", err));
    };

    const handleFinalSaveAll = () => {
        if (tempEntries.length === 0) return;
        const recordsToSave = tempEntries.map(draft => {
            const { _isDraft, _rowId, ...cleanData } = draft;
            return cleanData;
        });
        onSubmit(recordsToSave);
        setTempEntries([]); 
    };

    const handleCellUpdate = (rowId, key, newValue) => {
        const isDraft = rowId.toString().startsWith('draft_');
        if (isDraft) {
            setTempEntries(prev => prev.map(e => e._rowId === rowId ? { ...e, [key]: newValue } : e));
        } else {
            const entry = entries.find(e => e._rowId === rowId);
            if (entry) onUpdate({ ...entry, [key]: newValue });
        }
    };

    const handleColumnDrop = (draggedCol, targetCol) => {
        if (!draggedCol || draggedCol === targetCol) return;
        const newOrder = [...columnOrder];
        const fromIndex = newOrder.indexOf(draggedCol);
        const toIndex = newOrder.indexOf(targetCol);
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedCol);
        setColumnOrder(newOrder);
    };

    // --- EXPORTS ---
    const getLabel = (key) => { const comp = allComponents.find(c => c.key === key); return comp ? comp.label : key; };
    const formatExportValue = (val) => {
        if (val === undefined || val === null) return "";
        if (Array.isArray(val)) return val.map(item => typeof item === 'object' ? item.label || item.value : item).join(", ");
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
    };
    const hexToRgb = (hex) => { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 176, 80]; };

    const handleExportExcel = () => {
        const sheetData = [];
        sheetData.push([form.title || "Form Report", ""]);
        sheetData.push(["Project Details", ""]); 

        const headers = pdfLayout.headers || [];
        for (let i = 0; i < headers.length; i += 2) {
            const r = [];
            if (headers[i]) { r.push(headers[i].label || ""); r.push(headers[i].value); }
            if (headers[i+1]) { r.push(""); r.push(headers[i+1].label || ""); r.push(headers[i+1].value); }
            sheetData.push(r);
        }
        sheetData.push([""]); 
        const tableHeader = [];
        if (showDnColumn) tableHeader.push(dnLabel);
        columnOrder.forEach(k => tableHeader.push(getLabel(k)));
        if (showRemarksColumn) tableHeader.push("Remarks");
        sheetData.push(tableHeader);
        displayedEntries.forEach(row => {
            const rData = [];
            if (showDnColumn) rData.push(row[dnKey] || "");
            columnOrder.forEach(key => {
                const conf = allComponents.find(c => c.key === key);
                let val = (conf?.type === 'calculated') ? calculateCellValue(row, conf) : row[key];
                if (conf && ['select','radio','checkbox'].includes(conf.type)) {
                   const options = conf.values || conf.data?.values || [];
                   if(options.length > 0){
                       if(Array.isArray(val)) {
                           val = val.map(v => { const m = options.find(o => o.value === v); return m ? m.label : v; }).join(", ");
                       } else {
                           const match = options.find(o => o.value === val);
                           if(match) val = match.label;
                       }
                   }
                }
                rData.push(formatExportValue(val));
            });
            if (showRemarksColumn) rData.push(row[remarksKey] || "");
            sheetData.push(rData);
        });

        sheetData.push([""]);
        sheetData.push([""]); 
        (pdfLayout.footers || []).forEach(f => {
            const label = f.label || "";
            if(f.type === 'image') { sheetData.push([label, "(Image)"]); } 
            else { sheetData.push([label, f.value]); }
            sheetData.push([""]); 
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${form?.title || "Report"}_${Date.now()}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const [r, g, b] = hexToRgb(reportThemeColor);
        doc.setFontSize(18); doc.setTextColor(40); doc.text(form.title || "Report", 14, 15);
        doc.setFillColor(r, g, b); doc.rect(14, 20, 269, 7, 'F'); 
        doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text("Project Details", 16, 25); 

        doc.setTextColor(0, 0, 0); doc.setFontSize(10);
        let y = 35;
        (pdfLayout.headers || []).forEach((h, i) => {
            const xPos = (i % 2 === 0) ? 14 : 150; 
            if (h.label) { doc.setFont(undefined, 'bold'); doc.text(`${h.label}:`, xPos, y); }
            doc.setFont(undefined, 'normal'); doc.text(`${h.value || ""}`, xPos + 40, y);
            if (i % 2 !== 0) y += 8;
        });
        if ((pdfLayout.headers || []).length % 2 !== 0) y += 8;
        
        const pdfHeaders = [];
        if (showDnColumn) pdfHeaders.push(dnLabel);
        columnOrder.forEach(k => pdfHeaders.push(getLabel(k)));
        if (showRemarksColumn) pdfHeaders.push("Remarks");
        const body = displayedEntries.map(row => {
            const r = [];
            if (showDnColumn) r.push(row[dnKey] || "");
            columnOrder.forEach(key => {
                 const conf = allComponents.find(c => c.key === key);
                let val = (conf?.type === 'calculated') ? calculateCellValue(row, conf) : row[key];
                if (conf && ['select','radio','checkbox'].includes(conf.type)) {
                   const options = conf.values || conf.data?.values || [];
                   if(options.length > 0){
                       if(Array.isArray(val)) {
                           val = val.map(v => { const m = options.find(o => o.value === v); return m ? m.label : v; }).join(", ");
                       } else {
                           const match = options.find(o => o.value === val);
                           if(match) val = match.label;
                       }
                   }
                }
                r.push(formatExportValue(val));
            });
            if (showRemarksColumn) r.push(row[remarksKey] || "");
            return r;
        });
        
        autoTable(doc, { 
            startY: y + 5, head: [pdfHeaders], body: body, 
            headStyles: { fillColor: [r, g, b], textColor: 255 }, theme: 'grid'
        });

        let finalY = doc.lastAutoTable.finalY + 15;
        (pdfLayout.footers || []).forEach(f => {
            if (finalY > 180) { doc.addPage(); finalY = 20; }
            if (f.label) { doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.text(`${f.label}:`, 14, finalY); }
            if (f.type === 'image' && f.value) {
                 try { doc.addImage(f.value, 'PNG', 14, finalY + 5, 40, 15); finalY += 35; } 
                 catch(e) { doc.text("(Image)", 14, finalY + 5); finalY += 20; }
            } else {
                doc.setFont(undefined, 'normal'); doc.text(`${f.value || ""}`, 14, finalY + 6); finalY += 20; 
            }
        });

        doc.save(`${form?.title || "Report"}_${Date.now()}.pdf`);
    };

    if (!form) return <div className="p-5 text-center text-muted">Loading...</div>;
    if (!isUserSet) return ( <div className="p-5 text-center"><button className="btn btn-primary" onClick={()=>{setUserName("User"); setIsUserSet(true)}}>Start</button></div>);

    const textStyle = { fontSize: "14px" };
    const headingStyle = { fontSize: "16px", fontWeight: "bold" };

    return (
        <div className="min-vh-100" style={{ backgroundColor: "#F3F4F6" }}>
            <AddCalculatedColumnModal show={showCalcModal} onClose={() => setShowCalcModal(false)} onSave={(newCol) => { setCustomColumns(p => [...p, newCol]); setShowCalcModal(false); }} existingColumns={allComponents.filter(c => c.key !== dnKey && c.key !== remarksKey)} />
            
            {/* --- OFFCANVAS (FORM) --- */}
            <div className={`offcanvas offcanvas-end ${showOffcanvas ? 'show' : ''}`} style={{ width: '500px', visibility: showOffcanvas ? 'visible' : 'hidden', transition: 'transform 0.3s ease-in-out', zIndex: 1045 }} tabIndex="-1">
                <div className="offcanvas-header border-bottom">
                    <h5 className="offcanvas-title fw-bold">{offcanvasMode === "EDIT" ? "Edit Entry" : "New Entry"}</h5>
                    <button type="button" className="btn-close text-reset" onClick={closeOffcanvas}></button>
                </div>
                <div className="offcanvas-body bg-light">
                     <CustomFormRenderer 
                        key={formKey} 
                        schema={{ ...form.schema, components: [...(form.schema.components || []), ...customColumns] }}
                        initialData={editingEntry || {}} 
                        onFormReady={handleFormReady}
                    />
                </div>
                <div className="offcanvas-footer border-top p-3 bg-white d-flex justify-content-end">
                    {/* UPDATED: Added fontSize: 14px to button */}
                    <button className="btn btn-primary w-100" onClick={handleSaveDraft} style={{ fontSize: '14px' }}>
                        Save Draft
                    </button>
                </div>
            </div>
            {showOffcanvas && <div className="modal-backdrop fade show" style={{zIndex: 1040}} onClick={closeOffcanvas}></div>}

            {/* HEADER */}
            <div className="bg-white border-bottom sticky-top py-3 shadow-sm" style={{ zIndex: 90 }}>
                <div className="container px-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <button onClick={handleNavigationBack} className="btn btn-white border shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}><i className="bi bi-arrow-left"></i></button>
                            <div>
                                <h5 className="text-dark mb-0" style={headingStyle}>{form.title}</h5>
                                <small className="text-muted" style={textStyle}>{mode === "LIST" ? "Entries List" : "All Records"}</small>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button className={`btn shadow-sm rounded-3 px-3 ${mode === "LIST" ? "btn-white border fw-bold text-dark" : "btn-light text-muted border-0"}`} onClick={() => setMode("LIST")} style={textStyle}><i className="bi bi-list-ul me-2"></i> Entries</button>
                            <button className={`btn shadow-sm rounded-3 px-3 ${mode === "ALL_DATA" ? "btn-white border fw-bold text-dark" : "btn-light text-muted border-0"}`} onClick={() => setMode("ALL_DATA")} style={textStyle}><i className="bi bi-table me-2"></i> All Data</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container px-2 px-md-4 py-4">
                {mode === "LIST" && (
                    <div className="animate-fade-in">
                        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                             <div>
                                <h4 className="fw-bold mb-1" style={headingStyle}>Entries</h4>
                                <p className="text-muted mb-0" style={textStyle}>View all individual entries.</p>
                             </div>
                             <div className="d-flex gap-2">
                                {tempEntries.length > 0 && (
                                    <button className="btn btn-success shadow-sm rounded-3 animate-up" onClick={handleFinalSaveAll} style={textStyle}>
                                        <i className="bi bi-check-circle-fill me-1"></i> Save All ({tempEntries.length})
                                    </button>
                                )}
                                <button className="btn btn-primary shadow-sm rounded-3" onClick={() => openOffcanvas(null)} style={textStyle}>
                                    <i className="bi bi-plus-lg me-1"></i> New Entry
                                </button>
                             </div>
                        </div>
                        
                        <div className="row">
                            <div className="col-lg-9 col-xl-8">
                                <DataEntryList 
                                    data={displayedEntries} 
                                    columnOrder={listColumnOrder} 
                                    allComponents={allComponents} 
                                    onEdit={(row) => openOffcanvas(row)} 
                                    onDelete={handleRequestDelete}
                                />
                            </div>
                            <div className="col-lg-3 col-xl-4 d-none d-lg-block"></div>
                        </div>
                    </div>
                )}

                {mode === "ALL_DATA" && (
                    <div className="animate-fade-in bg-white p-4 shadow-sm" style={{ minHeight: "800px", overflowX: 'auto' }}>
                        <DynamicTable 
                            data={displayedEntries} title="Master Report" formTitle={form.title} isReportMode={true}
                            columnOrder={columnOrder} 
                            allComponents={allComponents} 
                            customColumns={customColumns} 
                            projectDetails={projectDetails}
                            dnKey={dnKey} dnLabel={dnLabel} remarksKey={remarksKey}
                            themeColor={reportThemeColor} 
                            onThemeColorChange={setReportThemeColor}
                            onAddColumn={() => setShowCalcModal(true)} 
                            onDeleteColumn={(k) => { setCustomColumns(p => p.filter(c => c.key !== k)); setColumnOrder(p => p.filter(x => x !== k)); }}
                            onColumnDrop={handleColumnDrop} onUpdateEntry={handleCellUpdate} 
                            onDeleteRow={handleRequestDelete}
                            onExportExcel={handleExportExcel} onExportPDF={handleExportPDF}
                            onLayoutChange={(newLayout) => setPdfLayout(newLayout)}
                        />
                    </div>
                )}
            </div>

            <style>{`
                .offcanvas { box-shadow: -5px 0 15px rgba(0,0,0,0.1); }
                .form-control, .form-select { height: 38px !important; min-height: 38px !important; padding: 4px 12px !important; font-size: 14px !important; border-radius: 6px !important; }
                textarea.form-control { height: auto !important; min-height: 80px !important; }
                label { font-size: 14px !important; font-weight: 600 !important; margin-bottom: 4px !important; color: #4b5563; }
                .animate-up { animation: fadeInUp 0.3s ease-out; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            {/* Delete Modal - Included to ensure no missing variables */}
            {showDeleteModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-sm border-0 rounded-4">
                            <div className="modal-body text-center p-4">
                                <i className="bi bi-trash text-danger fs-1 mb-2"></i>
                                <h6 className="fw-bold mb-2 text-dark">Delete Entry?</h6>
                                <p className="text-muted small mb-4">Are you sure you want to delete this entry?</p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button className="btn btn-outline-secondary btn-sm rounded-6 px-3" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                    <button className="btn btn-danger btn-sm rounded-6 px-3" onClick={confirmDelete}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormEntryManager;