import React, { useState } from "react";

const FieldEditor = ({ field, onSave, onCancel }) => {
  const [editField, setEditField] = useState({ ...field });

  const handleSubmit = () => {
    if (!editField.label.trim()) {
      alert('Please enter a field label');
      return;
    }
    onSave(editField);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Field</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Label <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={editField.label}
                onChange={(e) => setEditField({ ...editField, label: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Placeholder</label>
              <input
                type="text"
                className="form-control"
                value={editField.placeholder || ''}
                onChange={(e) => setEditField({ ...editField, placeholder: e.target.value })}
              />
            </div>

            {['select', 'radio', 'checkbox'].includes(editField.type) && (
              <div className="mb-3">
                <label className="form-label fw-bold">Options (one per line)</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={(editField.options || []).join('\n')}
                  onChange={(e) => setEditField({ ...editField, options: e.target.value.split('\n').filter(o => o.trim()) })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}

            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="required"
                checked={editField.required || false}
                onChange={(e) => setEditField({ ...editField, required: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="required">
                Required Field
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;