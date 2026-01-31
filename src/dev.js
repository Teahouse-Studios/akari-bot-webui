import axios from '@/axios.mjs'
import { IS_DEMO } from '@/const'
import LocalStorageJson from '@/localStorageJson.js'

export async function getIsDevelopMode() {
  if (IS_DEMO) return false

  const localIsDev = LocalStorageJson.getItem('isDevelopMode') === 'true'
  if (!localIsDev) return false

  try {
    const res = await axios.get('/api/dev')
    return res?.data?.is_dev === true
  } catch (err) {
    return false
  }
}
