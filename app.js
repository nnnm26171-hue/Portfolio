'use strict';
const uid = () => Math.random().toString(36).slice(2, 9);

// --- DATABASE CONFIG ---
const SUPABASE_URL = 'https://odyrnnzcixwnpcirtaad.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BFWtCpz_nUWiixMnbjGObQ_ApM9I20l';
const supabase = (SUPABASE_URL !== 'YOUR_SUPABASE_URL') ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
// -----------------------

const DEFAULT = {
  personal: { name: 'ชื่อ-นามสกุล', title: 'Position / Role', university: 'มหาวิทยาลัย / คณะ', bio: 'แนะนำตัวเองสั้นๆ เกี่ยวกับความสนใจและเป้าหมาย', avatar: '', skills: ['Skill 1', 'Skill 2', 'Skill 3'], contact: { email: 'email@example.com', github: '', linkedin: '', website: '' } },
  experience: {
    production: [{ id: uid(), name: 'ชื่อโปรเจกต์', role: 'Full-Stack Developer', description: 'คำอธิบายโปรเจกต์', year: '2024', tech: ['React'], link: '', img: '' }],
    competition: [], academic: [], personal: [], opensource: []
  },
  selfDev: { certs: [], workshops: [] },
  awards: { competitions: [], honors: [] },
  leadership: []
};

let data = JSON.parse(JSON.stringify(DEFAULT));

async function loadData() {
  console.log('Loading data...');
  
  // 1. Start with DEFAULT
  data = JSON.parse(JSON.stringify(DEFAULT));

  // 2. Try to fetch from Supabase (Real-time DB)
  if (supabase) {
    try {
      const { data: dbData, error } = await supabase
        .from('portfolio_data')
        .select('content')
        .eq('id', 'main_portfolio')
        .single();
      
      if (dbData && dbData.content) {
        data = dbData.content;
        console.log('Loaded from Cloud!');
      } else {
        console.log('No cloud data found, checking local...');
      }
    } catch (e) { console.log('Cloud fetch error', e); }
  }

  // 3. If cloud is empty, try LocalStorage
  const localData = localStorage.getItem('portfolio');
  if (localData && (!supabase || data.personal.name === DEFAULT.personal.name)) {
    data = JSON.parse(localData);
    console.log('Loaded from LocalStorage');
  }

  // 4. Fallback: Try to fetch from data.json (Static)
  if (data.personal.name === DEFAULT.personal.name) {
    try {
      const response = await fetch('data.json');
      if (response.ok) {
        data = await response.json();
        console.log('Loaded from data.json');
      }
    } catch (e) { }
  }

  // Migration & Render
  if (Array.isArray(data.experience)) {
    const old = data.experience;
    data.experience = { production: old, competition: [], academic: [], personal: [], opensource: [] };
  }
  
  renderAll();
}

let editMode = false, currentTab = 'production', currentSection = 'home', modalSave = null;

const save = async () => {
  localStorage.setItem('portfolio', JSON.stringify(data));
  if (supabase) {
    try {
      const { error } = await supabase
        .from('portfolio_data')
        .upsert({ id: 'main_portfolio', content: data });
      if (error) console.error('DB Save Error:', error);
      else console.log('Synced to Cloud!');
    } catch (e) { console.error('Sync failed', e); }
  }
};
const toast = (msg) => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); };
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function showSection(id) {
  if (currentSection === id) return;
  
  // Instant switch
  document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
  const newSection = document.getElementById(id);
  if (newSection) {
    newSection.classList.add('active');
    // Refresh data
    if (id === 'home') renderHero();
    if (id === 'experience') renderProjects();
    if (id === 'selfdev') renderSelfDev();
    if (id === 'awards') renderAwards();
    if (id === 'leadership') renderLeadership();
  }
  
  currentSection = id;

  // Update nav links active state
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
  });
}

