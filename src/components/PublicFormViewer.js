import React, { useState, useRef, useEffect } from "react";
import Cookies from 'js-cookie';
import CustomFormRenderer from './CustomFormRenderer';
import { apiService } from '../services/apiService'; 

const PublicFormViewer = ({ form }) => {
    // --- STATE ---
    const [userName, setUserName] = useState("");
    const [isUserSet, setIsUserSet] = useState(false);
    const [tempName, setTempName] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formKey, setFormKey] = useState(0); // To force re-render on new submission
    
    const formInstanceRef = useRef(null);

    // --- EFFECT: CHECK COOKIES FOR NAME ---
    useEffect(() => {
        const savedName = Cookies.get('formUser');
        if (savedName) { 
            setUserName(savedName); 
            setIsUserSet(true); 
        }
    }, []);

    const handleFormReady = (inst) => {
        formInstanceRef.current = inst;
    };

    // --- HANDLER: SET NAME ---
    const handleStartSession = () => {
        if (!tempName.trim()) return;
        Cookies.set('formUser', tempName, { expires: 7 });
        setUserName(tempName);
        setIsUserSet(true);
    };

    // --- HANDLER: SUBMIT FORM ---
    const handleSubmit = () => {
        if (!formInstanceRef.current) return;

        formInstanceRef.current.submit().then(async (submission) => {
            const payload = {
                entry_data: submission.data,
                created_by: userName
            };

            try {
                // Submit to the SAME API used by the admin panel
                await apiService.createEntry(payload);
                setIsSubmitted(true);
            } catch (error) {
                console.error("Submission failed", error);
                alert("Failed to save entry. Please try again.");
            }
        }).catch((err) => console.log("Validation failed", err));
    };

    const handleReset = () => {
        setIsSubmitted(false);
        setFormKey(prev => prev + 1); // Reset form
    };

    // --- VIEW: LOADING / ERROR ---
    if (!form) return <div className="min-vh-100 d-flex align-items-center justify-content-center">Form not found or deleted.</div>;

    // --- VIEW: NAME INPUT ---
    if (!isUserSet) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{ backgroundColor: "#F3F4F6" }}>
            <div className="card shadow border-0 rounded-4 p-4" style={{ maxWidth: '400px', width: '90%' }}>
                <div className="text-center mb-4">
                    <h5 className="fw-bold text-dark">{form.title}</h5>
                    <p className="text-muted small">Public Data Entry</p>
                </div>
                <div className="mb-3">
                    <label className="form-label small fw-bold">Enter your name to continue</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="John Doe" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStartSession()}
                    />
                </div>
                <button 
                    className="btn btn-primary w-100 fw-bold rounded-3" 
                    onClick={handleStartSession}
                    disabled={!tempName.trim()}
                >
                    Start Entry
                </button>
            </div>
        </div>
    );

    // --- VIEW: SUCCESS MESSAGE ---
    if (isSubmitted) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white">
            <div className="text-center p-5 animate-fade-in">
                <div className="mb-3 text-success bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-check-lg fs-1"></i>
                </div>
                <h2 className="fw-bold mb-2">Thank You!</h2>
                <p className="text-muted mb-4">Your entry for <strong>{form.title}</strong> has been submitted.</p>
                <button className="btn btn-outline-primary rounded-pill px-4" onClick={handleReset}>
                    Submit Another Response
                </button>
            </div>
        </div>
    );

    // --- VIEW: FORM RENDERER ---
    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom p-4">
                        <h4 className="fw-bold mb-1">{form.title}</h4>
                        <p className="text-muted mb-0 small">{form.description || "Please fill out the details below."}</p>
                    </div>
                    <div className="card-body p-4">
                        <CustomFormRenderer 
                            key={formKey}
                            schema={form.schema}
                            initialData={{}}
                            onFormReady={handleFormReady}
                        />
                    </div>
                    <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
                        <small className="text-muted">Logged in as <strong>{userName}</strong></small>
                        <button className="btn btn-primary px-4 rounded-3 fw-bold" onClick={handleSubmit}>
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicFormViewer;