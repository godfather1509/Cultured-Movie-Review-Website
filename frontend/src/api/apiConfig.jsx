const BASE_URL = "http://localhost:8080";

const api = {
  baseURL: BASE_URL,
  get: async (url, config = {}) => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {})
      }
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    const data = await response.json().catch(() => null);
    return { data, status: response.status };
  },
  post: async (url, payload, config = {}) => {
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {})
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    const data = await response.json().catch(() => null);
    return { data, status: response.status };
  }
};

export default api;