function renderHero() {
  const p = data.personal, c = p.contact;
  document.getElementById('heroAvatarContainer').innerHTML = `
    ${p.avatar ? `<img class="hero-avatar" src="${esc(p.avatar)}">` : `<div class="hero-avatar-placeholder">${p.name[0]}</div>`}
    ${editMode ? `<button class="edit-btn-mini avatar-edit" onclick="openEditPersonal()">✏️</button>` : ''}
  `;
  const nameEl = document.getElementById('heroName');
  nameEl.innerHTML = `${esc(p.name)} ${editMode ? `<button class="edit-btn-text" onclick="openEditPersonal()">✏️</button>` : ''}`;
  if (p.nameColor) nameEl.style.color = p.nameColor;
  if (p.nameGlow) nameEl.style.textShadow = `0 0 15px ${p.nameGlow}, 0 0 30px ${p.nameGlow}`;
  else nameEl.style.textShadow = 'none';
  
  document.getElementById('heroTitle').textContent = p.title;
  document.getElementById('heroUni').textContent = p.university;
  document.getElementById('heroBio').innerHTML = `${esc(p.bio)} ${editMode ? `<br><button class="edit-btn-text" onclick="openEditPersonal()">✏️ Edit Bio</button>` : ''}`;
  document.getElementById('heroSkills').innerHTML = p.skills.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('') + (editMode ? `<button class="skill-tag" onclick="openEditPersonal()" style="border:1px dashed var(--primary); color:var(--primary)">+ Edit Skills</button>` : '');

  const links = [
    { key: 'email', icon: '✉️', label: 'Email', url: `mailto:${c.email}` },
    { key: 'github', icon: '⌥', label: 'GitHub', url: c.github },
    { key: 'linkedin', icon: 'in', label: 'LinkedIn', url: c.linkedin },
    { key: 'website', icon: '🌐', label: 'Website', url: c.website }
  ].filter(l => c[l.key]);

  document.getElementById('heroLinks').innerHTML = links.map(l => `
    <a href="${esc(l.url)}" target="_blank" class="hero-link ${l.key === 'email' ? 'email-cta' : 'social-icon'}">
      <span class="icon">${l.icon}</span>
      <span class="label">${esc(l.label)}</span>
    </a>`).join('') + (editMode ? `<button class="hero-link social-icon" onclick="openEditPersonal()" style="background:var(--primary); color:#fff">✏️</button>` : '');
}

function renderTabs() {
  const tabs = [['production', '🏢 Production'], ['competition', '🏅 Competition'], ['academic', '🎓 Academic'], ['personal', '💡 Personal'], ['opensource', '🔓 Open Source']];
  document.getElementById('expTabs').innerHTML = tabs.map(([k, l]) => `<button class="tab-btn${currentTab === k ? ' active' : ''}" onclick="switchTab('${k}')">${l}</button>`).join('');
}

