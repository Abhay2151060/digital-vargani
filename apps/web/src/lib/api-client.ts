import { ApiResponse } from '@vargani/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('vargani_token') : null);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json();

    if (res.status === 401 || data.code === 'UNAUTHORIZED' || data.code === 'INVALID_TOKEN') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vargani_token');
        localStorage.removeItem('vargani_user');
        localStorage.removeItem('vargani_mandal');
        localStorage.removeItem('vargani_role');
        localStorage.removeItem('vargani_memberships');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      throw new ApiError(data.message || 'Session expired. Please log in again.', 'UNAUTHORIZED');
    }

    if (!res.ok || !data.success) {
      throw new ApiError(data.message || 'Request failed', data.code || 'API_ERROR', data.details);
    }

    return data.data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error, please check connection', 'NETWORK_ERROR');
  }
}

export async function downloadFile(
  endpoint: string,
  filename?: string,
  customToken?: string | null
): Promise<void> {
  const authToken =
    customToken || (typeof window !== 'undefined' ? localStorage.getItem('vargani_token') : null);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vargani_token');
        localStorage.removeItem('vargani_user');
        localStorage.removeItem('vargani_mandal');
        localStorage.removeItem('vargani_role');
        localStorage.removeItem('vargani_memberships');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED');
    }

    let errMsg = 'Failed to download file';
    try {
      const errText = await res.text();
      const parsed = JSON.parse(errText);
      if (parsed.message) errMsg = parsed.message;
    } catch {}
    throw new ApiError(errMsg, 'DOWNLOAD_FAILED');
  }

  let downloadFilename = filename;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename="?([^"]+)"?/.exec(disposition);
    if (matches && matches[1]) {
      downloadFilename = matches[1];
    }
  }
  if (!downloadFilename) {
    downloadFilename = 'export.csv';
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = downloadFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  a.remove();
}

