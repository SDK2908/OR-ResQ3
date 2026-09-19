export interface ProcedureProfile {
  name: string;
  category: string;
  baseAvg: number;
  minHist: number;
  maxHist: number;
  typicalSpecialty: string;
  urgencyAllowed: boolean;
}

export interface SurgeryCase {
  id: string;
  patientName: string;
  patientId: string;
  procedureType: string;
  surgeon: string;
  surgeonExperience: number; // in years
  patientComplexity: number; // 1 to 5
  historicalAverage: number; // in minutes
  durationMinutes: number; // in minutes
  durationSource: 'ml_model' | 'historical_average' | 'scheduled';
  orId: string; // e.g. "OR 1"
  startTime: string; // "HH:MM" 24hr format
  endTime: string; // "HH:MM"
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY_CRITICAL';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  isEmergency?: boolean;
}

export interface OperatingRoom {
  id: string;
  name: string;
  suite: string;
  specialties: string[];
  status: 'OPERATIONAL' | 'EMERGENCY_OCCUPIED' | 'MAINTENANCE';
}

export interface EmergencyCaseInput {
  patientName: string;
  procedureType: string;
  surgeon: string;
  surgeonExperience: number;
  patientComplexity: number;
  historicalAverage: number;
  targetOrId: string; // e.g. "OR 1" or "ANY"
  arrivalTime: string; // "HH:MM"
  useML: boolean; // toggle to demonstrate resilient fallback
}

export interface ScheduleChange {
  caseId: string;
  patientName: string;
  procedureType: string;
  type: 'EMERGENCY_INSERTED' | 'PRESERVED' | 'DELAYED' | 'REASSIGNED_OR' | 'POSTPONED';
  originalOr: string;
  newOr: string;
  originalStart: string;
  newStart: string;
  originalEnd: string;
  newEnd: string;
  delayMinutes: number;
  explanation: string;
}

export interface RecoveryPlan {
  id: string;
  timestamp: string;
  emergencyCase: SurgeryCase;
  originalSchedule: SurgeryCase[];
  recoveredSchedule: SurgeryCase[];
  stats: {
    totalProcedures: number;
    preservedCount: number;
    delayedCount: number;
    reassignedCount: number;
    totalDelayMinutes: number;
    emergencyDurationMinutes: number;
    durationSource: 'ml_model' | 'historical_average';
  };
  changes: ScheduleChange[];
}

export interface MLMetricsData {
  modelType: string;
  nEstimators: number;
  randomState: number;
  datasetSamples: number;
  trainSamples: number;
  testSamples: number;
  features: string[];
  target: string;
  metrics: {
    MAE_minutes: number;
    RMSE_minutes: number;
    R2_score: number;
  };
  metricExplanations: {
    MAE: string;
    RMSE: string;
    R2: string;
  };
}

export interface PredictionPayload {
  procedure_type: string;
  surgeon_experience: number;
  patient_complexity: number;
  historical_average: number;
}

export interface PredictionResponse {
  predicted_duration: number;
  baseline_delta?: number;
  confidence?: string;
}
