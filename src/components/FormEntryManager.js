import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Cookies from 'js-cookie';

// --- FIXED IMPORTS ---
import AddCalculatedColumnModal from './AddCalculatedColumnModal';
import CustomFormRenderer from './CustomFormRenderer';
import DataEntryList from './DataEntryList';
import DynamicTable from './DynamicTable';
import { flattenComponents, calculateCellValue } from '../utils/formHelpers';

const FormEntryManager = ({ form, entries, onSubmit, onUpdate, onDeleteRow, onBack }) => {
    // --- 1. STATE ---
    const [userName, setUserName] = useState("");
    const [isUserSet, setIsUserSet] = useState(false);
    const [tempName, setTempName] = useState(""); 

    // MODES: "LIST" (Main View), "ALL_DATA" (Table View), "ADD", "EDIT"
    const [mode, setMode] = useState("LIST");
    
    const [editingEntry, setEditingEntry] = useState(null);
    const [showCalcModal, setShowCalcModal] = useState(false);
    
    const [columnOrder, setColumnOrder] = useState([]);
    
    // Initialize customColumns from localStorage if available
    const [customColumns, setCustomColumns] = useState(() => {
        if (!form?.id) return [];
        const savedCols = localStorage.getItem(`custom_columns_${form.id}`);
        return savedCols ? JSON.parse(savedCols) : [];
    });

    const [formKey, setFormKey] = useState(0);
    const formInstanceRef = useRef(null);

    // --- STATE for Layout (Syncs with DynamicTable) ---
    const [pdfLayout, setPdfLayout] = useState({ 
        headers: form?.projectDetails?.headers || [], 
        footers: form?.projectDetails?.footers || [] 
    });

    // --- 2. INITIALIZATION EFFECTS ---
    useEffect(() => {
        const savedName = Cookies.get('formUser');
        if (savedName) {
            setUserName(savedName);
            setIsUserSet(true);
        }
    }, []);

    useEffect(() => {
        if (form?.id) {
            localStorage.setItem(`custom_columns_${form.id}`, JSON.stringify(customColumns));
        }
    }, [customColumns, form?.id]);

    useEffect(() => {
        if (form?.projectDetails) {
            setPdfLayout({
                headers: form.projectDetails.headers || [],
                footers: form.projectDetails.footers || []
            });
        }
    }, [form]);

    const projectDetails = form?.projectDetails || { headers: [], footers: [] };
    
    const allComponents = useMemo(() => {
        if (!form?.schema?.components) return [];
        const original = flattenComponents(form.schema.components);
        return [...original, ...customColumns];
    }, [form, customColumns]);

    const dnComponent = allComponents.find(c => ["delivery note", "dn no.", "dn no", "dn number"].includes(c.label?.trim().toLowerCase()));
    const dnKey = dnComponent ? dnComponent.key : "dnNumber";
    const dnLabel = dnComponent ? dnComponent.label : "DN No.";
    const remarksComponent = allComponents.find(c => c.label?.trim().toLowerCase() === "remarks");
    const remarksKey = remarksComponent ? remarksComponent.key : "remarks";

    // --- LOGIC TO MATCH TABLE VISIBILITY ---
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


    // --- 3. HANDLERS ---
    const handleUserSubmit = (e) => {
        e.preventDefault();
        if (!tempName.trim()) return alert("Please enter your name");
        Cookies.set('formUser', tempName.trim(), { expires: 7 }); 
        setUserName(tempName.trim());
        setIsUserSet(true);
    };

    const handleEditName = () => {
        const newName = prompt("Edit your name:", userName);
        if (newName !== null && newName.trim() !== "") {
            const trimmedName = newName.trim();
            setUserName(trimmedName);
            Cookies.set('formUser', trimmedName, { expires: 7 });
        }
    };

    const handleNavigationBack = () => {
        if (mode === "LIST") {
            onBack?.();
        } else {
            setMode("LIST"); 
            setEditingEntry(null);
        }
    };

    const handleCustomSubmit = (actionType) => {
        if (!formInstanceRef.current) return;
        formInstanceRef.current.submit().then((submission) => {
            const timestamp = new Date().toISOString();
            const displayDate = new Date().toLocaleString(); 

            if (mode === "EDIT" && editingEntry) {
                onUpdate({ 
                    ...editingEntry, 
                    ...submission.data, 
                    updatedAt: timestamp 
                });
                setEditingEntry(null); 
                setMode("LIST"); 
            } else {
                onSubmit({ 
                    ...submission.data, 
                    createdAt: displayDate, 
                    createdBy: userName,     
                    updatedAt: timestamp, 
                    _rowId: Date.now().toString() 
                });
                
                if (actionType === 'SAVE_AND_CONTINUE') { 
                    setFormKey(p => p + 1); 
                }
                else { 
                    setMode("LIST"); 
                }
            }
        }).catch((err) => console.log("Validation failed", err));
    };

    const handleCellUpdate = (rowId, key, newValue) => {
        const entry = entries.find(e => e._rowId === rowId);
        if (entry) onUpdate({ ...entry, [key]: newValue });
    };

    const handleColumnDrop = (draggedCol, targetCol) => {
        if (!draggedCol || draggedCol === targetCol) return;
        const newOrder = [...columnOrder];
        
        // Calculate indices BEFORE modifying the array
        const fromIndex = newOrder.indexOf(draggedCol);
        const toIndex = newOrder.indexOf(targetCol);

        // Remove & Insert
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, draggedCol);

        setColumnOrder(newOrder);
    };

    // --- 4. EXPORTS ---
    const getLabel = (key) => {
        if (key === 'createdBy') return 'Created By';
        if (key === 'createdAt') return 'Created Date';
        const comp = allComponents.find(c => c.key === key);
        return comp ? comp.label : key;
    };

    // --- HELPER: Clean up arrays (Checkboxes) and Objects for Export ---
    const formatExportValue = (val) => {
        if (val === undefined || val === null) return "";
        // Fix: Join arrays with commas so they don't appear as ["Item"] or [object Object]
        if (Array.isArray(val)) {
            return val.map(item => typeof item === 'object' ? item.label || item.value || JSON.stringify(item) : item).join(", "); 
        }
        if (typeof val === 'object') {
            return JSON.stringify(val);
        }
        return val;
    };

    // --- UPDATED EXCEL EXPORT ---
    const handleExportExcel = () => {
        const sheetData = [];
        sheetData.push([form.title || "Form Report", ""]);
        
        const headers = pdfLayout.headers || [];
        for (let i = 0; i < headers.length; i += 2) {
            const r = [];
            if (headers[i]) { r.push(headers[i].label); r.push(headers[i].value); }
            if (headers[i+1]) { r.push(""); r.push(headers[i+1].label); r.push(headers[i+1].value); }
            sheetData.push(r);
        }
        sheetData.push([""]); 

        // 1. Build Header Row dynamically
        const tableHeader = [];
        if (showDnColumn) tableHeader.push(dnLabel);
        columnOrder.forEach(k => tableHeader.push(getLabel(k)));
        if (showRemarksColumn) tableHeader.push("Remarks");
        
        sheetData.push(tableHeader);

        // 2. Build Data Rows dynamically
        entries.forEach(row => {
            const rData = [];
            
            if (showDnColumn) {
                rData.push(row[dnKey] || "");
            }

            columnOrder.forEach(key => {
                const conf = allComponents.find(c => c.key === key);
                let val = (conf?.type === 'calculated') ? calculateCellValue(row, conf) : row[key];
                
                // --- FIX: Map Value IDs to Labels for Select/Radio/Checkbox ---
                if (conf && (conf.type === 'select' || conf.type === 'radio' || conf.type === 'checkbox')) {
                    const options = conf.values || conf.data?.values || [];
                    if (options.length > 0) {
                        if (Array.isArray(val)) {
                            val = val.map(v => {
                                const match = options.find(opt => opt.value === v);
                                return match ? match.label : v;
                            });
                        } else {
                            const match = options.find(opt => opt.value === val);
                            if (match) val = match.label;
                        }
                    }
                }

                // USE HELPER to fix [] brackets issue and stringify objects
                rData.push(formatExportValue(val));
            });

            if (showRemarksColumn) {
                rData.push(row[remarksKey] || "");
            }

            sheetData.push(rData);
        });

        sheetData.push(["", ""]);
        
        // 3. Footer Logic (Vertical / Line-by-Line)
        (pdfLayout.footers || []).forEach(f => { 
            if (f.type === 'image') {
                // FIX: Send empty string for images in Excel to avoid "[Signature/Image]" text
                sheetData.push([""]); 
            } else {
                sheetData.push([f.value || ""]); 
            }
            // Add spacing between footer lines if needed
            sheetData.push([""]); 
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${form?.title || "Report"}_${Date.now()}.xlsx`);
    };

    // --- UPDATED PDF EXPORT ---
    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        
        doc.setFontSize(16); 
        doc.text(form.title || "Report", 14, 15);
        
        doc.setFontSize(10); doc.setFillColor(0, 176, 80); doc.rect(14, 20, 269, 7, 'F');
        doc.setTextColor(255, 255, 255); doc.text("Project Details", 16, 25); doc.setTextColor(0, 0, 0);
        
        let y = 35;
        (pdfLayout.headers || []).forEach((h, i) => {
            doc.text(`${h.label}: ${h.value || ""}`, (i % 2 === 0 ? 14 : 150), y);
            if (i % 2 !== 0) y += 6;
        });
        if ((pdfLayout.headers || []).length % 2 !== 0) y += 6;

        const pdfHeaders = [];
        if (showDnColumn) pdfHeaders.push(dnLabel);
        columnOrder.forEach(k => pdfHeaders.push(getLabel(k)));
        if (showRemarksColumn) pdfHeaders.push("Remarks");

        const body = entries.map(row => {
            const r = [];
            if (showDnColumn) r.push(row[dnKey] || "");

            columnOrder.forEach(key => {
                const conf = allComponents.find(c => c.key === key);
                let val = (conf?.type === 'calculated') ? calculateCellValue(row, conf) : row[key];

                // --- FIX: Map Value IDs to Labels for Select/Radio/Checkbox ---
                if (conf && (conf.type === 'select' || conf.type === 'radio' || conf.type === 'checkbox')) {
                    const options = conf.values || conf.data?.values || [];
                    if (options.length > 0) {
                        if (Array.isArray(val)) {
                            val = val.map(v => {
                                const match = options.find(opt => opt.value === v);
                                return match ? match.label : v;
                            });
                        } else {
                            const match = options.find(opt => opt.value === val);
                            if (match) val = match.label;
                        }
                    }
                }

                // USE HELPER here too
                r.push(formatExportValue(val));
            });

            if (showRemarksColumn) r.push(row[remarksKey] || "");
            return r;
        });

        autoTable(doc, { 
            startY: y + 10, 
            head: [pdfHeaders], 
            body: body, 
            headStyles: { fillColor: [0, 176, 80] }, 
            styles: { fontSize: 8 }, 
            theme: 'grid' 
        });
        
        let footerY = (doc.lastAutoTable?.finalY || 150) + 20;
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        
        // Footer: Line by Line (Vertical)
        (pdfLayout.footers || []).forEach((f) => {
            if (footerY > 190) { doc.addPage(); footerY = 20; }
            const x = 14; 
            
            if (f.type === 'image' && f.value && f.value.startsWith('data:image')) {
                try {
                    doc.addImage(f.value, 'PNG', x, footerY - 10, 40, 15); 
                    doc.setLineWidth(0.5); 
                    // CHANGED: Reduced line length from 60 to 40 to match image width
                    doc.line(x, footerY + 7, x + 40, footerY + 7);
                    footerY += 25; 
                } catch (err) {
                    console.error("PDF Image Error", err);
                    footerY += 10;
                }
            } else { 
                if (f.value) {
                    doc.setFont("helvetica", "normal"); 
                    doc.text(f.value, x, footerY); 
                    doc.setFont("helvetica", "bold"); 
                    footerY += 10;
                }
            }
        });
        
        doc.save(`${form?.title || "Report"}_${Date.now()}.pdf`);
    };

    const handleFormReady = useCallback((inst) => { 
        formInstanceRef.current = inst; 
    }, []);

    const activeSchema = useMemo(() => {
        if (!form?.schema) return null;
        return { 
            ...form.schema, 
            components: [...(form.schema.components || []), ...customColumns] 
        };
    }, [form, customColumns]);


    // --- 5. RENDER ---
    if (!form) return <div className="p-5 text-center text-muted">Loading configuration...</div>;

    if (!isUserSet) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100" style={{backgroundColor: "#F3F4F6"}}>
                <div className="card border-0 shadow-sm p-4" style={{width: "100%", maxWidth: "500px", borderRadius: "8px"}}>
                    <h3 className="fw-bold mb-1" style={{color: "#2c3e50"}}>Welcome</h3>
                    <p className="text-muted mb-4">Please enter your name to continue</p>
                    <form onSubmit={handleUserSubmit}>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Your Name *</label>
                            <input 
                                type="text" 
                                className="form-control form-control-lg"
                                placeholder="Enter your name"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg w-100">Continue to Form</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100" style={{ backgroundColor: "#F3F4F6", fontFamily: "'Inter', sans-serif" }}>
            <AddCalculatedColumnModal show={showCalcModal} onClose={() => setShowCalcModal(false)} onSave={(newCol) => { setCustomColumns(p => [...p, newCol]); setShowCalcModal(false); }} existingColumns={allComponents.filter(c => c.key !== dnKey && c.key !== remarksKey)} />

            <div className="bg-white border-bottom sticky-top py-3 shadow-sm" style={{ zIndex: 90 }}>
                <div className="container px-4">
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <button onClick={handleNavigationBack} className="btn btn-light border" style={{ borderRadius: "10px" }}><i className="bi bi-arrow-left"></i></button>
                            <div>
                                <h5 className="fw-bold mb-0 text-dark">{form.title}</h5>
                                <div className="d-flex align-items-center gap-2">
                                    <small className=" fw-bold text-black" style={{ fontSize: "13.5px" }}>{mode === "LIST" ? "Entries List" : mode === "ALL_DATA" ? "All Records" : "Entry Form"}</small>
                                    <span className="text-muted">•</span>
                                    <small 
                                        className="text-success cursor-pointer fw-bold" 
                                        onClick={handleEditName}
                                        title="Click to edit name"
                                        style={{cursor: "pointer"}}
                                    >
                                        <i className="bi bi-person-circle me-1"></i>{userName} <i className="bi bi-pencil-fill ms-1" style={{fontSize: "0.7rem", opacity: 0.7}}></i>
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex p-1 rounded-3 bg-light border">
                            <button className={`btn btn-sm px-3 rounded-3 border-0 ${mode === "LIST" || mode === "ADD" || mode === "EDIT" ? "bg-white shadow-sm text-primary fw-bold" : "text-muted"}`} onClick={() => setMode("LIST")}><i className="bi bi-list-ul me-2"></i> Entries</button>
                            <button className={`btn btn-sm px-3 rounded-3 border-0 ${mode === "ALL_DATA" ? "bg-white shadow-sm text-success fw-bold" : "text-muted"}`} onClick={() => setMode("ALL_DATA")}><i className="bi bi-table me-2"></i> All Data</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container px-4 py-4">
                
                {mode === "LIST" && (
                    <div className="animate-fade-in">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                             <div><h4 className="fw-bold mb-1">Entries</h4><p className="text-muted small mb-0">View all individual entries.</p></div>
                             <button className="btn btn-primary btn-sm shadow-sm rounded-3" onClick={() => { setEditingEntry(null); setFormKey(p => p + 1); setMode("ADD"); }}><i className="bi bi-plus-lg me-1"></i> New Entry</button>
                        </div>
                        
                        <DataEntryList 
                            data={entries} 
                            columnOrder={listColumnOrder} 
                            allComponents={allComponents} 
                            onEdit={(row) => { setEditingEntry({...row}); setFormKey(p => p+1); setMode("EDIT"); }} 
                        />
                    </div>
                )}

                {mode === "ALL_DATA" && (
                    <div className="animate-fade-in bg-white p-4 shadow-sm" style={{ minHeight: "800px" }}>
                        <DynamicTable 
                            data={entries} title="Master Report" formTitle={form.title} isReportMode={true}
                            columnOrder={columnOrder} 
                            allComponents={allComponents} 
                            customColumns={customColumns} 
                            projectDetails={projectDetails}
                            dnKey={dnKey} dnLabel={dnLabel} remarksKey={remarksKey}
                            onAddColumn={() => setShowCalcModal(true)} 
                            onDeleteColumn={(k) => { 
                                const newCols = customColumns.filter(c => c.key !== k);
                                setCustomColumns(newCols);
                                setColumnOrder(p => p.filter(x => x !== k)); 
                            }}
                            onColumnDrop={handleColumnDrop} onUpdateEntry={handleCellUpdate} onDeleteRow={onDeleteRow}
                            onExportExcel={handleExportExcel} onExportPDF={handleExportPDF}
                            onLayoutChange={(newLayout) => setPdfLayout(newLayout)}
                        />
                    </div>
                )}

                {(mode === "ADD" || mode === "EDIT") && (
                    <div className="d-flex justify-content-center py-4">
                        <div className="card border-0 shadow-sm w-100" style={{ maxWidth: "800px", borderRadius: "16px" }}>
                            <div className="card-header bg-white border-bottom py-3 px-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small className="text-muted fw-bold text-uppercase">{mode === "EDIT" ? "Edit Entry" : "New Entry"}</small>
                                        <h5 className="fw-bold mb-0">{form.title}</h5>
                                    </div>
                                    <button onClick={() => setMode("LIST")} className="btn btn-light rounded-circle border"><i className="bi bi-x-lg"></i></button>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <CustomFormRenderer 
                                    key={formKey} 
                                    schema={activeSchema} 
                                    initialData={mode === "EDIT" && editingEntry ? editingEntry : {}} 
                                    onFormReady={handleFormReady} 
                                />
                            </div>
                            <div className="card-footer bg-light py-3 px-4 border-top d-flex justify-content-end gap-2">
                                {mode === "ADD" && <button className="btn btn-white border" onClick={() => handleCustomSubmit('SAVE_AND_CONTINUE')}>Save & Add Another</button>}
                                <button className="btn btn-primary" onClick={() => handleCustomSubmit('SAVE_AND_EXIT')}>{mode === "EDIT" ? "Update & Finish" : "Save & Exit"}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormEntryManager;