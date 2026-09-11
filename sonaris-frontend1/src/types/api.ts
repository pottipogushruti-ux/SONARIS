/**
 * TypeScript types mirroring the SONARIS FastAPI backend contract.
 *
 * If the backend's actual response schema differs from this file,
 * update these types (and src/services/api.ts) to match reality —
 * never patch a mismatch by inventing frontend-only fields.
 */

// ---------------------------------------------------------------------------
// Shared / enum-like unions
// ---------------------------------------------------------------------------

/** Where a detection's analysis came from. Must always be shown to the user. */
export type AnalysisMode = 'AI_INFERENCE' | 'DEMO_INFERENCE';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationDecision = 'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW';

export type VerificationStatus =
  | 'AI_DETECTED' // not yet reviewed by a human
  | 'VERIFIED_BY_OPERATOR'
  | 'REJECTED'
  | 'REQUIRES_EXPERT_REVIEW';

/** Whether a coordinate pair is real telemetry or a stand-in value. */
export type LocationSource = 'GPS' | 'SIMULATED' | 'UNAVAILABLE';

export type MissionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'DEMO';

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export interface Location {
  latitude: number | null;
  longitude: number | null;
  source: LocationSource;
}

// ---------------------------------------------------------------------------
// Preprocessing / images
// ---------------------------------------------------------------------------

export interface PreprocessingImages {
  original: string;
  denoised: string | null;
  enhanced: string | null;
  normalized: string | null;
  annotated: string | null;
}

// ---------------------------------------------------------------------------
// Model info
// ---------------------------------------------------------------------------

export interface ModelInfo {
  name: string | null;
  version: string | null;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  id: number;
  mission_id: number;
  object_label: string;
  confidence: number; // 0-1 or 0-100 depending on backend; normalize in UI layer
  risk: RiskLevel;
  status: VerificationStatus;
  analysis_mode: AnalysisMode;
  bounding_box: BoundingBox | null;
  location: Location | null;
  timestamp: string; // ISO 8601
  notes: string | null;
  image_thumbnail: string | null;
}

// ---------------------------------------------------------------------------
// Analysis result (response of POST /analyze)
// ---------------------------------------------------------------------------

export interface AnalysisResult {
  mission_id: number;
  analysis_mode: AnalysisMode;
  model: ModelInfo | null;
  images: PreprocessingImages;
  detections: Detection[];
  processing_time_ms: number | null;
  location: Location | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationRequest {
  detection_id: number;
  decision: VerificationDecision;
  notes?: string;
}

export interface VerificationResponse {
  detection_id: number;
  status: VerificationStatus;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Mission
// ---------------------------------------------------------------------------

export interface Mission {
  id: number;
  name: string | null;
  image_thumbnail: string | null;
  date: string; // ISO 8601
  analysis_mode: AnalysisMode;
  detection_count: number;
  high_risk_count: number;
  status: MissionStatus;
  location: Location | null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  sonar_images_analyzed: number;
  objects_detected: number;
  high_risk_objects: number;
  verified_detections: number;
  current_mission: string | null;
  avg_processing_time_ms: number | null;
  is_demo_data: boolean;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface Report {
  mission_id: number;
  generated_at: string;
  analysis_mode: AnalysisMode;
  summary: string | null;
  detections: Detection[];
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version?: string;
}

// ---------------------------------------------------------------------------
// Model evaluation metrics (Performance page) — only ever real numbers
// ---------------------------------------------------------------------------

export interface ModelMetrics {
  precision: number | null;
  recall: number | null;
  f1: number | null;
  map50: number | null;
  map50_95: number | null;
  inference_time_ms: number | null;
  evaluated: boolean; // false => show EVALUATION PENDING
}
