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
        t.textContent = msg; t.style.transform = 'translateY(0)';
        setTimeout(() => t.style.transform = 'translateY(200%)', 2500); 
    }
};

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function loadData() {
    try {
        const local = localStorage.getItem('portfolio');
        if (local) data = JSON.parse(local);
        if (dbClient) {
            const { data: dbData } = await dbClient.from('Portfolio_data').select('content').eq('id', 'main_portfolio').single();
            if (dbData && dbData.content) data = dbData.content;
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
    if (nameEl) nameEl.innerHTML = `${esc(p.name)} ${editMode ? `<button class="edit-btn-text" onclick="openEditPersonal()">✏️</button>` : ''}`;
    if (document.getElementById('heroTitle')) document.getElementById('heroTitle').textContent = p.title;
    if (document.getElementById('heroUni')) document.getElementById('heroUni').textContent = p.university;
    if (document.getElementById('heroBio')) document.getElementById('heroBio').innerHTML = `${esc(p.bio)} ${editMode ? `<br><button class="edit-btn-text" onclick="openEditPersonal()">✏️ Edit Bio</button>` : ''}`;
    const skillsEl = document.getElementById('heroSkills');
    if (skillsEl) skillsEl.innerHTML = (p.skills || []).map(s => `<span class="skill-tag">${esc(s)}</span>`).join('') + (editMode ? `<button class="skill-tag" onclick="openEditPersonal()" style="border:1px dashed var(--primary); color:var(--primary)">+ Edit</button>` : '');
    const linksCont = document.getElementById('heroLinks');
    if (linksCont) {
        const links = [{ key: 'email', icon: '✉️', label: 'Contact Me', url: `mailto:${c.email}` }, { key: 'github', icon: '⌥', label: 'GitHub', url: c.github }, { key: 'linkedin', icon: 'in', label: 'LinkedIn', url: c.linkedin }, { key: 'website', icon: '🌐', label: 'Website', url: c.website }].filter(l => c[l.key]);
        linksCont.innerHTML = links.map(l => `<a href="${esc(l.url)}" target="_blank" class="hero-link ${l.key === 'email' ? 'email-cta' : 'social-icon'}"><span class="icon">${l.icon}</span><span class="label">${esc(l.label)}</span></a>`).join('') + (editMode ? `<button class="hero-link social-icon" onclick="openEditPersonal()" style="background:var(--primary); color:#fff">✏️</button>` : '');
    }
}

function renderProjects() {
    const arr = data.experience[currentTab] || [];
    const container = document.getElementById('projectsGrid');
    if (!container) return;
    const addBtn = document.getElementById('addProjectBtn');
    if (addBtn) { addBtn.style.display = editMode ? 'inline-block' : 'none'; addBtn.onclick = openAddProject; }
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
    if (btnC) { btnC.style.display = editMode ? 'inline-block' : 'none'; btnC.onclick = () => openAddItem('cert'); }
    if (btnW) { btnW.style.display = editMode ? 'inline-block' : 'none'; btnW.onclick = () => openAddItem('workshop'); }
    
    const renderItem = (i, type) => `
        <div class="item-row-card">
            ${i.img ? `<img src="${esc(i.img)}" class="item-img-mini">` : ''}
            <div class="item-info">
                <strong>${esc(i.name)}</strong> ${i.provider ? `• ${esc(i.provider)}` : ''}
                ${editMode ? `
                    <div class="item-actions">
                        <button onclick="openEditItem('${type}','${i.id}')">✏️ Edit</button>
                        <button onclick="deleteItem('${type}','${i.id}')">✕</button>
                    </div>` : ''}
            </div>
        </div>`;

    document.getElementById('certsGrid').innerHTML = (data.selfDev.certs || []).map(i => renderItem(i, 'certs')).join('');
    document.getElementById('workshopsGrid').innerHTML = (data.selfDev.workshops || []).map(i => renderItem(i, 'workshops')).join('');
}

function renderAwards() {
    const btnC = document.getElementById('addCompBtn');
    if (btnC) { btnC.style.display = editMode ? 'inline-block' : 'none'; btnC.onclick = () => openAddItem('competition_award'); }
    const compGrid = document.getElementById('competitionsGrid');
    if (compGrid) {
        compGrid.innerHTML = (data.awards.competitions || []).map(i => `
            <div class="item-row-card">
                ${i.img ? `<img src="${esc(i.img)}" class="item-img-mini">` : ''}
                <div class="item-info">
                    <strong>${esc(i.result)}</strong> - ${esc(i.name)}
                    ${editMode ? `
                        <div class="item-actions">
                            <button onclick="openEditItem('competitions','${i.id}')">✏️ Edit</button>
                            <button onclick="deleteItem('competitions','${i.id}')">✕</button>
                        </div>` : ''}
                </div>
            </div>`).join('');
    }
}

function renderLeadership() {
    const container = document.getElementById('leadershipGrid');
    const btn = document.getElementById('addLeaderBtn');
    if (btn) { btn.style.display = editMode ? 'inline-block' : 'none'; btn.onclick = () => openAddItem('leadership'); }
    if (container) {
        container.innerHTML = (data.leadership || []).map(i => `
            <div class="activity-card">
                ${i.img ? `<img class="activity-img" src="${esc(i.img)}">` : `<div class="activity-img" style="background:rgba(255,255,255,0.05)"></div>`}
                <div class="activity-info">
                    <span class="activity-role">${esc(i.role || 'Role')}</span>
                    <h3 class="activity-name">${esc(i.name || 'Activity Name')}</h3>
                    <span class="activity-org">${esc(i.org || 'Organization')} • ${esc(i.date || 'Date')}</span>
                    <p class="activity-desc">${esc(i.desc || '')}</p>
                    ${editMode ? `<div class="card-actions" style="display:flex !important;"><button onclick="openEditLeadership('${i.id}')" style="display:inline-block !important;">✏ Edit</button><button onclick="deleteItem('leadership','${i.id}')" style="display:inline-block !important;">🗑 Del</button></div>` : ''}
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

// --- SECRET EDIT TRIGGER (HIDDEN ON 'CSS' SKILL TAG) ---
document.addEventListener('dblclick', (e) => {
    // เข้าโหมดแก้ไขเมื่อดับเบิลคลิกที่คำว่า "CSS" เท่านั้น
    if (e.target.innerText === 'CSS' || e.target.textContent === 'CSS') {
        toggleEditMode();
    }
});



// ซ่อนปุ่ม Edit ทุกตัวเพื่อความเป็นส่วนตัว
setInterval(() => {
    ['editToggleBtn', 'edit-mode-toggle', 'btn-edit-toggle'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = 'none';
    });
}, 500);

function toggleEditMode() {
    const pw = prompt("กรุณาใส่รหัสผ่านลับ:");
    if (pw === "1234") {
        editMode = !editMode;
        document.body.classList.toggle('edit-mode', editMode);
        const editBar = document.getElementById('editBar');
        if (editBar) editBar.style.display = editMode ? 'flex' : 'none';
        if (!editMode) save();
        renderAll();
        toast(editMode ? "Admin Mode: ON ✏️" : "Admin Mode: OFF 🔒");
    } else if (pw !== null) {
        alert("รหัสไม่ถูกต้องครับ");
    }
}

const openModal = (title, fieldsHtml, saveFn) => {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalFields').innerHTML = fieldsHtml;
    modalSave = saveFn;
    document.getElementById('modal').classList.add('show');
};
const closeModal = () => document.getElementById('modal').classList.remove('show');
document.getElementById('modalSaveBtn').onclick = () => { if (modalSave) modalSave(); closeModal(); };

// เน้นช่อง Image URL ให้เป็นสีพิเศษ
const imgFld = (id, label, val = '') => `<div class="f-group img-field"><label style="color:#00e5ff; font-weight:bold;">📸 ${label} (วางลิงก์รูปที่นี่)</label><input id="f_${id}" value="${esc(val)}" placeholder="https://example.com/image.jpg"></div>`;
const fld = (id, label, val = '') => `<div class="f-group"><label>${label}</label><input id="f_${id}" value="${esc(val)}"></div>`;
const txt = (id, label, val = '') => `<div class="f-group"><label>${label}</label><textarea id="f_${id}">${esc(val)}</textarea></div>`;
const g = id => document.getElementById('f_' + id)?.value || '';

function openEditPersonal() {
    const p = data.personal, c = p.contact;
    const body = fld('p_name', 'Full Name', p.name) + imgFld('p_avatar', 'Avatar / Profile Image', p.avatar) + fld('p_title', 'Title', p.title) + fld('p_uni', 'University', p.university) + fld('p_skills', 'Skills (CSV)', (p.skills||[]).join(',')) + fld('c_email', 'Email', c.email) + fld('c_github', 'GitHub', c.github) + fld('c_linkedin', 'LinkedIn', c.linkedin) + fld('c_website', 'Web', c.website);
    openModal('Edit Personal Info', body, () => {
        p.name = g('p_name'); p.avatar = g('p_avatar'); p.title = g('p_title'); p.university = g('p_uni'); p.skills = g('p_skills').split(',').map(s=>s.trim());
        c.email = g('c_email'); c.github = g('c_github'); c.linkedin = g('c_linkedin'); c.website = g('c_website');
        renderAll();
    });
}

function openAddProject() {
    const body = fld('p_name', 'Project Name') + imgFld('p_img', 'Project Image') + fld('p_role', 'Your Role') + fld('p_year', 'Year') + fld('p_link', 'Project Link') + txt('p_desc', 'Description');
    openModal('Add New Project', body, () => {
        const p = { id: uid(), name: g('p_name'), img: g('p_img'), role: g('p_role'), year: g('p_year'), description: g('p_desc'), link: g('p_link') };
        if (!data.experience[currentTab]) data.experience[currentTab] = [];
        data.experience[currentTab].unshift(p);
        renderAll();
    });
}

function openEditProject(id) {
    const p = data.experience[currentTab].find(x => x.id === id);
    if (!p) return;
    const body = fld('p_name', 'Project Name', p.name) + imgFld('p_img', 'Project Image', p.img) + fld('p_role', 'Your Role', p.role) + fld('p_year', 'Year', p.year) + fld('p_link', 'Project Link', p.link) + txt('p_desc', 'Description', p.description);
    openModal('Edit Project', body, () => { Object.assign(p, { name: g('p_name'), img: g('p_img'), role: g('p_role'), year: g('p_year'), link: g('p_link'), description: g('p_desc') }); renderAll(); });
}

function openAddItem(type) {
    let body = '';
    if (type === 'cert') body = fld('i_name', 'Cert Name') + fld('i_prov', 'Provider') + imgFld('i_img', 'Certificate Image');
    else if (type === 'workshop') body = fld('i_name', 'Workshop Name') + imgFld('i_img', 'Workshop Image');
    else if (type === 'competition_award') body = fld('i_name', 'Award Name') + fld('i_res', 'Result') + imgFld('i_img', 'Award Image');
    else if (type === 'leadership') body = fld('i_name', 'Activity') + fld('i_role', 'Role') + fld('i_org', 'Org') + fld('i_date', 'Date') + imgFld('i_img', 'Activity Image') + txt('i_desc', 'Desc');

    openModal('Add New Item', body, () => {
        const item = { id: uid() };
        if (type === 'cert') Object.assign(item, { name: g('i_name'), provider: g('i_prov'), img: g('i_img') });
        else if (type === 'workshop') Object.assign(item, { name: g('i_name'), img: g('i_img') });
        else if (type === 'competition_award') Object.assign(item, { name: g('i_name'), result: g('i_res'), img: g('i_img') });
        else if (type === 'leadership') Object.assign(item, { name: g('i_name'), role: g('i_role'), org: g('i_org'), date: g('i_date'), desc: g('i_desc'), img: g('i_img') });

        if (type === 'cert') data.selfDev.certs.push(item);
        else if (type === 'workshop') data.selfDev.workshops.push(item);
        else if (type === 'competition_award') data.awards.competitions.push(item);
        else if (type === 'leadership') data.leadership.push(item);
        renderAll();
    });
}

function openEditItem(type, id) {
    let item;
    if (type === 'certs') item = data.selfDev.certs.find(x => x.id === id);
    else if (type === 'workshops') item = data.selfDev.workshops.find(x => x.id === id);
    else if (type === 'competitions') item = data.awards.competitions.find(x => x.id === id);
    if (!item) return;

    let body = '';
    if (type === 'certs') body = fld('i_name', 'Cert Name', item.name) + fld('i_prov', 'Provider', item.provider) + imgFld('i_img', 'Certificate Image', item.img);
    else if (type === 'workshops') body = fld('i_name', 'Workshop Name', item.name) + imgFld('i_img', 'Workshop Image', item.img);
    else if (type === 'competitions') body = fld('i_res', 'Result', item.result) + fld('i_name', 'Award Name', item.name) + imgFld('i_img', 'Award Image', item.img);

    openModal('Edit Item', body, () => {
        if (type === 'certs') Object.assign(item, { name: g('i_name'), provider: g('i_prov'), img: g('i_img') });
        else if (type === 'workshops') Object.assign(item, { name: g('i_name'), img: g('i_img') });
        else if (type === 'competitions') Object.assign(item, { result: g('i_res'), name: g('i_name'), img: g('i_img') });
        renderAll();
    });
}

function openEditLeadership(id) {
    const i = data.leadership.find(x => x.id === id);
    if (!i) return;
    const body = fld('i_name', 'Activity', i.name) + fld('i_role', 'Role', i.role) + fld('i_org', 'Org', i.org) + fld('i_date', 'Date', i.date) + imgFld('i_img', 'Activity Image', i.img) + txt('i_desc', 'Desc', i.desc);
    openModal('Edit Activity', body, () => { Object.assign(i, { name: g('i_name'), role: g('i_role'), org: g('i_org'), date: g('i_date'), desc: g('i_desc'), img: g('i_img') }); renderAll(); });
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
