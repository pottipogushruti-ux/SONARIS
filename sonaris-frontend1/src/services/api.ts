import axios, { AxiosError } from 'axios';
import type {
  AnalysisResult,
  DashboardStats,
  Detection,
  HealthStatus,
  Mission,
  ModelMetrics,
  Report,
  VerificationRequest,
  VerificationResponse,
} from '../types/api';

/**
 * Single axios instance + single source of truth for every backend call.
 * No component should call axios/fetch directly — everything routes
 * through the functions exported here.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

/** Normalized error shape the UI layer can render without leaking internals. */
export class SonarisApiError extends Error {
  kind:
    | 'OFFLINE'
    | 'TIMEOUT'
    | 'VALIDATION'
    | 'NOT_FOUND'
    | 'SERVER'
    | 'UNKNOWN';
  status?: number;

  constructor(message: string, kind: SonarisApiError['kind'], status?: number) {
    super(message);
    this.name = 'SonarisApiError';
    this.kind = kind;
    this.status = status;
  }
}

function normalizeError(error: unknown): SonarisApiError {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ detail?: string; message?: string }>;

    if (err.code === 'ECONNABORTED') {
      return new SonarisApiError(
        'The request to the SONARIS backend timed out. Please try again.',
        'TIMEOUT'
      );
    }

    if (!err.response) {
      return new SonarisApiError(
        'SONARIS backend is unavailable. Please ensure the FastAPI server is running.',
        'OFFLINE'
      );
    }

    const status = err.response.status;
    const detail = err.response.data?.detail || err.response.data?.message;

    if (status === 404) {
      return new SonarisApiError(detail || 'The requested resource was not found.', 'NOT_FOUND', status);
    }
    if (status === 422 || status === 400) {
      return new SonarisApiError(detail || 'The submitted data was invalid.', 'VALIDATION', status);
    }
    if (status >= 500) {
      return new SonarisApiError(
        detail || 'The SONARIS backend encountered an internal error.',
        'SERVER',
        status
      );
    }
    return new SonarisApiError(detail || 'An unexpected error occurred.', 'UNKNOWN', status);
  }

  return new SonarisApiError('An unexpected error occurred.', 'UNKNOWN');
}

async function request<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw normalizeError(error);
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export function getHealth(): Promise<HealthStatus> {
  return request(async () => (await apiClient.get<HealthStatus>('/health')).data);
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface AnalyzeOptions {
  demo?: boolean;
  onUploadProgress?: (percent: number) => void;
}

export function analyzeSonar(file: File, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.demo) {
    formData.append('mode', 'demo');
  }

  return request(async () => {
    const res = await apiClient.post<AnalysisResult>('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (options.onUploadProgress && evt.total) {
          options.onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return res.data;
  });
}

// ---------------------------------------------------------------------------
// Detections
// ---------------------------------------------------------------------------

export interface DetectionFilters {
  search?: string;
  risk?: string;
  status?: string;
  mission_id?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export function getDetections(filters: DetectionFilters = {}): Promise<Detection[]> {
  return request(async () => (await apiClient.get<Detection[]>('/detections', { params: filters })).data);
}

export function getDetection(id: number): Promise<Detection> {
  return request(async () => (await apiClient.get<Detection>(`/detections/${id}`)).data);
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export function getMissions(): Promise<Mission[]> {
  return request(async () => (await apiClient.get<Mission[]>('/missions')).data);
}

export function getMission(id: number): Promise<Mission> {
  return request(async () => (await apiClient.get<Mission>(`/missions/${id}`)).data);
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export function verifyDetection(
  id: number,
  decision: VerificationRequest['decision'],
  notes?: string
): Promise<VerificationResponse> {
  return request(async () => {
    const body: VerificationRequest = { detection_id: id, decision, notes };
    return (await apiClient.post<VerificationResponse>('/verify', body)).data;
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function getReport(id: number): Promise<Report> {
  return request(async () => (await apiClient.get<Report>(`/report/${id}`)).data);
}

export function getReportFileUrl(id: number, format: 'csv' | 'json' | 'pdf'): string {
  if (format === 'csv') return `${API_BASE_URL}/report/${id}/csv`;
  if (format === 'json') return `${API_BASE_URL}/report/${id}/json`;
  return `${API_BASE_URL}/report/${id}`;
}

async function downloadBlob(url: string, filename: string): Promise<void> {
  return request(async () => {
    const res = await apiClient.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  });
}

export function downloadPDF(id: number): Promise<void> {
  return downloadBlob(`/report/${id}`, `sonaris-report-${id}.pdf`);
}

export function downloadCSV(id: number): Promise<void> {
  return downloadBlob(`/report/${id}/csv`, `sonaris-report-${id}.csv`);
}

export function downloadJSON(id: number): Promise<void> {
  return downloadBlob(`/report/${id}/json`, `sonaris-report-${id}.json`);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function getDashboardStats(): Promise<DashboardStats> {
  return request(async () => (await apiClient.get<DashboardStats>('/dashboard/stats')).data);
}

// ---------------------------------------------------------------------------
// Model metrics (Performance page) — optional endpoint; caller must
// treat a failed/empty call as "no genuine evaluation exists" and
// render EVALUATION PENDING rather than fabricating numbers.
// ---------------------------------------------------------------------------

export function getModelMetrics(): Promise<ModelMetrics> {
  return request(async () => (await apiClient.get<ModelMetrics>('/model/metrics')).data);
}
