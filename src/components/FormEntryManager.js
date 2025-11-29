import React, { useState, useMemo, useRef, useEffect } from "react";
import { Form } from "@formio/react";

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

const FormEntryManager = ({ form, entries, onSubmit, onUpdate, onDeleteRow, onBack }) => {
  const [mode, setMode] = useState("GROUPS");
  const [selectedDn, setSelectedDn] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const formInstanceRef = useRef(null);
  const [formKey, setFormKey] = useState(0);
  const [columnOrder, setColumnOrder] = useState([]);
  const [draggedColumn, setDraggedColumn] = useState(null);

  // --- 1. COMPONENT & SCHEMA PARSING ---
  const allComponents = useMemo(() => {
    return form?.schema?.components ? flattenComponents(form.schema.components) : [];
  }, [form]);

  // Identify Key Fields (DN Number & Remarks)
  const dnComponent = allComponents.find(c => ["delivery note", "dn no.", "dn no", "dn number"].includes(c.label?.trim().toLowerCase()));
  const dnKey = dnComponent ? dnComponent.key : "dnNumber";
  const dnLabel = dnComponent ? dnComponent.label : "DN No.";

  const remarksComponent = allComponents.find(c => c.label?.trim().toLowerCase() === "remarks");
  const remarksKey = remarksComponent ? remarksComponent.key : "remarks";

  // --- 2. MANAGE COLUMNS ---
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

  // --- 3. DATA GROUPING (Re-runs automatically when 'entries' prop changes) ---
  const groupedData = useMemo(() => {
    if (!entries) return {};
    const groups = {};
    entries.forEach((entry) => {
      // Handle cases where dnKey might be undefined in old data
      const dnValue = entry[dnKey] || "Unknown";
      if (!groups[dnValue]) groups[dnValue] = [];
      groups[dnValue].push(entry);
    });
    return groups;
  }, [entries, dnKey]);

  const dnKeys = Object.keys(groupedData);

  // --- 4. NAVIGATION HANDLER ---
  const handleNavigationBack = () => {
    if (mode === "GROUPS") {
      if (onBack) onBack();
    } else if (mode === "ADD_FORM" || mode === "EDIT_FORM") {
      selectedDn ? setMode("DN_ENTRIES") : setMode("GROUPS");
      setEditingEntry(null); // Clear editing state on back
    } else if (mode === "DN_ENTRIES" || mode === "DN_TABLE") {
      setMode("GROUPS");
    } else {
      setMode("GROUPS");
    }
  };

  // --- 5. ACTIONS ---
  const handleStartAdd = () => {
    setEditingEntry(null);
    setFormKey(prev => prev + 1); // Reset form
    setMode("ADD_FORM");
  };

  const handleDnClick = (dn) => {
    setSelectedDn(dn);
    setMode("DN_ENTRIES");
  };

  const handleEditClick = (entry) => {
    setEditingEntry({ ...entry }); // Clone to be safe
    setFormKey(prev => prev + 1);  // Force re-render of form component
    setMode("EDIT_FORM");
  };

  // --- CORE SUBMIT LOGIC ---
  const handleCustomSubmit = (actionType) => {
    if (!formInstanceRef.current) return;

    formInstanceRef.current.submit().then((submission) => {
      const submittedDn = submission.data[dnKey];
      if (!submittedDn) return alert(`${dnLabel} is required!`);

      const timestamp = new Date().toISOString();

      // ==========================================
      // UPDATE EXISTING ENTRY
      // ==========================================
      if (mode === "EDIT_FORM" && editingEntry) {

        const updatedEntry = {
          ...editingEntry,      // 1. Keep original system fields (_rowId, createdAt)
          ...submission.data,   // 2. Overwrite with new form data
          updatedAt: timestamp  // 3. Update timestamp
        };

        // Safety: Ensure _rowId is never lost
        updatedEntry._rowId = editingEntry._rowId;

        // DEBUG: Check console to see if data is merged
        console.log("Updated Entry Object:", updatedEntry);

        if (onUpdate) {
          onUpdate(updatedEntry);
        } else {
          alert("Error: onUpdate prop is missing. Data cannot be saved.");
          return;
        }

        // Navigation after update
        setSelectedDn(submittedDn); // In case DN changed
        setEditingEntry(null);      // Clear edit state
        setMode("DN_ENTRIES");

      }
      // ==========================================
      // CREATE NEW ENTRY
      // ==========================================
      else {
        const newEntry = {
          ...submission.data,
          createdAt: timestamp,
          updatedAt: timestamp,
          _rowId: Date.now().toString()
        };
        onSubmit(newEntry);

        if (actionType === 'SAVE_AND_CONTINUE') {
          setFormKey(prev => prev + 1); // Reset form for next entry
          setSelectedDn(submittedDn);
        } else {
          setSelectedDn(submittedDn);
          setMode("DN_ENTRIES");
        }
      }
    }).catch((error) => console.log("Validation failed", error));
  };

  if (!form) return <div className="p-5 text-center text-muted">Loading configuration...</div>;

  // --- 6. RENDERERS ---

  const renderEntryList = (data) => {
    const previewKeys = columnOrder.slice(0, 4);
    return (
      <div className="d-flex flex-column gap-3">
        {data.map((row, idx) => (
          <div
            key={row._rowId || idx} // Prefer _rowId for key
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

  // --- 7. MAIN RENDER ---
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
                <style>{`.hide-submit-btn .formio-component-submit { display: none !important; }`}</style>
                <div className="hide-submit-btn">
                  <Form
                    key={formKey}
                    form={form.schema}
                    submission={{ data: mode === "EDIT_FORM" ? editingEntry : (selectedDn ? { [dnKey]: selectedDn } : {}) }}
                    onFormReady={(instance) => formInstanceRef.current = instance}
                  />
                </div>
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