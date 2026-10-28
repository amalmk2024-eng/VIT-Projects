const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function apiFetch(path, options) {
  const response = await fetch(apiUrl(path), options);
  const text = await response.text();
  let data = null;

  if (!text) {
    throw new Error(
      `The API returned an empty response (${response.status}). Check that VITE_API_URL points to the deployed server.`
    );
  }

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `The API returned an invalid response (${response.status}). Check that VITE_API_URL points to the deployed server.`
    );
  }

  return { response, data };
}
