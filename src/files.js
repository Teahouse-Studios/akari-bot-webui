import axios from '@/axios.mjs'

const STORAGE_API = '/api/files'
const DEV_FILE_API = '/api/dev/files'

/**
 * 列出后端允许访问的根目录。
 */
export async function listStorageRoots() {
  const { data } = await axios.get(`${STORAGE_API}/roots`)
  return data.roots || []
}

/**
 * 列出指定根目录下的条目。
 * @param {string} root 根目录 ID，例如 core:data
 * @param {string} path 相对根目录的路径
 */
export async function listStorage(root, path = '') {
  const { data } = await axios.get(`${STORAGE_API}/list`, { params: { root, path } })
  return data
}

/**
 * 读取文本文件内容（同时返回 revision）。
 */
export async function readStorageContent(root, path) {
  const { data } = await axios.get(`${STORAGE_API}/content`, { params: { root, path } })
  return data
}

/**
 * 写入完整文件内容。传入 revision 时启用乐观锁。
 */
export async function writeStorageContent(root, path, content, revision = '') {
  const body = { root, path, content }
  if (revision) body.revision = revision
  const { data } = await axios.put(`${STORAGE_API}/content`, body)
  return data
}

/**
 * 创建文件或目录。
 */
export async function createStorageEntry(root, path, name, type = 'file') {
  const { data } = await axios.post(`${STORAGE_API}/create`, { root, path, name, type })
  return data
}

/**
 * 在原目录内重命名条目。
 */
export async function renameStorageEntry(root, path, newName) {
  const { data } = await axios.post(`${STORAGE_API}/rename`, {
    root,
    path,
    new_name: newName,
  })
  return data
}

/**
 * 删除文件或目录。目录不要传 revision。
 */
export async function deleteStorageEntry(root, path, revision = '') {
  const params = { root, path }
  if (revision) params.revision = revision
  await axios.delete(`${STORAGE_API}/entry`, { params })
}

/**
 * 下载文件或目录（目录会返回 zip），返回原始 axios 响应。
 * inline 为 true 时用于图片等内联预览。
 */
export async function downloadStorageEntry(root, path, inline = false) {
  const response = await axios.get(`${STORAGE_API}/download`, {
    params: { root, path, inline },
    responseType: 'blob',
  })
  return response
}

/**
 * 开发者模式：列出机器人根目录下的条目。
 */
export async function listDevFiles(path = '') {
  const { data } = await axios.get(`${DEV_FILE_API}/list`, { params: { path } })
  return data
}

/**
 * 开发者模式：预览文件，图片或文本会以 blob 返回。
 */
export async function previewDevFile(path) {
  return axios.get(`${DEV_FILE_API}/preview`, {
    params: { path },
    responseType: 'blob',
  })
}

/**
 * 开发者模式：下载文件或目录。
 */
export async function downloadDevEntry(path) {
  return axios.get(`${DEV_FILE_API}/download`, {
    params: { path },
    responseType: 'blob',
  })
}

/**
 * 开发者模式：上传文件到指定目录。
 */
export async function uploadDevFile(path, file) {
  const form = new FormData()
  form.append('path', path)
  form.append('file', file)
  await axios.post(`${DEV_FILE_API}/upload`, form)
}

/**
 * 开发者模式：创建文件或目录。
 */
export async function createDevEntry(path, name, type = 'file') {
  await axios.post(`${DEV_FILE_API}/create`, null, {
    params: { path, name, filetype: type },
  })
}

/**
 * 开发者模式：重命名条目。
 */
export async function renameDevEntry(path, newName) {
  await axios.post(`${DEV_FILE_API}/rename`, { path, new_name: newName })
}

/**
 * 开发者模式：删除条目。
 */
export async function deleteDevEntry(path) {
  await axios.delete(`${DEV_FILE_API}/delete`, { params: { path } })
}
