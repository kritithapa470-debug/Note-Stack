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

function buildSpiral(){
  const spiral = document.getElementById('spiral');
  spiral.innerHTML = '';
  const count = Math.ceil(window.innerHeight / 44) + 2;
  for(let i=0;i<count;i++){
    const h = el('<div class="hole"></div>');
    h.style.top = (24 + i*44) + 'px';
    spiral.appendChild(h);
  }
}
window.addEventListener('resize', buildSpiral);

async function loadAll(){
  try{
    const u = await window.storage.get(USERS_KEY, true);
    users = u ? JSON.parse(u.value) : [];
  }catch(e){ users = []; }
  try{
    const n = await window.storage.get(NOTES_KEY, true);
    notes = n ? JSON.parse(n.value) : [];
  }catch(e){ notes = []; }
}