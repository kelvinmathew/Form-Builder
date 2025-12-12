import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Dashboard from "./components/Dashboard";
import FormBuilder from "./components/FormBuilder";
import FormEntryManager from "./components/FormEntryManager";
import PublicFormViewer from "./components/PublicFormViewer"; 
import "./App.css";

const App = () => {
  // --- STATE INITIALIZATION ---
  
  // CHANGED: Initialize view directly from localStorage to persist page on refresh
  const [view, setView] = useState(() => {
    const savedView = localStorage.getItem("app_view");
    return (savedView && savedView !== "public_view") ? savedView : "dashboard";
  });

  // CHANGED: Initialize selectedFormId directly from localStorage
  const [selectedFormId, setSelectedFormId] = useState(() => {
    const savedId = localStorage.getItem("app_selected_id");
    return savedId ? Number(savedId) : null;
  });

  // Forms Data
  const [forms, setForms] = useState(() => {
    const saved = localStorage.getItem("app_forms");
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCE & URL ROUTING ---
  useEffect(() => {
    // 1. Check URL for Public Link (e.g., /form/123456)
    const path = window.location.pathname;
    const regex = /\/form\/(\d+)/;
    const match = path.match(regex);

    if (match) {
        const formIdFromUrl = Number(match[1]);
        const foundForm = forms.find(f => f.id === formIdFromUrl);
        
        if (foundForm) {
            setSelectedFormId(formIdFromUrl);
            setView("public_view"); 
            return; 
        }
    }

    // 2. Normal Admin Flow (if no URL match)
    // REMOVED: The manual localStorage check here is no longer needed 
    // because we did it in the useState initialization above.
    
  }, [forms]); 

  // Save state only for Admin views
  useEffect(() => {
    if (view !== "public_view") {
        localStorage.setItem("app_view", view);
        if (selectedFormId) {
            localStorage.setItem("app_selected_id", selectedFormId);
        } else {
            localStorage.removeItem("app_selected_id");
        }
    }
  }, [view, selectedFormId]);

  const saveForms = (newForms) => {
    setForms(newForms);
    localStorage.setItem("app_forms", JSON.stringify(newForms));
  };

  // --- ADMIN ACTIONS ---
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
    saveForms(updatedForms);
    setView("dashboard");
    setSelectedFormId(null);
  };

  const handleDeleteForm = (id) => {
    const updatedForms = forms.filter(f => f.id !== id);
    saveForms(updatedForms);
  };

  const handleOpenManager = (id) => {
    setSelectedFormId(id);
    setView("manager");
  };

  const handleBackToDashboard = () => {
      if (view === "public_view") {
          window.history.pushState({}, "", "/"); 
      }
      setView("dashboard");
      setSelectedFormId(null);
  };

  // --- RENDER ---
  
  if (view === "public_view") {
      return (
          <PublicFormViewer 
            form={forms.find(f => f.id === selectedFormId)} 
          />
      );
  }

  // Admin View
  return (
    <div className="app-container bg-light min-vh-100">
      <nav className="navbar sticky-top bg-white border-bottom mb-4" style={{ zIndex: 1000, padding: "0.75rem 0" }}>
        <div className="px-4 px-lg-5">
          <span className="fs-4 navbar-brand d-flex align-items-center gap-2 fw-bold mb-0 text-dark" style={{ cursor: "pointer" }} onClick={handleBackToDashboard}>
            <div className="d-flex align-items-center justify-content-center rounded shadow-sm" style={{ width: "39px", height: "41px", background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", color: "white" }}>
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </div>
            FormManager
          </span>
        </div>
      </nav>

      <div>
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
            onBack={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
};

export default App;