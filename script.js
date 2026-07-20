const USERS_KEY = 'ns-users';
const NOTES_KEY = 'ns-notes';
let currentUser = null;
let users = [];
let notes = [];
let activeTab = 'browse';
let searchQuery = '';
let subjectFilter = '';

// Provide a lightweight storage polyfill using localStorage when
// `window.storage` isn't available (ensures `.get` / `.set` calls work).
if(!window.storage || typeof window.storage.get !== 'function' || typeof window.storage.set !== 'function'){
  window.storage = {
    async get(key /*, legacyFlag */){
      const v = localStorage.getItem(key);
      return v ? { value: v } : null;
    },
    async set(key, value /*, legacyFlag */){
      localStorage.setItem(key, value);
      return;
    }
  };
}
function el(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}