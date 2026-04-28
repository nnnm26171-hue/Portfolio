'use strict';
const uid = () => Math.random().toString(36).slice(2, 9);

// --- DATABASE CONFIG ---
const SUPABASE_URL = 'https://odyrnnzcixwnpcirtaad.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BFWtCpz_nUWiixMnbjGObQ_ApM9I20l';
let dbClient = null;
if (typeof supabase !== 'undefined') {
    dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const DEFAULT = {
    personal: { name: 'ชื่อ-นามสกุล', title: 'Position / Role', university: 'มหาวิทยาลัย / คณะ', bio: 'แนะนำตัวเองสั้นๆ', avatar: '', skills: ['Skill 1'], contact: { email: 'email@example.com', github: '', linkedin: '', website: '' } },
    experience: { production: [], competition: [], academic: [], personal: [], opensource: [] },
    selfDev: { certs: [], workshops: [] },
    awards: { competitions: [], honors: [] },
    leadership: []
};

let data = JSON.parse(JSON.stringify(DEFAULT));
let editMode = false, currentTab = 'production', currentSection = 'home', modalSave = null;

const save = async () => {
    localStorage.setItem('portfolio', JSON.stringify(data));
    if (dbClient) {
        try {
            const { error } = await dbClient
                .from('Portfolio_data') // ใช้ตัว P ใหญ่ตามที่คุณตั้งใน Supabase
                .upsert({ id: 'main_portfolio', content: data });
            if (error) console.error('DB Save Error:', error);
            else toast('Synced to Cloud! ✅');
        } catch (e) { console.error('Sync failed', e); }
    }
};

const toast = (msg) => { 
    const t = document.getElementById('toast'); 
    if (t) {
        t.textContent = msg; 
        t.style.transform = 'translateY(0)';
        setTimeout(() => t.style.transform = 'translateY(200%)', 2500); 
    }
};

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function loadData() {
    console.log('Loading Data...');
    try {
        // 1. Load Local First (Quick)
        const local = localStorage.getItem('portfolio');
        if (local) data = JSON.parse(local);

        // 2. Load from Cloud (Priority)
        if (dbClient) {
            const { data: dbData, error } = await dbClient
                .from('Portfolio_data')
                .select('content')
                .eq('id', 'main_portfolio')
                .single();
            
            if (dbData && dbData.content) {
                data = dbData.content;
                console.log('Loaded from Cloud!');
            }
        }
    } catch (e) { console.error('Load Error:', e); }
    renderAll();
}

function showSection(id) {
    currentSection = id;
    document.querySelectorAll('.section-page').forEach(s => s.classList.toggle('active', s.id === id));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    renderAll();
}

function renderHero() {
    const p = data.personal, c = p.contact;
    const avatarCont = document.getElementById('heroAvatarContainer');
    if (avatarCont) {
        avatarCont.innerHTML = `
            ${p.avatar ? `<img class="hero-avatar" src="${esc(p.avatar)}">` : `<div class="hero-avatar-placeholder">${(p.name || 'U')[0]}</div>`}
            ${editMode ? `<button class="edit-btn-mini avatar-edit" onclick="openEditPersonal()">✏️</button>` : ''}
        `;
    }
    const nameEl = document.getElementById('heroName');
    if (nameEl) {
        nameEl.innerHTML = `${esc(p.name)} ${editMode ? `<button class="edit-btn-text" onclick="openEditPersonal()">✏️</button>` : ''}`;
        if (p.nameColor) nameEl.style.color = p.nameColor;
        if (p.nameGlow) nameEl.style.textShadow = `0 0 15px ${p.nameGlow}`;
    }
    
    if (document.getElementById('heroTitle')) document.getElementById('heroTitle').textContent = p.title;
    if (document.getElementById('heroUni')) document.getElementById('heroUni').textContent = p.university;
    if (document.getElementById('heroBio')) document.getElementById('heroBio').innerHTML = `${esc(p.bio)} ${editMode ? `<br><button class="edit-btn-text" onclick="openEditPersonal()">✏️ Edit Bio</button>` : ''}`;
    
    const skillsEl = document.getElementById('heroSkills');
    if (skillsEl) {
        skillsEl.innerHTML = (p.skills || []).map(s => `<span class="skill-tag">${esc(s)}</span>`).join('') + (editMode ? `<button class="skill-tag" onclick="openEditPersonal()" style="border:1px dashed var(--primary); color:var(--primary)">+ Edit Skills</button>` : '');
    }

    const linksCont = document.getElementById('heroLinks');
    if (linksCont) {
        const links = [
            { key: 'email', icon: '✉️', label: 'Email', url: `mailto:${c.email}` },
            { key: 'github', icon: '⌥', label: 'GitHub', url: c.github },
            { key: 'linkedin', icon: 'in', label: 'LinkedIn', url: c.linkedin },
            { key: 'website', icon: '🌐', label: 'Website', url: c.website }
        ].filter(l => c[l.key]);

        linksCont.innerHTML = links.map(l => `
            <a href="${esc(l.url)}" target="_blank" class="hero-link ${l.key === 'email' ? 'email-cta' : 'social-icon'}">
                <span class="icon">${l.icon}</span>
                <span class="label">${esc(l.label)}</span>
            </a>`).join('') + (editMode ? `<button class="hero-link social-icon" onclick="openEditPersonal()" style="background:var(--primary); color:#fff">✏️</button>` : '');
    }
}

function renderTabs() {
    const tabs = [['production', '🏢 Production'], ['competition', '🏅 Competition'], ['academic', '🎓 Academic'], ['personal', '💡 Personal'], ['opensource', '🔓 Open Source']];
    const container = document.getElementById('expTabs');
    if (container) container.innerHTML = tabs.map(([k, l]) => `<button class="tab-btn${currentTab === k ? ' active' : ''}" onclick="switchTab('${k}')">${l}</button>`).join('');
}

function renderProjects() {
    const arr = data.experience[currentTab] || [];
    const container = document.getElementById('projectsGrid');
    if (!container) return;
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

function renderAll() { 
    renderHero(); 
    renderTabs(); 
    renderProjects(); 
    // Render other sections as needed
}

function switchTab(t) { currentTab = t; renderAll(); }

const ADMIN_PASSWORD = "1234";

function toggleEditMode() {
    if (!editMode) {
        const pw = prompt("กรุณาใส่รหัสผ่านเพื่อเข้าสู่โหมดแก้ไข:");
        if (pw !== ADMIN_PASSWORD) {
            alert("รหัสผ่านไม่ถูกต้อง!");
            return;
        }
    }
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    const btn = document.getElementById('editToggleBtn');
    if (btn) btn.textContent = editMode ? '✓ Save' : '✏ Edit Portfolio';
    document.getElementById('editBar').style.display = editMode ? 'flex' : 'none';
    if (!editMode) { save(); }
    renderAll();
}

// MODAL LOGIC
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
    const body = fld('p_name', 'Full Name', p.name) + fld('p_avatar', 'Profile Image URL', p.avatar) + fld('p_title', 'Title', p.title) + fld('p_uni', 'University', p.university) + fld('p_skills', 'Skills (comma separated)', p.skills.join(', ')) + fld('c_email', 'Email', c.email) + fld('c_github', 'GitHub', c.github) + fld('c_linkedin', 'LinkedIn', c.linkedin) + fld('c_website', 'Website', c.website);
    openModal('Edit Personal Info', body, () => {
        p.name = g('p_name'); p.avatar = g('p_avatar'); p.title = g('p_title'); p.university = g('p_uni'); p.skills = g('p_skills').split(',').map(s => s.trim());
        c.email = g('c_email'); c.github = g('c_github'); c.linkedin = g('c_linkedin'); c.website = g('c_website');
        renderAll();
    });
}

function openEditProject(id) {
    const p = data.experience[currentTab].find(x => x.id === id);
    if (!p) return;
    const body = fld('p_name', 'Project Name', p.name) + fld('p_img', 'Image URL', p.img) + fld('p_role', 'Role', p.role) + fld('p_year', 'Year', p.year) + fld('p_link', 'Result Link', p.link) + txt('p_desc', 'Description', p.description);
    openModal('Edit Project', body, () => {
        Object.assign(p, { name: g('p_name'), img: g('p_img'), role: g('p_role'), year: g('p_year'), link: g('p_link'), description: g('p_desc') });
        renderAll();
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('portfolio_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('portfolio_theme') === 'light') document.body.classList.add('light-mode');
    loadData();
});
