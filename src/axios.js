import axios from "axios";

const initAxios = async () => {
  try {
    const response = await fetch("/config.json");
    const config = await response.json();

    const apiUrl = config.api_url || window.location.hostname;

    axios.defaults.baseURL = apiUrl;
    axios.defaults.timeout = 50000;
    axios.defaults.withCredentials = true;

    axios.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    return axios;
  } catch (err) {
    console.error("Failed to initialize Axios:", err);
    throw err;
  }
};

const axiosInstance = await initAxios();
export default axiosInstance;
