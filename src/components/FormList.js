import React from "react";

const FormList = ({ forms, responses, onCreateNew, onOpenForm, onEditForm, onViewResponses, onDeleteForm }) => {
  const handleCopyLink = (formId) => {
    const link = `${window.location.origin}/take-form/${formId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert(`Link copied: ${link}`);
    });
  };

  const getResponseCount = (formId) => {
    return responses[formId]?.length || 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Clean Professional Header */}
      <div 
        className="rounded shadow-sm mb-4" 
        style={{
          background: "white",
          padding: "32px",
          borderBottom: "3px solid #6366f1"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-2" style={{ fontWeight: "700", color: "#0f172a", fontSize: "32px", letterSpacing: "-0.5px" }}>
              <i className="bi bi-list-check me-3" style={{ color: "#6366f1" }}></i>Forms Dashboard
            </h1>
            <p className="mb-0" style={{ fontSize: "15px", color: "#64748b" }}>
              Create, manage, and track responses for all your forms
            </p>
          </div>
          <button 
            className="btn d-flex align-items-center gap-2"
            onClick={onCreateNew}
            style={{ 
              background: "#6366f1",
              color: "white",
              border: "none",
              fontWeight: "600",
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "15px",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4f46e5";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6366f1";
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
          >
            <i className="bi bi-plus-circle-fill"></i> New Form
          </button>
        </div>
      </div>

      {/* Beautiful Empty State */}
      {forms.length === 0 ? (
        <div 
          className="bg-white rounded shadow-sm text-center" 
          style={{ 
            padding: "80px 40px",
            border: "2px dashed #cbd5e1",
            borderRadius: "16px"
          }}
        >
          <div 
            style={{
              width: "120px",
              height: "120px",
              margin: "0 auto 24px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.25)"
            }}
          >
            <i className="bi bi-clipboard-data" style={{ fontSize: "48px", color: "white" }}></i>
          </div>
          <h3 className="mb-2" style={{ color: "#1e293b", fontWeight: "700" }}>Start Creating Forms</h3>
          <p className="text-muted mb-4" style={{ fontSize: "15px", maxWidth: "450px", margin: "16px auto 32px", lineHeight: "1.6" }}>
            Build engaging forms to collect feedback, conduct surveys, and gather valuable insights from your audience
          </p>
          <button 
            className="btn"
            onClick={onCreateNew}
            style={{ 
              background: "#6366f1",
              color: "white",
              border: "none",
              padding: "12px 32px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "15px"
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>Create First Form
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {forms.map((form) => (
            <div 
              key={form.id} 
              className="bg-white rounded shadow-sm"
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                transition: "all 0.3s ease",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "#c7d2fe";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-3 mb-1">
                      <h4 className="mb-0" style={{ color: "#0f172a", fontWeight: "700", fontSize: "18px" }}>
                        {form.title}
                      </h4>
                      <span 
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "20px",
                          background: "#dcfce7",
                          color: "#15803d",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <i className="bi bi-circle-fill" style={{ fontSize: "6px" }}></i>
                        Active
                      </span>
                      <span 
                        style={{ 
                          fontSize: "13px", 
                          color: "#64748b",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <i className="bi bi-people-fill" style={{ color: "#a78bfa" }}></i>
                        {getResponseCount(form.id)} responses
                      </span>
                    </div>
                    <p className="mb-2" style={{ fontSize: "14px", lineHeight: "1.4", color: "#475569", margin: 0 }}>
                      {form.description || "No description available"}
                    </p>
                    <div className="d-flex gap-4">
                      <small className="d-flex align-items-center gap-1" style={{ fontSize: "12px", color: "#94a3b8" }}>
                        <i className="bi bi-calendar-event"></i> {form.createdAt}
                      </small>
                      <small className="d-flex align-items-center gap-1" style={{ fontSize: "12px", color: "#94a3b8" }}>
                        <i className="bi bi-clock"></i> {form.updatedAt}
                      </small>
                    </div>
                  </div>
                </div>
                
                <div className="d-flex gap-2 align-items-center flex-shrink-0 ms-3">
                  {/* Take Form - Muted Teal */}
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    onClick={() => onOpenForm(form.id)}
                    style={{ 
                      background: "#14b8a6",
                      color: "white",
                      border: "none",
                      fontSize: "13px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#0d9488"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#14b8a6"}
                  >
                    <i className="bi bi-play-circle-fill"></i> Take
                  </button>

                  {/* Edit - Muted Indigo */}
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    onClick={() => onEditForm(form.id)}
                    style={{ 
                      background: "#6366f1",
                      color: "white",
                      border: "none",
                      fontSize: "13px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#4f46e5"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#6366f1"}
                  >
                    <i className="bi bi-pencil-square"></i> Edit
                  </button>

                  {/* Copy Link - Muted Slate */}
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    onClick={() => handleCopyLink(form.id)}
                    style={{ 
                      background: "#64748b",
                      color: "white",
                      border: "none",
                      fontSize: "13px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#475569"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#64748b"}
                  >
                    <i className="bi bi-link-45deg"></i> Link
                  </button>

                  {/* Responses - Muted Violet */}
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    onClick={() => onViewResponses(form.id)}
                    style={{ 
                      background: "#8b5cf6",
                      color: "white",
                      border: "none",
                      fontSize: "13px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#7c3aed"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#8b5cf6"}
                  >
                    <i className="bi bi-bar-chart-line-fill"></i> Results
                  </button>

                  {/* Delete - Muted Rose */}
                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    onClick={() => onDeleteForm(form.id)}
                    style={{ 
                      background: "#e11d48",
                      color: "white",
                      border: "none",
                      fontSize: "13px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#e11d48"}
                  >
                    <i className="bi bi-trash3-fill"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormList;