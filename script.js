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

async function saveUsers(){
  try{ await window.storage.set(USERS_KEY, JSON.stringify(users), true); }
  catch(e){ console.error('save users failed', e); }
}
async function saveNotes(){
  try{ await window.storage.set(NOTES_KEY, JSON.stringify(notes), true); }
  catch(e){ console.error('save notes failed', e); }
}

function findUser(username){
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

async function handleLogin(username, role){
  username = username.trim();
  if(!username) return;
  let u = findUser(username);
  if(!u){
    u = { username, role, points: 0 };
    users.push(u);
    await saveUsers();
  }
  currentUser = u;
  activeTab = u.role === 'admin' ? 'review' : 'browse';
  render();
}

function logout(){
  currentUser = null;
  render();
}

function renderSessionBar(){
  const bar = document.getElementById('sessionBar');
  bar.innerHTML = '';
  if(!currentUser){ return; }
  const rolePill = el(`<span class="pill role-${currentUser.role}">${currentUser.role === 'admin' ? 'Admin' : 'Student'} &middot; ${escapeHtml(currentUser.username)}</span>`);
  bar.appendChild(rolePill);
  if(currentUser.role === 'student'){
    const pts = el(`<span class="points-badge">&#9733; ${currentUser.points} pts</span>`);
    bar.appendChild(pts);
  }
  const logoutBtn = el(`<button class="btn small ghost">Switch user</button>`);
  logoutBtn.onclick = logout;
  bar.appendChild(logoutBtn);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderLogin(){
  const root = document.getElementById('root');
  root.innerHTML = '';
  const wrap = el(`
    <div class="login-wrap">
      <h2>Welcome back</h2>
      <p class="sub">Enter a username to jump in. New names create a fresh account — pick admin to review notes, or student to upload and earn points.</p>
      <label>Username</label>
      <input type="text" id="loginUsername" placeholder="e.g. shikshika_r" />
      <label>I am a</label>
      <div class="role-choice">
        <label id="roleStudentLbl" class="checked">
          <input type="radio" name="role" value="student" checked>
          <span>Student</span>
        </label>
        <label id="roleAdminLbl">
          <input type="radio" name="role" value="admin">
          <span>Admin</span>
        </label>
      </div>
      <button class="btn primary" id="loginBtn" style="width:100%;">Continue</button>
    </div>
  `);
  root.appendChild(wrap);
  const studentLbl = wrap.querySelector('#roleStudentLbl');
  const adminLbl = wrap.querySelector('#roleAdminLbl');
  wrap.querySelectorAll('input[name=role]').forEach(r => {
    r.addEventListener('change', () => {
      studentLbl.classList.toggle('checked', r.value === 'student' && r.checked);
      adminLbl.classList.toggle('checked', r.value === 'admin' && r.checked);
    });
  });
  wrap.querySelector('#loginBtn').onclick = () => {
    const username = wrap.querySelector('#loginUsername').value;
    const role = wrap.querySelector('input[name=role]:checked').value;
    handleLogin(username, role);
  };
  wrap.querySelector('#loginUsername').addEventListener('keydown', (e) => {
    if(e.key === 'Enter') wrap.querySelector('#loginBtn').click();
  });
}

function subjectsList(){
  const s = new Set(notes.map(n => n.subject).filter(Boolean));
  return Array.from(s).sort();
}

function renderStudentView(){
  const root = document.getElementById('root');
  root.innerHTML = '';

  const tabs = el(`
    <div class="tabs">
      <button class="tab" data-tab="browse">Browse notes</button>
      <button class="tab" data-tab="upload">Upload a note</button>
      <button class="tab" data-tab="mine">My uploads</button>
      <button class="tab" data-tab="rewards">Rewards</button>
      <button class="tab" data-tab="leaderboard">Leaderboard</button>
      <button class="tab" data-tab="contact">Contact</button>
    </div>
  `);
  root.appendChild(tabs);
  tabs.querySelectorAll('.tab').forEach(t => {
    if(t.dataset.tab === activeTab) t.classList.add('active');
    t.onclick = () => { activeTab = t.dataset.tab; render(); };
  });

  const panel = el('<div></div>');
  root.appendChild(panel);

  if(activeTab === 'browse') panel.appendChild(renderBrowsePanel());
  if(activeTab === 'upload') panel.appendChild(renderUploadPanel());
  if(activeTab === 'mine') panel.appendChild(renderMinePanel());
  if(activeTab === 'rewards') panel.appendChild(renderRewardsPanel());
  if(activeTab === 'leaderboard') panel.appendChild(renderLeaderboardPanel());
  if(activeTab === 'contact') panel.appendChild(renderContactPanel());
}

function renderBrowsePanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">Shared notes</h2>`));
  panel.appendChild(el(`<p class="section-sub">Approved notes from every student on Note Stack. Search or filter by subject.</p>`));

  const searchRow = el(`
    <div class="search-row">
      <input type="search" id="searchInput" placeholder="Search by title or keyword" value="${escapeHtml(searchQuery)}" />
      <select id="subjectSelect"><option value="">All subjects</option></select>
    </div>
  `);
  panel.appendChild(searchRow);
  const subjSel = searchRow.querySelector('#subjectSelect');
  subjectsList().forEach(s => {
    const opt = el(`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`);
    if(s === subjectFilter) opt.selected = true;
    subjSel.appendChild(opt);
  });
  searchRow.querySelector('#searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    refreshBrowseResults();
  });
  subjSel.addEventListener('change', (e) => {
    subjectFilter = e.target.value;
    refreshBrowseResults();
  });

  const grid = el('<div class="notes-grid" id="browseGrid"></div>');
  panel.appendChild(grid);
  fillBrowseGrid(grid);
  return panel;
}

function matchesFilters(n){
  const approved = n.status === 'approved';
  const q = searchQuery.trim().toLowerCase();
  const matchesQ = !q || n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || (n.description||'').toLowerCase().includes(q);
  const matchesSubj = !subjectFilter || n.subject === subjectFilter;
  return approved && matchesQ && matchesSubj;
}

function fillBrowseGrid(grid){
  const results = notes.filter(matchesFilters).sort((a,b) => b.createdAt - a.createdAt);
  grid.innerHTML = '';
  if(results.length === 0){
    grid.appendChild(el(`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">&#128218;</div>No notes match yet. Try a different search, or be the first to upload one for this topic.</div>`));
    return;
  }
  results.forEach(n => grid.appendChild(renderNoteCard(n, {mode:'browse'})));
}

function refreshBrowseResults(){
  const grid = document.getElementById('browseGrid');
  if(grid) fillBrowseGrid(grid);
}

function renderNoteCard(n, opts){
  const card = el(`
    <div class="sticky">
      <span class="subject-tag">${escapeHtml(n.subject)}</span>
      <h3>${escapeHtml(n.title)}</h3>
      <p class="desc">${escapeHtml(n.description || '')}</p>
      ${n.fileName ? `<span class="attachment">&#128206; ${escapeHtml(n.fileName)}</span>` : ''}
      ${n.fileData && n.fileType && n.fileType.startsWith('image/') ? `<img src="${n.fileData}" class="file-preview-img" />` : ''}
      <div class="content-preview">${escapeHtml(n.content).slice(0,220)}${n.content.length>220 ? '…' : ''}</div>
      <div class="file-actions">
        <button class="btn small primary" data-note-id="${n.id}">View Note</button>
        ${n.fileData ? `<a href="${n.fileData}" download="${escapeHtml(n.fileName || 'note-file')}" class="btn small ghost">Download</a>` : ''}
      </div>
      <div class="meta">
        <span>by ${escapeHtml(n.uploader)}</span>
        <span class="status-badge ${n.status}">${n.status}</span>
      </div>
    </div>
  `);
  
  // Add click handler for View Note button
  const viewBtn = card.querySelector('[data-note-id]');
  if(viewBtn){
    viewBtn.onclick = () => openNoteViewer(n);
  }
  
  if(opts.mode === 'admin-review'){
    const actions = el('<div class="actions"></div>');
    const approveBtn = el(`<button class="btn small success">Approve (+5 pts)</button>`);
    approveBtn.onclick = () => approveNote(n.id);
    const rejectBtn = el(`<button class="btn small danger">Reject</button>`);
    rejectBtn.onclick = () => rejectNote(n.id);
    actions.appendChild(approveBtn);
    actions.appendChild(rejectBtn);
    card.appendChild(actions);
  }
  return card;
}

function renderUploadPanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">Upload a note</h2>`));
  panel.appendChild(el(`<p class="section-sub">Submit your notes for admin review. Approved notes earn 5 points and become visible to every student.</p>`));

  const card = el(`
    <div class="upload-card">
      <h3>Note details</h3>
      <div class="form-row">
        <div>
          <label>Title</label>
          <input type="text" id="noteTitle" placeholder="e.g. Chapter 4 — Thermodynamics summary" />
        </div>
        <div>
          <label>Subject</label>
          <input type="text" id="noteSubject" placeholder="e.g. Physics" />
        </div>
      </div>
      <label>Attach a file</label>
      <div class="file-picker-row">
        <label for="noteFile" class="btn ghost small file-picker-btn">&#128193; Choose file</label>
        <input type="file" id="noteFile" accept=".txt,.md,.markdown,.pdf,image/*" style="display:none;" />
        <span id="fileNameDisplay" class="file-name-display">No file chosen</span>
      </div>
      <p class="file-hint">.txt or .md files auto-fill the content box below. Images and PDFs attach as-is so classmates can open or download them (up to 4 MB).</p>
      <div id="imagePreviewWrap"></div>

      <label>Short description (optional)</label>
      <input type="text" id="noteDesc" placeholder="Brief summary or context" />

      <label>Note content</label>
      <textarea id="noteContent" placeholder="Paste or type your notes here, or choose a .txt / .md file above"></textarea>
      <button class="btn primary" id="submitNoteBtn">Submit for review</button>
      <span id="uploadMsg" style="margin-left:12px; font-size:13px; color:var(--sage-ink); font-weight:600;"></span>
    </div>
  `);
  panel.appendChild(card);

  let selectedFile = null;
  const MAX_FILE_BYTES = 4 * 1024 * 1024;

  function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(evt.target.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  function readFileAsText(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(evt.target.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  card.querySelector('#noteFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const display = card.querySelector('#fileNameDisplay');
    const previewWrap = card.querySelector('#imagePreviewWrap');
    previewWrap.innerHTML = '';
    if(!file){
      display.textContent = 'No file chosen';
      selectedFile = null;
      return;
    }
    if(file.size > MAX_FILE_BYTES){
      display.textContent = 'File too large (max 4 MB) — not attached';
      display.style.color = 'var(--clay-ink)';
      selectedFile = null;
      e.target.value = '';
      return;
    }
    selectedFile = file;
    display.style.color = '';
    display.textContent = file.name;

    if(file.type.startsWith('image/')){
      const dataUrl = await readFileAsDataURL(file);
      previewWrap.appendChild(el(`<img src="${dataUrl}" class="file-preview-img" />`));
    }
    const isText = /\.(txt|md|markdown)$/i.test(file.name);
    if(isText){
      const text = await readFileAsText(file);
      card.querySelector('#noteContent').value = text;
    }
  });

  card.querySelector('#submitNoteBtn').onclick = async () => {
    const title = card.querySelector('#noteTitle').value.trim();
    const subject = card.querySelector('#noteSubject').value.trim();
    const description = card.querySelector('#noteDesc').value.trim();
    const content = card.querySelector('#noteContent').value.trim();
    const msg = card.querySelector('#uploadMsg');
    const submitBtn = card.querySelector('#submitNoteBtn');

    if(!title || !subject){
      msg.style.color = 'var(--clay-ink)';
      msg.textContent = 'Title and subject are required.';
      return;
    }
    if(!content && !selectedFile){
      msg.style.color = 'var(--clay-ink)';
      msg.textContent = 'Add note content or attach a file.';
      return;
    }

    submitBtn.disabled = true;
    msg.style.color = 'var(--ink-soft)';
    msg.textContent = selectedFile ? 'Uploading file…' : 'Submitting…';

    let fileName = '', fileData = '', fileType = '';
    try{
      if(selectedFile){
        fileName = selectedFile.name;
        fileType = selectedFile.type;
        fileData = await readFileAsDataURL(selectedFile);
      }
    }catch(err){
      submitBtn.disabled = false;
      msg.style.color = 'var(--clay-ink)';
      msg.textContent = 'Could not read the file — try again.';
      return;
    }

    const note = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      title, subject, description,
      content: content || '(see attached file)',
      fileName, fileData, fileType,
      uploader: currentUser.username,
      status: 'pending',
      createdAt: Date.now()
    };
    notes.push(note);
    await saveNotes();
    submitBtn.disabled = false;
    msg.style.color = 'var(--sage-ink)';
    msg.textContent = 'Submitted — waiting for admin review.';
    card.querySelector('#noteTitle').value = '';
    card.querySelector('#noteSubject').value = '';
    card.querySelector('#noteDesc').value = '';
    card.querySelector('#noteContent').value = '';
    card.querySelector('#noteFile').value = '';
    card.querySelector('#fileNameDisplay').textContent = 'No file chosen';
    card.querySelector('#imagePreviewWrap').innerHTML = '';
    selectedFile = null;
  };

  return panel;
}

function renderMinePanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">My uploads</h2>`));
  panel.appendChild(el(`<p class="section-sub">Track the review status of notes you've submitted.</p>`));
  const mine = notes.filter(n => n.uploader === currentUser.username).sort((a,b) => b.createdAt - a.createdAt);
  const grid = el('<div class="notes-grid"></div>');
  panel.appendChild(grid);
  if(mine.length === 0){
    grid.appendChild(el(`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">&#128221;</div>You haven't uploaded any notes yet. Head to "Upload a note" to share your first one.</div>`));
  }else{
    mine.forEach(n => grid.appendChild(renderNoteCard(n, {mode:'mine'})));
  }
  return panel;
}

function renderLeaderboardPanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">Leaderboard</h2>`));
  panel.appendChild(el(`<p class="section-sub">Ranked by reward points earned from approved notes.</p>`));
  const ranked = users.filter(u => u.role === 'student').sort((a,b) => b.points - a.points);
  if(ranked.length === 0){
    panel.appendChild(el(`<div class="empty-state"><div class="icon">&#127942;</div>No student accounts yet.</div>`));
    return panel;
  }
  ranked.forEach((u, i) => {
    const row = el(`
      <div class="leaderboard-row ${i < 3 ? 'top' : ''}">
        <span class="rank">${i+1}</span>
        <span class="name">${escapeHtml(u.username)}${u.username===currentUser.username ? ' (you)' : ''}</span>
        <span class="pts">${u.points} pts</span>
      </div>
    `);
    panel.appendChild(row);
  });
  return panel;
}

function renderRewardsPanel(){
  const panel = el('<section class="panel active"></section>');
  
  // Header with current points
  const header = el(`
    <div class="rewards-header">
      <div class="label">Your Total Points</div>
      <div class="your-points">&#9733; ${currentUser.points}</div>
    </div>
  `);
  panel.appendChild(header);

  // How to earn points section
  const info = el(`
    <div class="rewards-info">
      <h3>How to Earn Points</h3>
      <ul>
        <li><strong>+5 points</strong> when you upload a note (awarded after admin approval)</li>
        <li>Share quality notes to help your classmates and climb the leaderboard</li>
        <li>The more approved notes you contribute, the more points you earn</li>
      </ul>
    </div>
  `);
  panel.appendChild(info);

  // Rewards history
  const history = el(`
    <div class="rewards-history">
      <h3>Your Rewards History</h3>
      <div id="historyList"></div>
    </div>
  `);
  panel.appendChild(history);

  const historyList = history.querySelector('#historyList');
  const myApprovedNotes = notes.filter(n => n.uploader === currentUser.username && n.status === 'approved');
  
  if(myApprovedNotes.length === 0){
    historyList.appendChild(el(`
      <div class="empty-state">
        <div class="icon">&#128176;</div>
        No rewards yet. Upload and get notes approved to start earning points!
      </div>
    `));
  } else {
    // Sort by newest first
    myApprovedNotes.sort((a, b) => b.createdAt - a.createdAt).forEach(n => {
      const item = el(`
        <div class="history-item">
          <div class="action">Note approved: "${escapeHtml(n.title)}"</div>
          <div class="points positive">+5 pts</div>
        </div>
      `);
      historyList.appendChild(item);
    });
  }

  return panel;
}

