import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Dashboard from "./components/Dashboard";
import FormBuilder from "./components/FormBuilder";
import FormEntryManager from "./components/FormEntryManager";
import "./App.css";

const App = () => {
  // --- UPDATED: Initialize State from LocalStorage (Fixes Refresh Issue) ---
  
  // 1. Recover View ('dashboard', 'builder', etc.)
  const [view, setView] = useState(() => localStorage.getItem("app_view") || "dashboard");
  
  // 2. Recover Selected ID (so we know which form to show on refresh)
  const [selectedFormId, setSelectedFormId] = useState(() => {
    const savedId = localStorage.getItem("app_selected_id");
    return savedId ? Number(savedId) : null;
  });

  // 3. Recover Data immediately (Critical so FormBuilder gets data on first render)
  const [forms, setForms] = useState(() => {
    const saved = localStorage.getItem("app_forms");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [responses, setResponses] = useState(() => {
    const saved = localStorage.getItem("app_responses");
    return saved ? JSON.parse(saved) : {};
  });

  // --- Persistence Logic ---

  // UPDATED: Save View & ID whenever they change
  useEffect(() => {
    localStorage.setItem("app_view", view);
    if (selectedFormId) {
        localStorage.setItem("app_selected_id", selectedFormId);
    } else {
        localStorage.removeItem("app_selected_id");
    }
  }, [view, selectedFormId]);

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
    
    // Navigate back
    setView("dashboard");
    setSelectedFormId(null);
  };

  // 2. Delete Form
  const handleDeleteForm = (id) => {
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

  // 4. Submit New Row (Create & Bulk Save)
  const handleSubmitEntry = (data) => {
    const currentList = responses[selectedFormId] || [];
    let newItems = [];

    if (Array.isArray(data)) {
       newItems = data.map(item => ({
         ...item,
         _rowId: item._rowId || Date.now().toString() + Math.random().toString(36).substr(2, 9)
       }));
    } else {
       newItems = [{
         ...data,
         _rowId: data._rowId || Date.now().toString()
       }];
    }

    const updatedResponses = { 
      ...responses, 
      [selectedFormId]: [...currentList, ...newItems] 
    };
    saveData(null, updatedResponses);
  };

  // 5. Update Existing Row (Edit)
  const handleUpdateEntry = (updatedEntry) => {
    const currentList = responses[selectedFormId] || [];
    
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
  const handleDeleteEntry = (rowIdOrObj) => {
    const idToDelete = typeof rowIdOrObj === 'object' ? rowIdOrObj._rowId : rowIdOrObj;

    const currentList = responses[selectedFormId] || [];
    const updatedList = currentList.filter(row => row._rowId !== idToDelete);
    const updatedResponses = { 
      ...responses, 
      [selectedFormId]: updatedList 
    };
    saveData(null, updatedResponses);
  };

  // Helper to go back to dashboard safely
  const handleBackToDashboard = () => {
      setView("dashboard");
      setSelectedFormId(null);
  };

  return (
    <div className=" app-container bg-light min-vh-100">
      
      {/* Navbar */}
      <nav 
        className=" navbar sticky-top bg-white border-bottom mb-4" 
        style={{ zIndex: 1000, padding: "0.75rem 0" }}
      >
        <div className=" px-4 px-lg-5">
          <span 
            className=" fs-4 navbar-brand d-flex align-items-center gap-2 fw-bold mb-0 text-dark" 
            style={{ cursor: "pointer" }} 
            onClick={handleBackToDashboard} 
          >
            {/* Modern Logo Mark */}
            <div 
              className=" d-flex align-items-center justify-content-center rounded shadow-sm" 
              style={{ 
                width: "39px", 
                height: "41px", 
                background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", 
                color: "white" 
              }}
            >
              <i className=" bi bi-grid-3x3-gap-fill"></i>
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
            initialData={selectedFormId ? forms.find(f => f.id === selectedFormId) : null}
            onSave={handleSaveForm}
            onCancel={handleBackToDashboard}
          />
        )}

        {view === "manager" && (
          <FormEntryManager 
            form={forms.find(f => f.id === selectedFormId)}
            entries={responses[selectedFormId] || []}
            onSubmit={handleSubmitEntry}
            onUpdate={handleUpdateEntry} 
            onDeleteRow={handleDeleteEntry}
            onBack={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
};

export default App;