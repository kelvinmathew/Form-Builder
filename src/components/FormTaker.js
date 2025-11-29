import React from "react";
import { Form } from "@formio/react";

const FormTaker = ({ form, onSubmit, onCancel }) => {
  if (!form) return <div>No form found</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{form.title}</h3>
        <button className="btn btn-secondary" onClick={onCancel}>
          Back to Forms
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow-sm">
        {form.description && (
          <p className="text-muted mb-4">{form.description}</p>
        )}
        <Form
          form={form.schema}
          onSubmit={(e) => onSubmit(form.id, e.data)}
        />
      </div>
    </div>
  );
};

export default FormTaker;