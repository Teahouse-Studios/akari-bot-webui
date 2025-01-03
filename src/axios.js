import axios from "axios";

const initAxios = async () => {
  axios.defaults.baseURL = process.env.VUE_APP_API_URL; // 如果 config.json 没有提供 API_URL, 使用环境变量
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
};

initAxios();

export default axios;
