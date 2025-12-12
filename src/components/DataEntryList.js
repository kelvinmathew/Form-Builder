import React, { useState, useMemo } from 'react';

const DataEntryList = ({ data, columnOrder, allComponents, onEdit, onDelete }) => {
    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // --- PAGINATION LOGIC ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- PREVIEW KEY LOGIC ---
    const previewKeys = useMemo(() => {
        const userSelectedKeys = allComponents
            .filter(comp => comp.showInList === true)
            .map(comp => comp.key);

        if (userSelectedKeys.length > 0) {
            return userSelectedKeys;
        }
        return columnOrder.slice(0, 4);
    }, [allComponents, columnOrder]);

    const fontStyleText = { fontSize: "14px", color: "#374151" };
    const headerStyle = { fontSize: '15px', color: '#111827', fontWeight: '700' };

    return (
        // Changed width to 100% to fit mobile screens, but kept max-width for desktop look
        <div className="d-flex flex-column gap-3" style={{ width: '100%', maxWidth: '610px' }}>
            
            {/* List Meta Header */}
            {data.length > 0 && (
                <div className="d-flex justify-content-end px-2 mb-1">
                    <span className="text-muted small">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            )}

            {/* TABLE CONTAINER */}
            <div className="table-responsive bg-white rounded-3 shadow-sm border">
                <table className="table table-hover align-middle mb-0 w-100">
                    <thead className="bg-light border-bottom">
                        <tr>
                            {/* ID Header */}
                            <th className="py-3 text-center" style={{ ...headerStyle, width: '60px' }}>#</th>
                            
                            {/* Date Header */}
                            <th className="py-3 ps-3" style={{ ...headerStyle, width: '150px' }}>Date</th>
                            
                            {/* Dynamic Headers */}
                            {previewKeys.map(key => {
                                const comp = allComponents.find(c => c.key === key);
                                return (
                                    <th 
                                        key={key} 
                                        className="py-3 px-2 text-capitalize" 
                                        style={{ ...headerStyle, width: 'auto', minWidth: '100px', maxWidth: '200px' }}
                                    >
                                        {comp?.label || key}
                                    </th>
                                );
                            })}
                            
                            {/* Action Header */}
                            <th className="py-3 text-start ps-2" style={{ ...headerStyle }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((row, idx) => {
                            const absoluteRowNumber = indexOfFirstItem + idx + 1;
                            const isDraft = row._isDraft;

                            return (
                                <tr key={row._rowId || idx} style={{ cursor: 'pointer' }} onClick={() => onEdit(row)}>
                                    
                                    {/* ID COLUMN */}
                                    <td className="text-center">
                                        <div 
                                            className={`badge ${isDraft ? 'bg-warning text-dark' : 'bg-primary bg-opacity-10 text-primary'} rounded-pill px-2 py-1`} 
                                            style={{
                                                fontSize: '11px', 
                                                fontWeight: '600',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            {isDraft ? 'DRAFT' : `#${absoluteRowNumber}`}
                                        </div>
                                    </td>

                                    {/* DATE COLUMN */}
                                    <td className="ps-3">
                                        <div className="d-flex align-items-center" style={fontStyleText}>
                                            <i className="bi bi-calendar4 me-2 text-muted" style={{ fontSize: '14px' }}></i>
                                            <span className="fw-medium" style={{ fontSize: '14px' }}>
                                                {/* FIXED: Split by 'T' to handle ISO date format correctly */}
                                                {row.createdAt ? row.createdAt.split('T')[0] : '-'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* DYNAMIC COLUMNS */}
                                    {previewKeys.map(key => {
                                        const comp = allComponents.find(c => c.key === key);
                                        let displayVal = row[key];

                                        if (comp && (comp.type === 'select' || comp.type === 'radio' || comp.type === 'checkbox')) {
                                            const options = comp.values || comp.data?.values || [];
                                            if (options.length > 0) {
                                                if (Array.isArray(displayVal)) {
                                                    displayVal = displayVal.map(val => {
                                                        const match = options.find(opt => opt.value === val);
                                                        return match ? match.label : val;
                                                    }).join(", ");
                                                } else {
                                                    const match = options.find(opt => opt.value === displayVal);
                                                    if (match) displayVal = match.label;
                                                }
                                            }
                                        }

                                        return (
                                            <td key={key} className="px-2">
                                                <div className="text-truncate" style={{ ...fontStyleText, maxWidth: '200px' }}>
                                                    {displayVal ? displayVal : <span className="text-muted opacity-25">-</span>}
                                                </div>
                                            </td>
                                        );
                                    })}

                                    {/* ACTION COLUMN */}
                                    <td className="text-start ps-2">
                                        <div className="d-flex align-items-center justify-content-start gap-2">
                                            {/* Edit Button */}
                                            <button 
                                                className="btn btn-sm btn-light border-0 text-primary rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: "32px", height: "32px" }}
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    onEdit(row);
                                                }}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-square" style={{ fontSize: '14px' }}></i>
                                            </button>

                                            {/* Delete Button */}
                                            <button 
                                                className="btn btn-sm btn-light border-0 text-danger rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: "32px", height: "32px" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(row); 
                                                }}
                                                title="Delete"
                                            >
                                                <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={previewKeys.length + 3} className="text-center py-5">
                                    <div className="text-muted opacity-50 mb-2"><i className="bi bi-inbox fs-1"></i></div>
                                    <h6 className="text-muted small fw-bold">No entries found</h6>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            {data.length > 0 && (
              <div className="d-flex justify-content-center align-items-center mt-4 gap-2 flex-wrap">
                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ borderRadius: "8px", height: "30px", width: "30px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: '12px' }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                {/* Wrapper for numbers to allow wrapping on very small screens */}
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`btn shadow-sm fw-semibold ${currentPage === i + 1 ? 'text-white' : 'text-dark bg-white border'}`}
                        style={{
                        borderRadius: "8px",
                        backgroundColor: currentPage === i + 1 ? "#4F46E5" : "#fff",
                        width: "30px",
                        height: "30px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: '12px'
                        }}
                    >
                        {i + 1}
                    </button>
                    ))}
                </div>

                <button
                  className="btn btn-white border shadow-sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ borderRadius: "8px", height: "30px", width: "30px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: '12px' }}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
        </div>
    );
};

export default DataEntryList;