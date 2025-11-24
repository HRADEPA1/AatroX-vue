
// Type for possible value types based on dataType
type ValueType = number | boolean;

// Interface for individual measurement values
interface MeasurementValue {
    dataType: 'DInt' | 'Bool';  // Add other types as needed
    id: string;
    name: string;
    qc: number;
    ts: string;
    val: ValueType;
}

// Interface for the sequence data
interface SequenceData {
    seq: number;
    vals: MeasurementValue[];
}

export type { SequenceData, MeasurementValue, ValueType };
