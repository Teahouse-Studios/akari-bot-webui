const STORAGE_KEY = 'akariWebStorage';

const LocalStorageJson = {
  _getStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },

  _setStorage(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  },

  getItem(key) {
    const storage = this._getStorage();
    return storage[key] !== undefined ? storage[key] : null;
  },

  setItem(key, value) {
    const storage = this._getStorage();
    storage[key] = value;
    this._setStorage(storage);
  },

  removeItem(key) {
    const storage = this._getStorage();
    if (key in storage) {
      delete storage[key];
      this._setStorage(storage);
    }
  },

  clear() {
    this._setStorage({});
  }
};

export default LocalStorageJson;