function renderProjects() {
  const arr = data.experience[currentTab] || [];
  const container = document.getElementById('projectsGrid');
  const addBtn = document.getElementById('addProjectBtn');
  
  if (addBtn) addBtn.style.display = editMode ? 'inline-block' : 'none';
  
  container.innerHTML = arr.map(p => `
    <div class="project-card">
      ${p.img ? `<img class="project-img-circle" src="${esc(p.img)}">` : `<div class="project-img-circle" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05)">📁</div>`}
      <div class="project-content">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h3 style="margin:0;font-size:1.2rem">${esc(p.name)}</h3>
          <span class="project-year">${esc(p.year)}</span>
        </div>
        <span class="project-role">${esc(p.role)}</span>
        <p class="project-desc">${esc(p.description)}</p>
        <div class="card-actions">
          ${p.link ? `<a href="${esc(p.link)}" target="_blank" class="hero-link" style="padding:0.4rem 1rem;font-size:0.8rem">View Result ↗</a>` : ''}
          ${editMode ? `
            <button onclick="openEditProject('${p.id}')">✏ Edit</button>
            <button onclick="deleteProject('${p.id}')">🗑 Del</button>
          ` : ''}
        </div>
      </div>
    </div>`).join('');
}

function renderSelfDev() {
  const btnC = document.getElementById('addCertBtn'), btnW = document.getElementById('addWorkshopBtn');
  if (btnC) btnC.style.display = editMode ? 'inline-block' : 'none';
  if (btnW) btnW.style.display = editMode ? 'inline-block' : 'none';

  document.getElementById('certsGrid').innerHTML = data.selfDev.certs.map(i => `<div class="item-row"><span>${esc(i.name)} (${esc(i.provider)})</span> ${editMode ? `<button onclick="deleteItem('certs','${i.id}')">x</button>` : ''}</div>`).join('');
  document.getElementById('workshopsGrid').innerHTML = data.selfDev.workshops.map(i => `<div class="item-row"><span>${esc(i.name)}</span> ${editMode ? `<button onclick="deleteItem('workshops','${i.id}')">x</button>` : ''}</div>`).join('');
}

function renderAwards() {
  const btnC = document.getElementById('addCompBtn');
  if (btnC) btnC.style.display = editMode ? 'inline-block' : 'none';

  const compGrid = document.getElementById('competitionsGrid');
  if (compGrid) {
    compGrid.innerHTML = data.awards.competitions.map(i => `
      <div class="item-row">
        <span>${esc(i.result)} - ${esc(i.name)}</span> 
        ${editMode ? `<button onclick="deleteItem('competitions','${i.id}')">🗑</button>` : ''}
      </div>`).join('');
  }
}

function renderLeadership() {
  const container = document.getElementById('leadershipGrid');
  const btn = document.getElementById('addLeaderBtn');
  if (btn) btn.style.display = editMode ? 'inline-block' : 'none';
  
  container.className = 'leadership-grid';
  container.innerHTML = data.leadership.map(i => `
    <div class="activity-card">
      ${i.img ? `<img class="activity-img" src="${esc(i.img)}">` : `<div class="activity-img" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05)"></div>`}
      <div class="activity-info">
        <span class="activity-role">${esc(i.role)}</span>
        <h3 class="activity-name">${esc(i.name)}</h3>
        <span class="activity-org">${esc(i.org)} • ${esc(i.date)}</span>
        <p class="activity-desc">${esc(i.desc)}</p>
        ${editMode ? `
          <div class="card-actions" style="margin-top:1rem">
            <button onclick="openEditLeadership('${i.id}')">✏ Edit</button>
            <button onclick="deleteItem('leadership','${i.id}')">🗑 Del</button>
          </div>` : ''}
      </div>
    </div>`).join('');
}

const openEditLeadership = (id) => {
  const i = data.leadership.find(x => x.id === id);
  const body = fld('l_name', 'Activity Name', i.name) + fld('l_img', 'Image URL', i.img) + fld('l_role', 'Role', i.role) + fld('l_org', 'Organization', i.org) + fld('l_date', 'Date/Year', i.date) + txt('l_desc', 'Description', i.desc);
  openModal('Edit Activity', body, () => {
    Object.assign(i, { name: g('l_name'), img: g('l_img'), role: g('l_role'), org: g('l_org'), date: g('l_date'), desc: g('l_desc') });
    save(); renderLeadership();
  });
};

function renderAll() { renderHero(); renderTabs(); renderProjects(); renderSelfDev(); renderAwards(); renderLeadership(); }
function switchTab(t) { currentTab = t; renderTabs(); renderProjects(); }

const ADMIN_PASSWORD = "1234"; // <<-- คุณสามารถเปลี่ยนรหัสผ่านตรงนี้ได้ครับ

function toggleEditMode() {
  if (!editMode) {
    const pw = prompt("กรุณาใส่รหัสผ่านเพื่อเข้าสู่โหมดแก้ไข:");
    if (pw !== ADMIN_PASSWORD) {
      alert("รหัสผ่านไม่ถูกต้อง! เข้าถึงถูกปฏิเสธ");
      return;
    }
  }
  
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  document.getElementById('editToggleBtn').textContent = editMode ? '✓ Save' : '✏ Edit Portfolio';
  document.getElementById('editBar').style.display = editMode ? 'flex' : 'none';
  if (editMode) updateVisitorDisplay(); 
  if (!editMode) { save(); toast('Saved & Locked!'); }
  renderAll();
}

async function updateVisitorDisplay() {
  try {
    const res = await fetch('https://api.countapi.xyz/get/much-portfolio-2026/visits');
    const data = await res.json();
    document.getElementById('visitorCount').textContent = `📊 Total Visits: ${data.value || 0}`;
  } catch (e) {
    document.getElementById('visitorCount').textContent = `📊 Visits: Online`;
  }
}

async function trackVisit() {
  try {
    await fetch('https://api.countapi.xyz/hit/much-portfolio-2026/visits');
  } catch (e) {}
}

// MODAL
const openModal = (title, fieldsHtml, saveFn) => {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalFields').innerHTML = fieldsHtml;
  modalSave = saveFn;
  document.getElementById('modal').classList.add('show');
};
const closeModal = () => document.getElementById('modal').classList.remove('show');
document.getElementById('modalSaveBtn').onclick = () => { if (modalSave) modalSave(); closeModal(); };

const fld = (id, label, val = '') => `<div class="f-group"><label>${label}</label><input id="f_${id}" value="${esc(val)}"></div>`;
const txt = (id, label, val = '') => `<div class="f-group"><label>${label}</label><textarea id="f_${id}">${esc(val)}</textarea></div>`;
const g = id => document.getElementById('f_' + id)?.value || '';

function openEditPersonal() {
  const p = data.personal, c = p.contact;
  const body =
    fld('p_name', 'Full Name', p.name) +
    fld('p_avatar', 'Profile Image URL', p.avatar) +
    fld('p_title', 'Title', p.title) +
    fld('p_uni', 'University', p.university) +
    fld('p_skills', 'Skills (comma separated)', p.skills.join(', ')) + // เพิ่มช่อง Skills ตรงนี้ครับ
    fld('p_name_color', 'Name Color (e.g. #8b5cf6)', p.nameColor || '') +
    fld('p_name_glow', 'Name Glow Color (e.g. rgba(139,92,246,0.5))', p.nameGlow || '') +
    txt('p_bio', 'Short Bio', p.bio) +
    fld('c_email', 'Email Address', c.email) +
    fld('c_github', 'GitHub URL', c.github) +
    fld('c_linkedin', 'LinkedIn URL', c.linkedin) +
    fld('c_website', 'Website URL', c.website);

  openModal('Edit Personal Info', body, () => {
    p.name = g('p_name');
    p.avatar = g('p_avatar');
    p.title = g('p_title');
    p.university = g('p_uni');
    p.skills = g('p_skills').split(',').map(s => s.trim()).filter(s => s); // บันทึก Skills ตรงนี้ครับ
    p.nameColor = g('p_name_color');
    p.nameGlow = g('p_name_glow');
    p.bio = g('p_bio');
    c.email = g('c_email');
    c.github = g('c_github');
    c.linkedin = g('c_linkedin');
    c.website = g('c_website');
    save(); renderAll();
  });
}

const expLabels = { production: 'Production', competition: 'Competition', academic: 'Academic', personal: 'Personal', opensource: 'Open Source' };
function openAddProject() {
  const body = fld('p_name', 'Project Name') + fld('p_img', 'Image URL') + fld('p_role', 'Role') + fld('p_year', 'Year') + fld('p_link', 'Result Link') + txt('p_desc', 'Description');
  openModal('Add Project', body, () => {
    const p = { id: uid(), name: g('p_name'), img: g('p_img'), role: g('p_role'), year: g('p_year'), link: g('p_link'), description: g('p_desc') };
    if (!data.experience[currentTab]) data.experience[currentTab] = [];
    data.experience[currentTab].unshift(p);
    save(); renderProjects();
  });
}

function openEditProject(id) {
  const p = data.experience[currentTab].find(x => x.id === id);
  if (!p) return;
  const body = fld('p_name', 'Project Name', p.name) + fld('p_img', 'Image URL', p.img) + fld('p_role', 'Role', p.role) + fld('p_year', 'Year', p.year) + fld('p_link', 'Result Link', p.link) + txt('p_desc', 'Description', p.description);
  openModal('Edit Project', body, () => {
    Object.assign(p, { name: g('p_name'), img: g('p_img'), role: g('p_role'), year: g('p_year'), link: g('p_link'), description: g('p_desc') });
    save(); renderProjects();
  });
}

function deleteProject(id) { 
  if (confirm('Delete this project?')) { 
    data.experience[currentTab] = data.experience[currentTab].filter(x => x.id !== id); 
    save(); renderProjects(); 
  } 
}

function openAddItem(type) {
  let body = '';
  if (type === 'cert') body = fld('c_name', 'Certificate Name') + fld('c_provider', 'Provider') + fld('c_date', 'Date');
  else if (type === 'workshop') body = fld('w_name', 'Workshop Name') + fld('w_organizer', 'Organizer') + fld('w_date', 'Date');
  else if (type === 'competition_award') body = fld('ca_name', 'Award Name') + fld('ca_result', 'Result (e.g. Winner)') + fld('ca_event', 'Event') + fld('ca_date', 'Date');
  else if (type === 'honor') body = fld('h_name', 'Honor Name') + fld('h_institution', 'Institution') + fld('h_date', 'Date');
  else if (type === 'leadership') body = fld('l_name', 'Activity Name') + fld('l_img', 'Image URL') + fld('l_role', 'Role') + fld('l_org', 'Organization') + fld('l_date', 'Date/Year') + txt('l_desc', 'Description');

  openModal('Add Item', body, () => {
    let item = { id: uid() };
    if (type === 'cert') Object.assign(item, { name: g('c_name'), provider: g('c_provider'), date: g('c_date') });
    else if (type === 'workshop') Object.assign(item, { name: g('w_name'), organizer: g('w_organizer'), date: g('w_date') });
    else if (type === 'competition_award') Object.assign(item, { name: g('ca_name'), result: g('ca_result'), event: g('ca_event'), date: g('ca_date') });
    else if (type === 'honor') Object.assign(item, { name: g('h_name'), institution: g('h_institution'), date: g('h_date') });
    else if (type === 'leadership') Object.assign(item, { name: g('l_name'), img: g('l_img'), role: g('l_role'), org: g('l_org'), date: g('l_date'), desc: g('l_desc') });

    if (type === 'cert') data.selfDev.certs.push(item);
    else if (type === 'workshop') data.selfDev.workshops.push(item);
    else if (type === 'competition_award') data.awards.competitions.push(item);
    else if (type === 'honor') data.awards.honors.push(item);
    else if (type === 'leadership') data.leadership.push(item);
    save(); renderAll();
  });
}
function deleteItem(type, id) {
  if (type === 'certs') data.selfDev.certs = data.selfDev.certs.filter(x => x.id !== id);
  else if (type === 'workshops') data.selfDev.workshops = data.selfDev.workshops.filter(x => x.id !== id);
  else if (type === 'competitions') data.awards.competitions = data.awards.competitions.filter(x => x.id !== id);
  else if (type === 'honors') data.awards.honors = data.awards.honors.filter(x => x.id !== id);
  else if (type === 'leadership') data.leadership = data.leadership.filter(x => x.id !== id);
  save(); renderAll();
}

function exportData() {
  const a = document.createElement('a'); a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(data)); a.download = 'portfolio.json'; a.click();
}
function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = ev => { data = JSON.parse(ev.target.result); save(); renderAll(); }; r.readAsText(f);
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('portfolio_theme', isLight ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
  trackVisit(); 
  if (localStorage.getItem('portfolio_theme') === 'light') {
    document.body.classList.add('light-mode');
  }
  loadData();
  showSection('home');

  // High-Performance Canvas Sparks & Background Dust
  const canvas = document.getElementById('spark-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let stars = []; // เพิ่มละอองดาวพื้นหลัง
  let mouse = { x: -100, y: -100 };

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initStars(); };
  
  const initStars = () => {
    stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        speed: Math.random() * 0.2 + 0.1,
        opacity: Math.random()
      });
    }
  };

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (Math.random() > 0.5) particles.push(new Particle());
  });

  class Particle {
    constructor() {
      this.x = mouse.x; this.y = mouse.y;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 2.5;
      this.speedY = (Math.random() - 0.5) * 2.5;
      this.life = 1;
      this.color = `hsla(${195 + Math.random() * 20}, 100%, 75%, `; 
    }
    update() {
      this.x += this.speedX; this.y += this.speedY;
      this.life -= 0.025;
    }
    draw() {
      ctx.fillStyle = this.color + this.life + ')';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // วาดละอองดาวพื้นหลัง (Slow Moving)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.y -= s.speed;
      if (s.y < 0) s.y = canvas.height;
      ctx.globalAlpha = Math.sin(Date.now() * 0.001 + s.x) * 0.3 + 0.5; // Twinkle effect
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].life <= 0) { particles.splice(i, 1); i--; }
    }
    requestAnimationFrame(animate);
  };
  animate();

  // Reveal Animation on Scroll (Optimized)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('revealed');
    });
  }, { threshold: 0.05 });

  const addEffects = () => {
    document.querySelectorAll('.project-card, .activity-card, .card-glass, .section-header-pro').forEach((el, idx) => {
      el.classList.add('reveal-item');
      el.style.transitionDelay = `${(idx % 4) * 0.05}s`;
      revealObserver.observe(el);
    });
  };
  
  const originalRenderAll = renderAll;
  renderAll = () => { originalRenderAll(); addEffects(); };
  addEffects();
});
