import axios from 'axios'
import Cookies from 'js-cookie'

const loadConfig = async () => {
  try {
    const response = await fetch('/config.json')
    const config = await response.json()
    return config
  } catch {
    return {}
  }
}

const initAxios = async () => {
  const config = await loadConfig()

  axios.defaults.baseURL = config.API_URL || process.env.VUE_APP_API_URL  // 如果 config.json 没有提供 API_URL, 使用环境变量
  axios.defaults.timeout = 50000

  axios.interceptors.request.use(
    (config) => {
      const csrfToken = Cookies.get('csrfToken')
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken
      }
      const deviceToken = Cookies.get('deviceToken')
      if (deviceToken && !config.url.includes('/auth')) {
        config.headers.Authorization = `Bearer ${deviceToken}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axios.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}

initAxios()

export default axios
