export const flattenComponents = (components, inputs = []) => {
    if (!components) return inputs;

    components.forEach((component) => {
        if (component.columns) {
            component.columns.forEach((col) => flattenComponents(col.components, inputs));
        } else if (component.components) {
            flattenComponents(component.components, inputs);
        }
        if (component.input && component.type !== "button" && component.key && component.type !== 'htmlelement') {
            inputs.push(component);
        }
    });

    return inputs;
};

export const calculateCellValue = (row, columnConfig) => {
    // If it's a standard input column (not calculated), return the raw data
    if (columnConfig.type !== 'calculated' || !columnConfig.targets) {
        return row[columnConfig.key];
    }

    // Retrieve values from the target columns in the current row
    const values = columnConfig.targets.map(targetKey => row[targetKey]);

    // Perform Calculation
    switch (columnConfig.formula) {
        case 'SUM':
            return values.reduce((acc, val) => {
                const num = parseFloat(val);
                return acc + (isNaN(num) ? 0 : num);
            }, 0);
        
        case 'AVERAGE':
            const sum = values.reduce((acc, val) => {
                const num = parseFloat(val);
                return acc + (isNaN(num) ? 0 : num);
            }, 0);
            return values.length ? (sum / values.length).toFixed(2) : 0;

        case 'CONCATENATE':
            return values.filter(v => v !== null && v !== undefined && v !== "").join(" ");

        case 'MERGE':
            return values.filter(v => v !== null && v !== undefined && v !== "").join(", ");

        case 'COUNT':
            return values.filter(v => v !== null && v !== "" && v !== undefined).length;

        default:
            return "-";
    }
};