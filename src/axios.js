import axios from 'axios'
import Cookies from 'js-cookie'; // 引入 js-cookie

axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.timeout = 50000

axios.interceptors.request.use(config => {
  const csrfToken = Cookies.get('csrfToken');
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }

  const deviceToken = Cookies.get('deviceToken');
  if (deviceToken && !config.url.includes('/auth')) {
    config.headers['Authorization'] = `Bearer ${deviceToken}`;
  }

  return config;
}, error => {
  return Promise.reject(error);
});

// 响应拦截器
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    return Promise.reject(error)
  }
)

export default axios
