import axios from "axios";

const initAxios = async () => {
  try {
    const response = await fetch("/config.json");
    const config = await response.json();

    const apiUrl = config.api_url || window.location.origin;

    axios.defaults.baseURL = apiUrl;
    axios.defaults.timeout = 50000;
    axios.defaults.withCredentials = true;

    axios.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error),
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error),
    );

    if (process.env.VUE_APP_DEMO_MODE === "true") {
      const { default: setupMock } = await import("@/mock/api");
      setupMock();
    }

    return axios;
  } catch (err) {
    console.error("Failed to initialize Axios:", err);
    throw err;
  }
};

const axiosInstance = await initAxios();
export default axiosInstance;