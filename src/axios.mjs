import axios from 'axios'
import { IS_DEMO } from './const'
import setupMock from '@/mock/api'
import LocalStorageJson from '@/localStorageJson.js'

const initAxios = () => {
  // 固定使用同源地址：WebUI 与服务端同域部署，无需跨域；
  // 若将来需要独立 API 域名，可改为读取 /config.json 的 api_url
  const apiUrl = window.location.origin

  axios.defaults.baseURL = apiUrl
  axios.defaults.timeout = 50000
  axios.defaults.withCredentials = true

  axios.interceptors.request.use(
    (config) => {
      if (LocalStorageJson.getItem('token')) {
        config.headers.Authorization = `Bearer ${LocalStorageJson.getItem('token')}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  axios.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error),
  )

  if (IS_DEMO) {
    setupMock()
  }

  return axios
}

const axiosInstance = initAxios()
export default axiosInstance
