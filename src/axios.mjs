import axios from 'axios'
import { IS_DEMO } from './const'
import setupMock from '@/mock/api'
import LocalStorageJson from '@/localStorageJson.js'

// const initAxios = async () => {
const initAxios = () => {
  const apiUrl = window.location.origin

  // TODO api base
  // let apiUrl = window.location.origin;
  // try {
  //   const response = await fetch("/config.json");
  //   if (response.ok) {
  //     const config = await response.json();
  //     apiUrl = config.api_url || apiUrl;
  //   }
  // } catch (err) {
  //   console.error("Failed to initialize Axios:", err);
  //   throw err;
  // }

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

// const axiosInstance = await initAxios();
const axiosInstance = initAxios()
export default axiosInstance
