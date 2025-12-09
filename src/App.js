import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Dashboard from "./components/Dashboard";
import FormBuilder from "./components/FormBuilder";
import FormEntryManager from "./components/FormEntryManager";
import "./App.css";

const App = () => {
  // Views: 'dashboard', 'builder', 'manager'
  const [view, setView] = useState("dashboard");
  
  // Data State
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState({});
  const [selectedFormId, setSelectedFormId] = useState(null);

  // --- Persistence Logic ---
  useEffect(() => {
    const savedForms = localStorage.getItem("app_forms");
    const savedResponses = localStorage.getItem("app_responses");
    if (savedForms) setForms(JSON.parse(savedForms));
    if (savedResponses) setResponses(JSON.parse(savedResponses));
  }, []);

  const saveData = (newForms, newResponses) => {
    if (newForms) {
      setForms(newForms);
      localStorage.setItem("app_forms", JSON.stringify(newForms));
    }
    if (newResponses) {
      setResponses(newResponses);
      localStorage.setItem("app_responses", JSON.stringify(newResponses));
    }
  };

  // --- Actions ---

  // 1. Create/Edit Form
  const handleOpenBuilder = (formId = null) => {
    setSelectedFormId(formId);
    setView("builder");
  };

  const handleSaveForm = (formData) => {
    let updatedForms;
    if (selectedFormId) {
      updatedForms = forms.map(f => f.id === selectedFormId ? { ...formData, id: selectedFormId } : f);
    } else {
      updatedForms = [...forms, { ...formData, id: Date.now(), createdAt: new Date().toLocaleDateString() }];
    }
    saveData(updatedForms, null);
    setView("dashboard");
  };

  // 2. Delete Form
  const handleDeleteForm = (id) => {
    // Dashboard handles the confirmation modal now
    const updatedForms = forms.filter(f => f.id !== id);
    const updatedResponses = { ...responses };
    delete updatedResponses[id];
    saveData(updatedForms, updatedResponses);
  };

  // 3. Open Entry Manager (The "Page 2")
  const handleOpenManager = (id) => {
    setSelectedFormId(id);
    setView("manager");
  };

  // 4. Submit New Row (Create)
  const handleSubmitEntry = (data) => {
    const currentList = responses[selectedFormId] || [];
    const newRow = { ...data, _rowId: data._rowId || Date.now().toString() }; 
    const updatedResponses = { 
      ...responses, 
      [selectedFormId]: [...currentList, newRow] 
    };
    saveData(null, updatedResponses);
  };

  // 5. Update Existing Row (Edit)
  const handleUpdateEntry = (updatedEntry) => {
    const currentList = responses[selectedFormId] || [];
    
    // Map through list and replace the specific row by ID
    const updatedList = currentList.map((row) => 
      row._rowId === updatedEntry._rowId ? updatedEntry : row
    );

    const updatedResponses = { 
      ...responses, 
      [selectedFormId]: updatedList 
    };
    saveData(null, updatedResponses);
  };

  // 6. Delete Row (Entry)
  const handleDeleteEntry = (rowId) => {
    const currentList = responses[selectedFormId] || [];
    const updatedList = currentList.filter(row => row._rowId !== rowId);
    const updatedResponses = { 
      ...responses, 
      [selectedFormId]: updatedList 
    };
    saveData(null, updatedResponses);
  };

  return (
    <div className="app-container bg-light min-vh-100">
      
      {/* Navbar */}
      <nav 
        className="navbar sticky-top bg-white border-bottom mb-4" 
        style={{ zIndex: 1000, padding: "0.75rem 0" }}
      >
        <div className=" px-4 px-lg-5">
          <span 
            className="navbar-brand d-flex align-items-center gap-2 fw-bold mb-0 text-dark" 
            style={{ cursor: "pointer" }} 
            onClick={() => setView("dashboard")}
          >
            {/* Modern Logo Mark */}
            <div 
              className="d-flex align-items-center justify-content-center rounded shadow-sm" 
              style={{ 
                width: "38px", 
                height: "41px", 
                background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", // Indigo gradient
                color: "white" 
              }}
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </div>
            
            FormManager
          </span>
        </div>
      </nav>

      <div className="">
        {view === "dashboard" && (
          <Dashboard 
            forms={forms} 
            onCreate={() => handleOpenBuilder(null)}
            onEdit={handleOpenBuilder}
            onDelete={handleDeleteForm}
            onOpen={handleOpenManager}
          />
        )}

        {view === "builder" && (
          <FormBuilder 
            initialData={forms.find(f => f.id === selectedFormId)}
            onSave={handleSaveForm}
            onCancel={() => setView("dashboard")}
          />
        )}

        {view === "manager" && (
          <FormEntryManager 
            form={forms.find(f => f.id === selectedFormId)}
            entries={responses[selectedFormId] || []}
            onSubmit={handleSubmitEntry}
            onUpdate={handleUpdateEntry} 
            onDeleteRow={handleDeleteEntry}
            onBack={() => setView("dashboard")}
          />
        )}
      </div>
    </div>
  );
};

export default App;