import axios from 'axios'
import Cookies from 'js-cookie'; // 引入 js-cookie

axios.defaults.baseURL = process.env.VUE_APP_API_URL
axios.defaults.timeout = 50000

axios.interceptors.request.use(config => {
  const csrfToken = Cookies.get('csrf_token');
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;  // 或者您想使用的 header 名称
  }
  return config;
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