function renderContactPanel(){
  const panel = el('<section class="panel active"></section>');
  
  const wrap = el(`
    <div class="contact-wrap">
      <h2>Contact Us</h2>
      <p class="intro">Have questions, feedback, or need help with Note Stack? We're here to assist you. Reach out through any of the methods below.</p>
      
      <div class="contact-info">
        <div class="label">Institution</div>
        <div class="value">SAIM College, Pokhara University</div>
        
        <div class="label">Email</div>
        <div class="value">support@notestack.edu.np</div>
        
        <div class="label">Hours</div>
        <div class="value">Monday - Friday: 9:00 AM - 5:00 PM</div>
      </div>

      <form class="contact-form" id="contactForm">
        <label>Your Name</label>
        <input type="text" id="contactName" placeholder="Enter your full name" required />
        
        <label>Email Address</label>
        <input type="email" id="contactEmail" placeholder="your.email@example.com" required />
        
        <label>Message</label>
        <textarea id="contactMessage" placeholder="Tell us how we can help you..." required></textarea>
        
        <button type="submit" class="btn primary" style="width:100%;">Send Message</button>
        
        <div class="contact-success" id="contactSuccess">
          ✓ Thank you! Your message has been received. We'll get back to you soon.
        </div>
      </form>
    </div>
  `);
  
  panel.appendChild(wrap);
  
  // Handle form submission
  const form = wrap.querySelector('#contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = wrap.querySelector('#contactName').value;
    const email = wrap.querySelector('#contactEmail').value;
    const message = wrap.querySelector('#contactMessage').value;
    
    // In a real app, this would send to a backend
    console.log('Contact form submitted:', { name, email, message, from: currentUser.username });
    
    // Show success message
    wrap.querySelector('#contactSuccess').classList.add('show');
    
    // Clear form
    form.reset();
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      wrap.querySelector('#contactSuccess').classList.remove('show');
    }, 5000);
  });
  
  return panel;
}

function renderAdminView(){
  const root = document.getElementById('root');
  root.innerHTML = '';

  const tabs = el(`
    <div class="tabs">
      <button class="tab" data-tab="review">Review queue</button>
      <button class="tab" data-tab="users">Manage users</button>
      <button class="tab" data-tab="all-notes">All notes</button>
    </div>
  `);
  root.appendChild(tabs);
  tabs.querySelectorAll('.tab').forEach(t => {
    if(t.dataset.tab === activeTab) t.classList.add('active');
    t.onclick = () => { activeTab = t.dataset.tab; render(); };
  });

  const panel = el('<div></div>');
  root.appendChild(panel);

  const pending = notes.filter(n => n.status === 'pending').length;
  const approved = notes.filter(n => n.status === 'approved').length;
  const totalUsers = users.length;

  const stats = el(`
    <div class="grid-stats">
      <div class="stat-card"><div class="num">${pending}</div><div class="label">Pending review</div></div>
      <div class="stat-card"><div class="num">${approved}</div><div class="label">Approved notes</div></div>
      <div class="stat-card"><div class="num">${notes.length}</div><div class="label">Total notes</div></div>
      <div class="stat-card"><div class="num">${totalUsers}</div><div class="label">Registered users</div></div>
    </div>
  `);
  panel.appendChild(stats);

  if(activeTab === 'review') panel.appendChild(renderReviewPanel());
  if(activeTab === 'users') panel.appendChild(renderUsersPanel());
  if(activeTab === 'all-notes') panel.appendChild(renderAllNotesPanel());
}

function renderReviewPanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">Notes awaiting review</h2>`));
  panel.appendChild(el(`<p class="section-sub">Approve to publish a note and award 5 points to its uploader, or reject it.</p>`));
  const pending = notes.filter(n => n.status === 'pending').sort((a,b) => a.createdAt - b.createdAt);
  const grid = el('<div class="notes-grid"></div>');
  panel.appendChild(grid);
  if(pending.length === 0){
    grid.appendChild(el(`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">&#9989;</div>Nothing pending — the queue is clear.</div>`));
  }else{
    pending.forEach(n => grid.appendChild(renderNoteCard(n, {mode:'admin-review'})));
  }
  return panel;
}

function renderUsersPanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">Registered users</h2>`));
  panel.appendChild(el(`<p class="section-sub">All students and admins who have logged into Note Stack.</p>`));
  const table = el(`
    <table class="admin-table">
      <thead><tr><th>Username</th><th>Role</th><th>Points</th><th>Notes uploaded</th></tr></thead>
      <tbody></tbody>
    </table>
  `);
  const tbody = table.querySelector('tbody');
  users.forEach(u => {
    const count = notes.filter(n => n.uploader === u.username).length;
    tbody.appendChild(el(`
      <tr>
        <td>${escapeHtml(u.username)}</td>
        <td><span class="pill role-${u.role}" style="font-size:11px; padding:3px 10px;">${u.role}</span></td>
        <td>${u.points}</td>
        <td>${count}</td>
      </tr>
    `));
  });
  panel.appendChild(table);
  return panel;
}

function renderAllNotesPanel(){
  const panel = el('<section class="panel active"></section>');
  panel.appendChild(el(`<h2 class="section-title">All notes</h2>`));
  panel.appendChild(el(`<p class="section-sub">Full history across every status.</p>`));
  const grid = el('<div class="notes-grid"></div>');
  panel.appendChild(grid);
  const all = notes.slice().sort((a,b) => b.createdAt - a.createdAt);
  if(all.length === 0){
    grid.appendChild(el(`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">&#128193;</div>No notes have been submitted yet.</div>`));
  }else{
    all.forEach(n => grid.appendChild(renderNoteCard(n, {mode:'all'})));
  }
  return panel;
}

async function approveNote(id){
  const n = notes.find(x => x.id === id);
  if(!n) return;
  n.status = 'approved';
  const u = findUser(n.uploader);
  if(u) u.points += 5;
  await saveNotes();
  await saveUsers();
  render();
}

async function rejectNote(id){
  const n = notes.find(x => x.id === id);
  if(!n) return;
  n.status = 'rejected';
  await saveNotes();
  render();
}

function render(){
  renderSessionBar();
  if(!currentUser){
    renderLogin();
    return;
  }
  if(currentUser.role === 'admin') renderAdminView();
  else renderStudentView();
}

