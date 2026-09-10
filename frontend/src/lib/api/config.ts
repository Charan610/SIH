/**
 * Dynamic API Base URL resolution.
 * Allows seamless sharing over LAN so friends accessing http://<LAN-IP>:3000
 * automatically route backend API calls to http://<LAN-IP>:8000 without hardcoding.
 */
export function getApiBaseUrl(): string {
  // Explicitly configured public API URL (e.g. deployed backend on Render/Railway/EC2)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }

  // Dynamic LAN IP resolution for local testing (e.g. 192.168.x.x)
  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    const isLocalIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
    if (isLocalIp && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }

  return "http://localhost:8000";
}
