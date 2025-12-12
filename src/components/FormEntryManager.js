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

// --- API SERVICE IMPORT ---
import { apiService } from '../services/apiService'; 

const FormEntryManager = ({ form, onBack }) => {
    // --- STATE ---
    const [entries, setEntries] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);

    // --- USER SESSION STATE ---
    const [userName, setUserName] = useState("");
    const [isUserSet, setIsUserSet] = useState(false);
    const [tempName, setTempName] = useState(""); 
    
    // New State for User Edit Modal
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingName, setEditingName] = useState("");

    // --- PERSISTENCE ---
    const [mode, setMode] = useState(() => {
        return localStorage.getItem("formEntryMode") || "LIST";
    });

    useEffect(() => {
        localStorage.setItem("formEntryMode", mode);
    }, [mode]);

    // --- MODAL STATE ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasMode, setOffcanvasMode] = useState("ADD"); 
    const [editingEntry, setEditingEntry] = useState(null);
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

    // --- API: FETCH DATA ---
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const rawData = await apiService.fetchEntries();
            
            // --- FIX: UNWRAP DATA & MAP DATES ---
            const processedData = rawData.map(item => {
                const innerData = item.entry_data || item.data || {}; 
                return { 
                    ...item, 
                    ...innerData, 
                    createdAt: item.created_date,
                    updatedAt: item.updated_date,
                    createdBy: item.created_by 
                };
            });

            const sorted = processedData.sort((a, b) => b._rowId - a._rowId);
            setEntries(sorted);
        } catch (error) {
            console.error("Failed to fetch entries:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- EFFECT: CHECK USER SESSION ---
    useEffect(() => {
        const savedName = Cookies.get('formUser');
        if (savedName) { 
            setUserName(savedName); 
            setIsUserSet(true); 
        }
        refreshData();
    }, [refreshData]);

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

    // --- HELPER: PREPARE DATA FOR SAVING ---
    const extractEntryData = (fullEntry) => {
        const metadataKeys = [
            '_rowId', '_isDraft', 'created_by', 'created_date', 'updated_date', 
            'createdAt', 'updatedAt', 'createdBy', 'status', 'delete_status', 'id'
        ];
        const entryData = {};
        Object.keys(fullEntry).forEach(key => {
            if (!metadataKeys.includes(key)) {
                entryData[key] = fullEntry[key];
            }
        });
        return entryData;
    };

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
                const existingBase = prev.filter(key => schemaKeys.includes(key) || key === 'createdBy' || key === 'createdAt' || key === 'updatedAt');
                const newKeys = schemaKeys.filter(key => !existingBase.includes(key));
                let combined = [...existingBase, ...newKeys];
                
                if (!combined.includes('createdBy')) combined.push('createdBy');
                if (!combined.includes('updatedAt')) combined.push('updatedAt'); 
                
                return combined;
            });
        }
    }, [allComponents, dnKey, remarksKey]);

    const listColumnOrder = useMemo(() => {
        const customKeys = customColumns.map(col => col.key);
        return columnOrder.filter(key => !customKeys.includes(key));
    }, [columnOrder, customColumns]);

    // --- HANDLER: START SESSION ---
    const handleStartSession = () => {
        if (!tempName.trim()) return;
        Cookies.set('formUser', tempName, { expires: 7 }); 
        setUserName(tempName);
        setIsUserSet(true);
    };

    // --- HANDLER: EDIT USER NAME ---
    const openUserModal = () => {
        setEditingName(userName);
        setShowUserModal(true);
    };

    const handleSaveUserChange = () => {
        if (!editingName.trim()) return;
        Cookies.set('formUser', editingName, { expires: 7 });
        setUserName(editingName);
        setShowUserModal(false);
    };

    // --- VIEW: NAME INPUT SCREEN ---
    if (!form) return <div className="p-5 text-center text-muted">Loading...</div>;

    if (!isUserSet) return ( 
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow-sm border-0 rounded-4 p-4" style={{maxWidth: '400px', width: '100%'}}>
                <div className="text-center mb-4">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                        <i className="bi bi-person-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bold">Welcome</h5>
                    <p className="text-muted small">Please enter your name to start.</p>
                </div>
                <input 
                    type="text" 
                    className="form-control mb-3" 
                    placeholder="Your Name" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartSession()}
                    autoFocus
                />
                <button 
                    className="btn btn-primary w-100 fw-bold" 
                    onClick={handleStartSession}
                    disabled={!tempName.trim()}
                >
                    Continue
                </button>
            </div>
        </div>
    );

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

    const confirmDelete = async () => {
        if (entryToDelete && entryToDelete._rowId) {
            try {
                await apiService.deleteEntry(entryToDelete._rowId);
                setEntries(prev => prev.filter(e => e._rowId !== entryToDelete._rowId));
            } catch (error) {
                alert("Failed to delete entry");
            }
        }
        setShowDeleteModal(false);
        setEntryToDelete(null);
    };

    // --- API: SAVE / UPDATE ---
    const handleSaveDraft = () => {
        if (!formInstanceRef.current) return;
        
        formInstanceRef.current.submit().then(async (submission) => {
            const formData = submission.data;
            const payload = {
                entry_data: formData, 
                created_by: userName 
            };
            
            try {
                if (offcanvasMode === "EDIT" && editingEntry) {
                    await apiService.updateEntry(editingEntry._rowId, payload);
                } else {
                    await apiService.createEntry(payload);
                    setFormKey(p => p + 1); 
                }
                
                await refreshData();
                setShowOffcanvas(false);

            } catch (error) {
                alert("Failed to save entry. Check network.");
            }

        }).catch((err) => console.log("Validation failed", err));
    };

    const handleFinalSaveAll = async () => {
        const hasDrafts = entries.some(e => e.status === 0);
        if (!hasDrafts) return;

        try {
            await apiService.submitAllDrafts();
            await refreshData(); 
        } catch (error) {
            alert("Failed to submit drafts");
        }
    };

    // --- API: INLINE UPDATE ---
    const handleCellUpdate = async (rowId, key, newValue) => {
        setEntries(prev => prev.map(e => e._rowId === rowId ? { ...e, [key]: newValue } : e));

        try {
            const entry = entries.find(e => e._rowId === rowId);
            if (!entry) return;

            const currentEntryData = extractEntryData(entry);
            currentEntryData[key] = newValue;

            await apiService.updateEntry(rowId, { entry_data: currentEntryData });
        } catch (error) {
            console.error("Cell update failed", error);
            refreshData(); 
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
    const getLabel = (key) => { 
        if (key === 'updatedAt') return 'Updated Date';
        if (key === 'createdBy') return 'Created By';
        const comp = allComponents.find(c => c.key === key); 
        return comp ? comp.label : key; 
    };
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
        
        // CHANGED: Added "S.No" as the first column header
        const tableHeader = ["S.No"];
        if (showDnColumn) tableHeader.push(dnLabel);
        columnOrder.forEach(k => tableHeader.push(getLabel(k)));
        if (showRemarksColumn) tableHeader.push("Remarks");
        sheetData.push(tableHeader);
        
        entries.forEach((row, index) => { // CHANGED: Added index parameter
            // CHANGED: Added index + 1 as the first cell value
            const rData = [index + 1]; 
            
            if (showDnColumn) rData.push(row[dnKey] || "");
            columnOrder.forEach(key => {
                const conf = allComponents.find(c => c.key === key);
                let val = (conf?.type === 'calculated') ? calculateCellValue(row, conf) : row[key];
                
                if ((key === 'updatedAt' || key === 'createdAt') && val) {
                    val = new Date(val).toLocaleString();
                }

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
        
        // CHANGED: Added "S.No" as the first PDF header
        const pdfHeaders = ["S.No"];
        if (showDnColumn) pdfHeaders.push(dnLabel);
        columnOrder.forEach(k => pdfHeaders.push(getLabel(k)));
        if (showRemarksColumn) pdfHeaders.push("Remarks");
        
        const body = entries.map((row, index) => { // CHANGED: Added index parameter
            // CHANGED: Added index + 1 as the first cell value
            const r = [index + 1];
            
            if (showDnColumn) r.push(row[dnKey] || "");
            columnOrder.forEach(key => {
                 const conf = allComponents.find(c => c.key === key);
                let val = (conf?.type === 'calculated') ? calculateCellValue(row, conf) : row[key];
                
                if ((key === 'updatedAt' || key === 'createdAt') && val) {
                    val = new Date(val).toLocaleString();
                }

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

    const textStyle = { fontSize: "14px" };
    const headingStyle = { fontSize: "16px", fontWeight: "bold" };

    const hasDrafts = entries.some(e => e.status === 0);

    return (
        <div className="min-vh-100" style={{ backgroundColor: "#F3F4F6" }}>
            <AddCalculatedColumnModal show={showCalcModal} onClose={() => setShowCalcModal(false)} onSave={(newCol) => { setCustomColumns(p => [...p, newCol]); setShowCalcModal(false); }} existingColumns={allComponents.filter(c => c.key !== dnKey && c.key !== remarksKey)} />
            
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
                    <button className="btn btn-primary w-0" onClick={handleSaveDraft} style={{ fontSize: '14px' }}>
                        {offcanvasMode === "EDIT" ? "Update Entry" : "Save Draft"}
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
                                <h5 className="text-dark mb-1" style={headingStyle}>{form.title}</h5>
                                
                                {/* REFACTORED: Entry Type + User Name in the same line */}
                                <div className="d-flex align-items-center gap-2 small text-muted">
                                    <span style={textStyle}>{mode === "LIST" ? "Entries List" : "All Records"}</span>
                                    
                                   { /* Separator */}
                                    <span className="opacity-120"></span>
                                    
                                    {/* User Name with Edit Icon (Opens Modal) */}
                                    <div 
                                        className="d-flex align-items-center gap-1 text-muted cursor-pointer" 
                                        onClick={openUserModal} 
                                        title="Edit User Name"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-person text-primary"></i>
                                        <span className="fw-medium">{userName}</span>
                                        <i className="btn btn-sm btn-light border-0 text-primary rounded-circle d-flex align-items-center justify-content-center bi bi-pencil-square text-primary ms-1" style={{ fontSize: '13px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            {/* REMOVED OLD USER BUTTON FROM HERE */}

                            
                          {/* <button className={`btn shadow-sm rounded-3 px-3 ${mode === "LIST" ? "btn-white border fw-bold text-dark" : "btn-light text-muted border-0"}`} onClick={() => setMode("LIST")} style={textStyle}><i className="bi bi-list-ul me-2"></i> Entries</button> */}

                            <button className={`btn shadow-sm rounded-3 px-2 ${mode === "ALL_DATA" ? "btn-white border fw-bold text-success" : "btn-light text-muted border-0"}`} onClick={() => setMode("ALL_DATA")} style={textStyle}><i className="bi bi-table me-2"></i> All Records</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container px-2 px-md-4 py-4">
                {isLoading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {mode === "LIST" && (
                            <div className="animate-fade-in">
                                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                                     <div>
                                        <h4 className="fw-bold mb-1" style={headingStyle}>Entries</h4>
                                        <p className="text-muted mb-0" style={textStyle}>View all individual entries.</p>
                                     </div>
                                     <div className="d-flex gap-2">
                                        {hasDrafts && (
                                            <button className="btn btn-success shadow-sm rounded-3 animate-up" onClick={handleFinalSaveAll} style={textStyle}>
                                                <i className="bi bi-check-circle-fill me-1"></i> Submit All Drafts
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
                                            data={entries} 
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
                                    data={entries} title="Master Report" formTitle={form.title} isReportMode={true}
                                    columnOrder={columnOrder} 
                                    allComponents={allComponents} 
                                    customColumns={customColumns} 
                                    projectDetails={projectDetails}
                                    dnKey={dnKey} dnLabel={dnLabel} remarksKey={remarksKey}
                                    themeColor={reportThemeColor} 
                                    onThemeColorChange={setReportThemeColor}
                                    onAddColumn={() => setShowCalcModal(true)} 
                                    onDeleteColumn={(k) => { setCustomColumns(p => p.filter(c => c.key !== k)); setColumnOrder(p => p.filter(x => x !== k)); }}
                                    onColumnDrop={handleColumnDrop} 
                                    onUpdateEntry={handleCellUpdate} 
                                    onDeleteRow={handleRequestDelete}
                                    onExportExcel={handleExportExcel} onExportPDF={handleExportPDF}
                                    onLayoutChange={(newLayout) => setPdfLayout(newLayout)}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* DELETE MODAL */}
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

            {/* USER EDIT MODAL (New Modern Style) */}
            {showUserModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow-sm border-0 rounded-4">
                            <div className="modal-body p-4">
                                <div className="text-center mb-3">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                                        <i className="bi bi-person-fill fs-3"></i>
                                    </div>
                                    <h6 className="fw-bold text-dark">Change Name</h6>
                                </div>
                                
                                <input 
                                    type="text" 
                                    className="form-control mb-4" 
                                    value={editingName} 
                                    onChange={(e) => setEditingName(e.target.value)}
                                    placeholder="Enter your name"
                                    autoFocus
                                />

                                <div className="d-flex gap-2 justify-content-center">
                                    <button className="btn btn-outline-secondary btn-sm px-3" onClick={() => setShowUserModal(false)}>Cancel</button>
                                    <button className="btn btn-primary btn-sm px-3" onClick={handleSaveUserChange}>Save Changes</button>
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