import React, { useState } from "react";

const FormResponsesViewer = ({ form, formResponses, onBack }) => {
  const [columns, setColumns] = useState(() => {
    if (formResponses.length === 0) return [];
    const allKeys = Object.keys(formResponses[0]);

    // ✅ HIDE SUBMIT COLUMN HERE
    const visibleKeys = allKeys.filter(key => key.toLowerCase() !== "submit");

    return visibleKeys.map((key, index) => ({ id: key, label: key, order: index }));
  });

  const [customColumns, setCustomColumns] = useState([]);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [draggedColumn, setDraggedColumn] = useState(null);

  const exportToJSON = () => {
    const dataStr = JSON.stringify(formResponses, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.title}-responses.json`;
    link.click();
  };

  const exportToPDF = () => {
    alert("PDF export functionality - requires additional library");
  };

  const exportToExcel = () => {
    alert("Excel export functionality - requires additional library");
  };

  const handleAddCustomColumn = () => {
    if (!newColumnName.trim()) return;

    const newCol = { 
      id: `custom_${Date.now()}`, 
      label: newColumnName, 
      order: columns.length, 
      isCustom: true 
    };

    setColumns([...columns, newCol]);
    setCustomColumns([...customColumns, newCol]);
    setNewColumnName("");
    setShowAddColumn(false);
  };

  const handleDragStart = (e, column) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn.id === targetColumn.id) return;

    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex(col => col.id === draggedColumn.id);
    const targetIndex = newColumns.findIndex(col => col.id === targetColumn.id);

    newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);

    setColumns(newColumns.map((col, idx) => ({ ...col, order: idx })));
    setDraggedColumn(null);
  };

  const allColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="mb-3">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> Back to Forms
        </button>
      </div>

      <div className="bg-white rounded shadow-sm p-4 mb-3">
        <h3 className="mb-1">{form.title}</h3>
        <p className="text-muted mb-0">Total responses: {formResponses.length}</p>
      </div>

      {formResponses.length === 0 ? (
        <div className="alert alert-info">No responses yet.</div>
      ) : (
        <>
          <div className="bg-white rounded shadow-sm p-3 mb-3">
            <div className="d-flex gap-2">
              <button className="btn btn-success btn-sm" onClick={exportToExcel}>
                <i className="bi bi-file-earmark-excel"></i> Export to Excel
              </button>
              <button className="btn btn-danger btn-sm" onClick={exportToPDF}>
                <i className="bi bi-file-earmark-pdf"></i> Export to PDF
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddColumn(!showAddColumn)}
              >
                <i className="bi bi-plus-circle"></i> Add Custom Column
              </button>
            </div>

            {showAddColumn && (
              <div className="mt-3 d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Enter column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomColumn()}
                />
                <button className="btn btn-success btn-sm" onClick={handleAddCustomColumn}>
                  Add
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddColumn(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded shadow-sm p-3">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead style={{ backgroundColor: "#34495e", color: "white" }}>
                  <tr>
                    <th style={{ width: "50px" }}>#</th>
                    {allColumns.map((col) => (
                      <th
                        key={col.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, col)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col)}
                        style={{ cursor: "move", userSelect: "none" }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-grip-vertical"></i>
                          {col.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {formResponses.map((resp, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>

                      {allColumns.map((col) => (
                        <td key={col.id}>
                          {col.isCustom ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="-"
                            />
                          ) : (
                            typeof resp[col.id] === "object"
                              ? JSON.stringify(resp[col.id])
                              : (resp[col.id] || "-")
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FormResponsesViewer;
