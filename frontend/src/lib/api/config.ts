/**
 * Dynamic API Base URL resolution.
 * Allows seamless sharing over LAN so friends accessing http://<LAN-IP>:3000
 * automatically route backend API calls to http://<LAN-IP>:8000 without hardcoding.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `http://${window.location.hostname}:8000`;
    }
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  return "http://localhost:8000";
}
