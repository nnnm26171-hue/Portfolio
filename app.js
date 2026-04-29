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
                .from('Portfolio_data')
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
    try {
        const local = localStorage.getItem('portfolio');
        if (local) data = JSON.parse(local);

        if (dbClient) {
            const { data: dbData } = await dbClient
                .from('Portfolio_data')
                .select('content')
                .eq('id', 'main_portfolio')
                .single();
            
            if (dbData && dbData.content) {
                data = dbData.content;
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
    }
    if (document.getElementById('heroTitle')) document.getElementById('heroTitle').textContent = p.title;
    if (document.getElementById('heroUni')) document.getElementById('heroUni').textContent = p.university;
    if (document.getElementById('heroBio')) document.getElementById('heroBio').innerHTML = `${esc(p.bio)} ${editMode ? `<br><button class="edit-btn-text" onclick="openEditPersonal()">✏️ Edit Bio</button>` : ''}`;
    const skillsEl = document.getElementById('heroSkills');
    if (skillsEl) {
        skillsEl.innerHTML = (p.skills || []).map(s => `<span class="skill-tag">${esc(s)}</span>`).join('') + (editMode ? `<button class="skill-tag" onclick="openEditPersonal()" style="border:1px dashed var(--primary); color:var(--primary)">+ Edit</button>` : '');
    }
    const linksCont = document.getElementById('heroLinks');
    if (linksCont) {
        const links = [
            { key: 'email', icon: '✉️', label: 'Email', url: `mailto:${c.email}` },
            { key: 'github', icon: '⌥', label: 'GitHub', url: c.github },
            { key: 'linkedin', icon: 'in', label: 'LinkedIn', url: c.linkedin },
            { key: 'website', icon: '🌐', label: 'Website', url: c.website }
        ].filter(l => c[l.key]);
        linksCont.innerHTML = links.map(l => `<a href="${esc(l.url)}" target="_blank" class="hero-link ${l.key === 'email' ? 'email-cta' : 'social-icon'}"><span class="icon">${l.icon}</span><span class="label">${esc(l.label)}</span></a>`).join('') + (editMode ? `<button class="hero-link social-icon" onclick="openEditPersonal()" style="background:var(--primary); color:#fff">✏️</button>` : '');
    }
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
                    ${editMode ? `<button onclick="openEditProject('${p.id}')">✏ Edit</button><button onclick="deleteProject('${p.id}')">🗑 Del</button>` : ''}
                </div>
            </div>
        </div>`).join('');
}

function renderSelfDev() {
    const btnC = document.getElementById('addCertBtn'), btnW = document.getElementById('addWorkshopBtn');
    if (btnC) btnC.style.display = editMode ? 'inline-block' : 'none';
    if (btnW) btnW.style.display = editMode ? 'inline-block' : 'none';
    document.getElementById('certsGrid').innerHTML = (data.selfDev.certs || []).map(i => `<div class="item-row"><span>${esc(i.name)} (${esc(i.provider)})</span> ${editMode ? `<button onclick="deleteItem('certs','${i.id}')">x</button>` : ''}</div>`).join('');
    document.getElementById('workshopsGrid').innerHTML = (data.selfDev.workshops || []).map(i => `<div class="item-row"><span>${esc(i.name)}</span> ${editMode ? `<button onclick="deleteItem('workshops','${i.id}')">x</button>` : ''}</div>`).join('');
}

function renderAwards() {
    const btnC = document.getElementById('addCompBtn');
    if (btnC) btnC.style.display = editMode ? 'inline-block' : 'none';
    const compGrid = document.getElementById('competitionsGrid');
    if (compGrid) compGrid.innerHTML = (data.awards.competitions || []).map(i => `<div class="item-row"><span>${esc(i.result)} - ${esc(i.name)}</span> ${editMode ? `<button onclick="deleteItem('competitions','${i.id}')">🗑</button>` : ''}</div>`).join('');
}

function renderLeadership() {
    const container = document.getElementById('leadershipGrid');
    const btn = document.getElementById('addLeaderBtn');
    if (btn) btn.style.display = editMode ? 'inline-block' : 'none';
    if (container) {
        container.innerHTML = (data.leadership || []).map(i => `
            <div class="activity-card">
                ${i.img ? `<img class="activity-img" src="${esc(i.img)}">` : `<div class="activity-img"></div>`}
                <div class="activity-info">
                    <span class="activity-role">${esc(i.role)}</span>
                    <h3 class="activity-name">${esc(i.name)}</h3>
                    <span class="activity-org">${esc(i.org)} • ${esc(i.date)}</span>
                    <p class="activity-desc">${esc(i.desc)}</p>
                    ${editMode ? `<div class="card-actions"><button onclick="openEditLeadership('${i.id}')">✏ Edit</button><button onclick="deleteItem('leadership','${i.id}')">🗑 Del</button></div>` : ''}
                </div>
            </div>`).join('');
    }
}

function renderAll() { 
    renderHero(); 
    const tabs = document.getElementById('expTabs');
    if (tabs) {
        const tabList = [['production', '🏢 Production'], ['competition', '🏅 Competition'], ['academic', '🎓 Academic'], ['personal', '💡 Personal'], ['opensource', '🔓 Open Source']];
        tabs.innerHTML = tabList.map(([k, l]) => `<button class="tab-btn${currentTab === k ? ' active' : ''}" onclick="switchTab('${k}')">${l}</button>`).join('');
    }
    renderProjects(); renderSelfDev(); renderAwards(); renderLeadership(); 
}

function switchTab(t) { currentTab = t; renderAll(); }

function toggleEditMode() {
    if (!editMode) {
        const pw = prompt("กรุณาใส่รหัสผ่านเพื่อเข้าสู่โหมดแก้ไข:");
        if (pw !== "1234") { alert("รหัสผ่านไม่ถูกต้อง!"); return; }
    }
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    const btn = document.getElementById('editToggleBtn');
    if (btn) btn.textContent = editMode ? '✓ Save' : 'Edit';
    document.getElementById('editBar').style.display = editMode ? 'flex' : 'none';
    if (!editMode) save();
    renderAll();
}

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
    const body = fld('p_name', 'Name', p.name) + fld('p_avatar', 'Avatar URL', p.avatar) + fld('p_title', 'Title', p.title) + fld('p_uni', 'University', p.university) + fld('p_skills', 'Skills (CSV)', (p.skills||[]).join(',')) + fld('c_email', 'Email', c.email) + fld('c_github', 'GitHub', c.github) + fld('c_linkedin', 'LinkedIn', c.linkedin) + fld('c_website', 'Web', c.website);
    openModal('Edit Personal', body, () => {
        p.name = g('p_name'); p.avatar = g('p_avatar'); p.title = g('p_title'); p.university = g('p_uni'); p.skills = g('p_skills').split(',').map(s=>s.trim());
        c.email = g('c_email'); c.github = g('c_github'); c.linkedin = g('c_linkedin'); c.website = g('c_website');
        renderAll();
    });
}

function openAddProject() {
    const body = fld('p_name', 'Name') + fld('p_role', 'Role') + fld('p_year', 'Year') + txt('p_desc', 'Description');
    openModal('Add Project', body, () => {
        const p = { id: uid(), name: g('p_name'), role: g('p_role'), year: g('p_year'), description: g('p_desc'), img: '', link: '' };
        if (!data.experience[currentTab]) data.experience[currentTab] = [];
        data.experience[currentTab].unshift(p);
        renderAll();
    });
}

function openEditProject(id) {
    const p = data.experience[currentTab].find(x => x.id === id);
    if (!p) return;
    const body = fld('p_name', 'Name', p.name) + fld('p_role', 'Role', p.role) + fld('p_year', 'Year', p.year) + txt('p_desc', 'Desc', p.description);
    openModal('Edit Project', body, () => { Object.assign(p, { name: g('p_name'), role: g('p_role'), year: g('p_year'), description: g('p_desc') }); renderAll(); });
}

function openAddItem(type) {
    let body = '';
    if (type === 'cert') body = fld('i_name', 'Cert Name') + fld('i_prov', 'Provider');
    else if (type === 'workshop') body = fld('i_name', 'Workshop Name');
    else if (type === 'competition_award') body = fld('i_name', 'Award Name') + fld('i_res', 'Result');
    else if (type === 'leadership') body = fld('i_name', 'Activity') + fld('i_role', 'Role') + fld('i_org', 'Org') + fld('i_date', 'Date') + txt('i_desc', 'Desc');

    openModal('Add Item', body, () => {
        const item = { id: uid() };
        if (type === 'cert') Object.assign(item, { name: g('i_name'), provider: g('i_prov') });
        else if (type === 'workshop') Object.assign(item, { name: g('i_name') });
        else if (type === 'competition_award') Object.assign(item, { name: g('i_name'), result: g('i_res') });
        else if (type === 'leadership') Object.assign(item, { name: g('i_name'), role: g('i_role'), org: g('i_org'), date: g('i_date'), desc: g('i_desc') });

        if (type === 'cert') data.selfDev.certs.push(item);
        else if (type === 'workshop') data.selfDev.workshops.push(item);
        else if (type === 'competition_award') data.awards.competitions.push(item);
        else if (type === 'leadership') data.leadership.push(item);
        renderAll();
    });
}

function openEditLeadership(id) {
    const i = data.leadership.find(x => x.id === id);
    if (!i) return;
    const body = fld('i_name', 'Activity', i.name) + fld('i_role', 'Role', i.role) + fld('i_org', 'Org', i.org) + fld('i_date', 'Date', i.date) + txt('i_desc', 'Desc', i.desc);
    openModal('Edit Activity', body, () => { Object.assign(i, { name: g('i_name'), role: g('i_role'), org: g('i_org'), date: g('i_date'), desc: g('i_desc') }); renderAll(); });
}

function deleteProject(id) { data.experience[currentTab] = data.experience[currentTab].filter(x => x.id !== id); renderAll(); }
function deleteItem(type, id) {
    if (type === 'certs') data.selfDev.certs = data.selfDev.certs.filter(x => x.id !== id);
    else if (type === 'workshops') data.selfDev.workshops = data.selfDev.workshops.filter(x => x.id !== id);
    else if (type === 'competitions') data.awards.competitions = data.awards.competitions.filter(x => x.id !== id);
    else if (type === 'leadership') data.leadership = data.leadership.filter(x => x.id !== id);
    renderAll();
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('portfolio_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('portfolio_theme') === 'light') document.body.classList.add('light-mode');
    loadData();
});