// Note Viewer Functions
function openNoteViewer(note){
  const overlay = document.getElementById('noteViewerOverlay');
  const title = document.getElementById('viewerTitle');
  const content = document.getElementById('viewerContent');
  const downloadBtn = document.getElementById('viewerDownload');
  
  // Set title
  title.textContent = note.title || 'Note Viewer';
  
  // Configure download button
  if(note.fileData){
    downloadBtn.href = note.fileData;
    downloadBtn.download = note.fileName || 'note-file';
    downloadBtn.style.display = 'inline-block';
  } else {
    downloadBtn.style.display = 'none';
  }
  
  // Show loading
  content.innerHTML = '<div class="note-viewer-loading"><div class="spinner"></div><div>Loading note...</div></div>';
  
  // Show overlay
  overlay.classList.add('active');
  
  // Load content based on file type
  setTimeout(() => {
    if(!note.fileData){
      // Text-only note
      content.innerHTML = `
        <div style="padding:24px; background:var(--card); height:100%; overflow:auto;">
          <h3 style="font-family:'Fraunces',serif; margin:0 0 8px;">${escapeHtml(note.title)}</h3>
          <p style="color:var(--ink-soft); font-size:13px; margin:0 0 16px;"><strong>Subject:</strong> ${escapeHtml(note.subject)}</p>
          ${note.description ? `<p style="color:var(--ink-soft); font-size:13px; margin:0 0 16px;"><strong>Description:</strong> ${escapeHtml(note.description)}</p>` : ''}
          <div style="white-space:pre-wrap; line-height:1.6; font-size:14px;">${escapeHtml(note.content)}</div>
        </div>
      `;
    } else if(note.fileType && note.fileType.startsWith('image/')){
      // Image file
      content.innerHTML = `
        <div style="padding:24px; background:var(--card); height:100%; overflow:auto; text-align:center;">
          <h3 style="font-family:'Fraunces',serif; margin:0 0 16px;">${escapeHtml(note.title)}</h3>
          <img src="${note.fileData}" style="max-width:100%; height:auto; border-radius:8px; box-shadow:var(--shadow);" />
        </div>
      `;
    } else if(note.fileType === 'application/pdf'){
      // PDF file - use iframe
      content.innerHTML = `<iframe src="${note.fileData}" class="note-viewer-iframe" title="${escapeHtml(note.fileName || 'PDF Viewer')}"></iframe>`;
    } else if(note.fileType && (note.fileType.startsWith('text/') || note.fileType === 'application/json')){
      // Text file
      fetch(note.fileData)
        .then(response => response.text())
        .then(text => {
          content.innerHTML = `
            <div style="padding:24px; background:var(--card); height:100%; overflow:auto;">
              <h3 style="font-family:'Fraunces',serif; margin:0 0 16px;">${escapeHtml(note.title)}</h3>
              <pre style="white-space:pre-wrap; line-height:1.6; font-size:13px; font-family:monospace; background:#F5F5F5; padding:16px; border-radius:8px; overflow-x:auto;">${escapeHtml(text)}</pre>
            </div>
          `;
        })
        .catch(err => {
          content.innerHTML = `
            <div class="note-viewer-error">
              <div class="icon">⚠️</div>
              <div style="font-size:16px; font-weight:600; margin-bottom:8px;">Could not load file</div>
              <div style="font-size:14px;">The file might be corrupted or in an unsupported format.</div>
            </div>
          `;
        });
    } else {
      // Unknown file type - try iframe anyway
      content.innerHTML = `<iframe src="${note.fileData}" class="note-viewer-iframe" title="${escapeHtml(note.fileName || 'File Viewer')}"></iframe>`;
    }
  }, 100);
}

function closeNoteViewer(){
  const overlay = document.getElementById('noteViewerOverlay');
  overlay.classList.remove('active');
  
  // Clear content after animation
  setTimeout(() => {
    const content = document.getElementById('viewerContent');
    content.innerHTML = '<div class="note-viewer-loading"><div class="spinner"></div><div>Loading note...</div></div>';
  }, 300);
}

// Set up viewer close handlers
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeViewer');
  const overlay = document.getElementById('noteViewerOverlay');
  
  if(closeBtn){
    closeBtn.onclick = closeNoteViewer;
  }
  
  if(overlay){
    // Close when clicking outside modal
    overlay.onclick = (e) => {
      if(e.target === overlay){
        closeNoteViewer();
      }
    };
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && overlay.classList.contains('active')){
        closeNoteViewer();
      }
    });
  }
});

(async function init(){
  buildSpiral();
  await loadAll();
  render();
})();