import React, { useState } from "react";
import { FormBuilder as FormIOBuilder } from "@formio/react";

const FormBuilder = ({ initialData, onSave, onCancel }) => {
const [title, setTitle] = useState(initialData?.title || "");
const [description, setDescription] = useState(initialData?.description || "");
const [schema, setSchema] = useState(
initialData?.schema || {
display: "form",
components: [],
}
);

const handleSaveClick = () => {
if (!title.trim()) return alert("Please enter a form title");
onSave({ title, description, schema });
};

return (
<div className="d-flex flex-column h-100 pb-5">
{/* --- CSS FIX FOR DRAG & DROP --- */}
<style>{`
/* 1. Make the Sidebar Sticky so it follows you as you scroll */
.formbuilder-sidebar, 
.formio-builder-sidebar {
position: sticky !important;
top: 80px; /* Adjusted to sit below the sticky header */
z-index: 100;
max-height: 85vh;
overflow-y: auto;
}

/* 2. Optional: Make the drop zone highlight clearer */
.formio-builder-form {
min-height: 60vh;
border: 2px dashed #e9ecef;
border-radius: 8px;
}
`}</style>

{/* Header */}
<div className="bg-white p-3 rounded shadow-sm mb-3 d-flex justify-content-between align-items-center sticky-top" style={{ zIndex: 1020, top: 0 }}>
<div>
<h5 className="mb-0 fw-bold">
{initialData ? "Edit Form Template" : "Create New Template"}
</h5>
<small className="text-muted">
Define the fields (Truck No, Qty, Slump, etc.)
</small>
</div>
<div className="d-flex gap-2">
<button className="btn btn-light border" onClick={onCancel}>
Cancel
</button>
<button className="btn btn-primary" onClick={handleSaveClick}>
Save Form
</button>
</div>
</div>

{/* Metadata */}
<div className="bg-white p-3 rounded shadow-sm mb-3">
<div className="row g-3">
<div className="col-md-6">
<label className="form-label fw-bold">Form Title</label>
<input
className="form-control"
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="e.g., Concrete Pouring Log"
/>
</div>
<div className="col-md-6">
<label className="form-label fw-bold">Description</label>
<input
className="form-control"
value={description}
onChange={(e) => setDescription(e.target.value)}
placeholder="Description..."
/>
</div>
</div>
</div>

{/* Form.IO Builder */}
<div className="card shadow-sm border-0 flex-grow-1">
<div className="card-header bg-light">
<span className="text-muted small">
<i className="bi bi-info-circle me-1"></i>
Scroll down to the bottom, and the toolbox will follow you.
</span>
</div>
<div className="card-body">
<FormIOBuilder
form={schema}
onChange={(newSchema) => setSchema(newSchema)}
// Removed the faulty 'options' prop here
/>
</div>
</div>
</div>
);
};

export default FormBuilder;
