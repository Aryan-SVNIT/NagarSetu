(() => {
  'use strict';
  const API_BASE = (window.CIVICLENS_API_BASE || window.NAGARSETU_API_BASE || localStorage.getItem('civiclens_api_base') || (location.port === '5500' ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '');
  const TOKEN_KEY='civiclens_access_token', USER_KEY='civiclens_user', LAST_SUBMISSION='civiclens_last_submission';
  const ROLE_TOKEN={citizen:'civiclens_citizen_access_token',admin:'civiclens_admin_access_token'}, ROLE_USER={citizen:'civiclens_citizen_user',admin:'civiclens_admin_user'};
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dateLabel=v=>{const d=v&&new Date(v);return d&&!Number.isNaN(d.getTime())?d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Recently'};
  const currentRole=()=>location.pathname.toLowerCase().includes('/admin/')?'admin':'citizen';
  const token=()=>localStorage.getItem(ROLE_TOKEN[currentRole()])||localStorage.getItem(TOKEN_KEY);
  const user=()=>{try{return JSON.parse(localStorage.getItem(ROLE_USER[currentRole()])||localStorage.getItem(USER_KEY)||'null')}catch{return null}};
  const save=p=>{const role=(p.user&&p.user.role)||currentRole();if(p.access_token)localStorage.setItem(ROLE_TOKEN[role],p.access_token);if(p.user)localStorage.setItem(ROLE_USER[role],JSON.stringify(p.user));};
  
  async function api(path,opt={}){
    const form=opt.body instanceof FormData;
    const headers={...(form?{}:{'Content-Type':'application/json'}),...(opt.headers||{})};
    if(token())headers.Authorization=`Bearer ${token()}`;
    let r;
    try{
      r=await fetch(API_BASE+path,{...opt,headers});
    }catch{
      throw Error('Backend unavailable. Start the NagarSetu server and try again.');
    }
    let p={};
    try{p=await r.json()}catch{}
    if(!r.ok)throw Error(p.detail||({401:'Please sign in again.',403:'You do not have permission.',404:'Not found.',413:'Image is too large.',415:'Unsupported image format.'}[r.status]||`Request failed (${r.status})`));
    return p;
  }

  function notice(msg,kind='info'){
    let n=$('#civiclens-notice');
    if(!n){
      n=document.createElement('div');
      n.id='civiclens-notice';
      document.body.appendChild(n);
    }
    const isErr=kind==='error';
    const isSuccess=kind==='success';
    const bgStyle=isErr
      ?'background:#fef2f2;color:#991b1b;border:1px solid #fecaca;box-shadow:0 10px 25px -5px rgba(239,68,68,0.2)'
      :(isSuccess
        ?'background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;box-shadow:0 10px 25px -5px rgba(34,197,94,0.2)'
        :'background:#0f172a;color:#ffffff;border:1px solid #1e293b;box-shadow:0 10px 25px -5px rgba(15,23,42,0.3)');
    const icon=isErr?'⚠️':(isSuccess?'✅':'ℹ️');
    n.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;border-radius:12px;padding:12px 18px;font:600 13px/18px Inter,sans-serif;display:flex;align-items:center;gap:10px;transition:all 0.25s ease-out;${bgStyle}`;
    n.innerHTML=`<span style="font-size:16px">${icon}</span><span>${esc(msg)}</span>`;
    clearTimeout(n._t);
    n._t=setTimeout(()=>{
      n.style.opacity='0';
      n.style.transform='translateY(-6px)';
      setTimeout(()=>n.remove(),300);
    },4500);
  }

  function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
  function go(p){location.href=p}

  function addStyles(){
    if($('#civiclens-runtime-css'))return;
    const s=document.createElement('style');
    s.id='civiclens-runtime-css';
    s.textContent=`
      *,*::before,*::after{box-sizing:border-box}
      body{overflow-x:hidden!important}
      img{max-width:100%}
      .civiclens-report-card{min-width:0;overflow:hidden;transition:all .2s ease;border:1px solid #e2e8f0;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
      .civiclens-report-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px -5px rgba(15,23,42,.08);border-color:#cbd5e1}
      .civiclens-report-card h4,.civiclens-report-card p{overflow-wrap:break-word;word-break:normal;white-space:normal}
      #report-map,#admin-map{min-height:360px;height:100%;z-index:1;border-radius:12px}
      .leaflet-container{font:14px Inter,system-ui,sans-serif}
      .leaflet-popup-content{line-height:1.45}
      .material-symbols-outlined{display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;line-height:1;vertical-align:middle}
      .material-symbols-outlined svg{width:100%;height:100%;display:block}
      .civiclens-citizen-header{width:100%!important;max-width:1140px!important;margin-left:auto!important;margin-right:auto!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:20px!important}
      .civiclens-citizen-logout{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;font:600 13px/18px Inter,sans-serif;cursor:pointer;white-space:nowrap;transition:all .15s}
      .civiclens-citizen-logout:hover{background:#f1f5f9;border-color:#0d9488;color:#0d9488}
      .civiclens-citizen-logout svg{width:16px;height:16px;flex:0 0 16px}
      .civiclens-admin-brand{padding:14px 14px 22px;color:#fff}
      .civiclens-admin-brand h1{margin:0;font:800 20px/26px 'Manrope',sans-serif;letter-spacing:-.5px;color:#fff}
      .civiclens-admin-brand p{margin:2px 0 0;color:rgba(255,255,255,.68);font:500 12px/16px Inter,sans-serif}
      .civiclens-admin-links,.civiclens-admin-bottom{display:flex;flex-direction:column;gap:6px}
      .civiclens-admin-bottom{margin-top:auto;border-top:1px solid rgba(255,255,255,.14);padding-top:16px}
      .civiclens-admin-link{display:flex!important;align-items:center!important;gap:12px!important;width:100%;padding:11px 14px!important;border:0;background:transparent;color:rgba(255,255,255,.76);text-decoration:none;border-radius:10px;font:600 13px/18px Inter,sans-serif;cursor:pointer;text-align:left;transition:all .15s}
      .civiclens-admin-link svg{width:20px;height:20px;flex:0 0 20px}
      .civiclens-admin-link:hover{background:rgba(255,255,255,.09);color:#fff}
      .civiclens-admin-link.civiclens-active{background:#0d9488;color:#fff;box-shadow:0 3px 10px rgba(13,148,136,.3)}
      .civiclens-logout{color:#fda4af}
      .civiclens-logout:hover{background:rgba(239,68,68,.14)!important;color:#fee2e2!important}
      .civiclens-ai-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font:600 12px/16px Inter,sans-serif}
      .civiclens-ai-risk{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
      .civiclens-ai-info{background:#f0fdfa;color:#0f766e;border:1px solid #ccfbf1}
      .civiclens-ai-muted{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
      .civiclens-evidence-request-banner{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;margin:0 0 24px;padding:16px 20px;border:1px solid #fcd34d;border-radius:14px;background:#fffbeb;color:#92400e;box-shadow:0 4px 16px rgba(245,158,11,.1);font:500 14px/22px Inter,sans-serif}
      .civiclens-evidence-request-banner button{border:0;border-radius:10px;padding:10px 16px;background:#d97706;color:#fff;font:700 13px/18px Inter,sans-serif;cursor:pointer;white-space:nowrap;transition:background .15s}
      .civiclens-evidence-request-banner button:hover{background:#b45309}
      .civiclens-verify-banner{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;margin:0 0 24px;padding:16px 20px;border:1px solid #0d9488;border-radius:14px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;cursor:pointer;text-align:left;box-shadow:0 8px 24px rgba(15,23,42,.15);font:500 14px/22px Inter,sans-serif;transition:transform .15s}
      .civiclens-verify-banner:hover{transform:translateY(-1px)}
      .civiclens-verify-banner svg{width:26px;height:26px;flex:0 0 26px;color:#14b8a6}
      .civiclens-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.6);backdrop-filter:blur(6px);z-index:250;display:flex;align-items:center;justify-content:center;padding:16px}
      .civiclens-modal{background:#ffffff;color:#0f172a;border-radius:18px;max-width:540px;width:100%;max-height:90vh;overflow:auto;padding:26px;box-shadow:0 24px 60px rgba(15,23,42,.2);border:1px solid #e2e8f0}
      .civiclens-modal h2{margin:0 0 14px;font:700 22px/28px 'Manrope',sans-serif;color:#0f172a}
      .civiclens-modal button{cursor:pointer}
      .civiclens-modal .close{float:right;border:0;background:transparent;font-size:24px;color:#64748b;line-height:1}
      .civiclens-modal .close:hover{color:#0f172a}
      .civiclens-field{width:100%;padding:10px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;margin:6px 0 14px;font-family:Inter,sans-serif;color:#0f172a}
      .civiclens-field:focus{outline:2px solid #0d9488;border-color:#0d9488}
      .civiclens-primary{background:#0f172a;color:#fff;border:0;border-radius:10px;padding:10px 18px;font:700 13px Inter,sans-serif;cursor:pointer;transition:background .15s}
      .civiclens-primary:hover{background:#1e293b}
      .civiclens-secondary{background:#fff;border:1px solid #cbd5e1;color:#0f172a;border-radius:10px;padding:10px 18px;font:600 13px Inter,sans-serif;cursor:pointer;transition:all .15s}
      .civiclens-secondary:hover{background:#f8fafc;border-color:#94a3b8}
      .civiclens-admin-report{border:1px solid #e2e8f0;border-radius:14px;padding:18px;background:#fff;min-width:0;box-shadow:0 1px 3px rgba(0,0,0,.03)}
      .civiclens-admin-report-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
      .civiclens-admin-report-top b{color:#0f172a;font-size:16px;display:block}
      .civiclens-report-status{display:inline-block;margin-top:6px;padding:3px 9px;border-radius:999px;background:#f1f5f9;color:#334155;font-size:11px;font-weight:600;text-transform:capitalize}
      .civiclens-admin-report p{margin:10px 0;color:#475569;font-size:14px;line-height:1.5;overflow-wrap:anywhere}
      .civiclens-admin-report-meta{display:flex;flex-wrap:wrap;gap:8px 14px;color:#64748b;font-size:12px;margin-bottom:14px}
      .civiclens-admin-report button{border:0;border-radius:8px;background:#0f172a;color:#fff;padding:8px 14px;font-weight:700;font-size:13px;cursor:pointer;transition:background .15s}
      .civiclens-admin-report button:hover{background:#0d9488}
      .civiclens-priority-high{color:#e11d48;font-weight:700;font-size:12px}
      .civiclens-priority-medium{color:#f59e0b;font-weight:700;font-size:12px}
      .civiclens-priority-low{color:#10b981;font-weight:700;font-size:12px}
      .civiclens-empty{padding:28px;text-align:center;color:#64748b;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;font-size:14px}
      @media(max-width:800px){
        nav[class*="fixed"]{width:270px!important;transform:translateX(-100%);transition:transform .25s ease-in-out;z-index:90}
        nav.civiclens-mobile-open{transform:translateX(0)!important}
        body{padding-bottom:12px}
        .ml-64{margin-left:0!important}
        .w-\[calc\(100%-16rem\)\]{width:100%!important}
        .p-8{padding:16px!important}
        .h-\[calc\(100vh-4rem\)\]{height:auto!important;min-height:calc(100vh - 4rem)}
        header{padding-left:16px!important;padding-right:16px!important}
        .civiclens-mobile-menu{display:flex!important}
      }
      .civiclens-mobile-menu{display:none;position:fixed;top:12px;left:12px;z-index:240;border:0;border-radius:10px;background:#0f172a;color:white;padding:10px;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)}
    `;
    document.head.appendChild(s);
  }

  const ICON_PATHS={
    group_work:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="m8 7.5 2.5 7M16 7.5l-2.5 7M8.5 6h7"/>',
    priority_high:'<path d="M12 4v10M12 19h.01"/><path d="M5 21h14L12 3 5 21Z"/>',
    bar_chart:'<path d="M5 20V10M12 20V4M19 20v-7M3 20h18"/>',
    notifications:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    chat_bubble:'<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.7-.8L4 20l1.7-3.6A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.7a7 7 0 0 0-2 1.2L5 5.9 3 9.3l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.4 1.3c-.8 1-2.1 1.3-2.1 2.8M12 16h.01"/>',
    account_circle:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6.5 18c1.2-2.5 3-3.5 5.5-3.5s4.3 1 5.5 3.5"/>',
    shield_admin:'<path d="M12 3 19 6v5c0 4.4-2.7 8-7 10-4.3-2-7-5.6-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/>',
    verified:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    assignment:'<rect x="6" y="4" width="12" height="17" rx="1"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',
    warning:'<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>',
    location_on:'<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    call:'<path d="M7 4 4.5 6.5c1 5 4 8 9 9L16 13l3 2v3c0 1-1 2-2 2C9 20 4 15 4 7c0-1 1-2 2-2h3l2 3-4 2"/>',
    photo_camera:'<path d="M5 7h3l1.5-2h5L16 7h3v12H5z"/><circle cx="12" cy="13" r="3.5"/>',
    home:'<path d="m3 11 9-7 9 7v9H5v-7h6v7"/>',
    lightbulb:'<path d="M9 18h6M10 22h4M8 14c-2-1.2-3-3-3-5.2a7 7 0 0 1 14 0c0 2.2-1 4-3 5.2-.7.4-1 1-1 1.8H9c0-.8-.3-1.4-1-1.8Z"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    arrow_forward:'<path d="M5 12h13M13 6l6 6-6 6"/>',
    arrow_back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    check_circle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    task_alt:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    delete:'<path d="M5 7h14M10 11v6M14 11v6M9 7l1-3h4l1 3M7 7l1 14h8l1-14"/>',
    cloud_upload:'<path d="M7 18a4 4 0 1 1 1-7.9A5 5 0 0 1 18 11a3.5 3.5 0 0 1 0 7H7Z"/><path d="M12 16V9M9.5 11.5 12 9l2.5 2.5"/>',
    send:'<path d="m3 4 18 8-18 8 3-8-3-8Z"/><path d="M6 12h10"/>',
    visibility:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    logout:'<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>'
  };

  function renderIcons(root=document){
    $$('.material-symbols-outlined',root).forEach(el=>{
      if(el.dataset.svgIconDone)return;
      const name=el.textContent.trim();
      const path=ICON_PATHS[name]||'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>';
      el.dataset.svgIconDone='1';
      el.setAttribute('aria-hidden','true');
      el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+path+'</svg>';
    });
  }

  function mapFallback(el,clusters,openCluster){
    if(!el)return;
    const pts=(clusters||[]).filter(c=>Number.isFinite(Number(c.lat))&&Number.isFinite(Number(c.lng)));
    const minLat=Math.min(...pts.map(c=>Number(c.lat)),28.60),maxLat=Math.max(...pts.map(c=>Number(c.lat)),28.63),minLng=Math.min(...pts.map(c=>Number(c.lng)),77.20),maxLng=Math.max(...pts.map(c=>Number(c.lng)),77.23);
    const x=c=>70+(Number(c.lng)-minLng)/(maxLng-minLng||1)*860,y=c=>55+(maxLat-Number(c.lat))/(maxLat-minLat||1)*410;
    el.innerHTML='<div style="position:relative;width:100%;height:100%;min-height:500px;background:linear-gradient(135deg,#f1f5f9,#ffffff);overflow:hidden;border-radius:12px"><svg viewBox="0 0 1000 520" preserveAspectRatio="none" style="width:100%;height:100%"><g stroke="#e2e8f0" stroke-width="2.5" opacity=".8">'+Array.from({length:7},(_,i)=>'<path fill="none" d="M30 '+(80+i*65)+' Q300 '+(55+i*65)+' 520 '+(90+i*65)+' T970 '+(75+i*65)+'"/>').join('')+Array.from({length:6},(_,i)=>'<path fill="none" d="M'+(100+i*160)+' 30 Q'+(75+i*160)+' 180 '+(115+i*160)+' 270 T'+(95+i*160)+' 490"/>').join('')+'</g>'+pts.map(c=>{const color=Number(c.priority_score)>=75?'#e11d48':Number(c.priority_score)>=50?'#f59e0b':'#10b981';return '<g data-cluster-id="'+esc(c.id)+'" style="cursor:pointer"><circle cx="'+x(c)+'" cy="'+y(c)+'" r="13" fill="'+color+'" stroke="#fff" stroke-width="3.5"/><text x="'+x(c)+'" y="'+(y(c)-20)+'" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a">'+esc(c.title||c.category||'Cluster')+'</text></g>'}).join('')+'</svg><div style="position:absolute;left:18px;bottom:14px;background:rgba(255,255,255,.94);padding:8px 14px;border-radius:10px;font:600 12px Inter,system-ui;color:#475569;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.04)">Offline map view · live cluster coordinates</div></div>';
    $$('[data-cluster-id]',el).forEach(m=>m.addEventListener('click',()=>openCluster?.(m.dataset.clusterId)));
  }

  function modal(title,body,actions=''){
    const b=document.createElement('div');
    b.className='civiclens-modal-backdrop';
    b.innerHTML=`<div class="civiclens-modal"><button class="close" aria-label="Close">×</button><h2>${title}</h2>${body}${actions?`<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">${actions}</div>`:''}</div>`;
    document.body.appendChild(b);
    const close=()=>b.remove();
    b.querySelector('.close').onclick=close;
    b.onclick=e=>{if(e.target===b)close()};
    return {root:b,close};
  }

  async function requireRole(role){
    if(!token()){
      go(location.pathname.includes('/admin/')?'login.html':'join.html');
      throw Error('Please sign in to continue.');
    }
    const p=await api('/api/me');
    if(role&&p.user.role!==role)throw Error('You do not have permission for this page.');
    save(p);
    return p.user;
  }

  function openCamera(){
    return new Promise(resolve=>{
      if(!navigator.mediaDevices?.getUserMedia){
        notice('Camera is unavailable. Use HTTPS or localhost, or choose a gallery image.','error');
        return resolve(null);
      }
      let stream=null,mode='environment',done=false;
      const b=document.createElement('div');
      b.className='civiclens-modal-backdrop';
      b.innerHTML=`<div class="civiclens-modal" style="background:#0f172a;color:#fff;max-width:680px;border-color:#334155"><button class="close" style="color:#94a3b8">×</button><video autoplay playsinline muted style="width:100%;max-height:60vh;object-fit:cover;border-radius:12px;background:#000"></video><canvas hidden></canvas><div style="display:flex;gap:12px;justify-content:center;margin-top:16px"><button data-switch class="civiclens-secondary" style="background:#1e293b;border-color:#475569;color:#fff">Switch camera</button><button data-shot class="civiclens-primary" style="background:#0d9488">Capture</button></div><p data-status style="text-align:center;font-size:12px;color:#94a3b8;margin-top:8px"></p></div>`;
      document.body.appendChild(b);
      const v=$('video',b),c=$('canvas',b),cleanup=()=>{stream?.getTracks().forEach(t=>t.stop());b.remove()},finish=x=>{if(done)return;done=true;cleanup();resolve(x)};
      const start=async()=>{
        try{
          stream?.getTracks().forEach(t=>t.stop());
          stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:mode},audio:false});
          v.srcObject=stream;
        }catch(e){
          notice(e.name==='NotAllowedError'?'Camera permission was denied.':`Could not access camera: ${e.message}`,'error');
          finish(null);
        }
      };
      $('.close',b).onclick=()=>finish(null);
      $('[data-switch]',b).onclick=()=>{mode=mode==='environment'?'user':'environment';start()};
      $('[data-shot]',b).onclick=()=>{
        if(!v.videoWidth)return;
        c.width=v.videoWidth;c.height=v.videoHeight;
        c.getContext('2d').drawImage(v,0,0);
        c.toBlob(blob=>blob&&finish(new File([blob],`nagarsetu-photo-${Date.now()}.jpg`,{type:'image/jpeg'})),'image/jpeg',.92);
      };
      start();
    });
  }

  function filePipeline(input,preview,status,remove,empty){
    let selected=null,objectUrl=null;
    const show=f=>{
      selected=f;
      if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
      if(!f){
        if(preview){preview.hidden=true;preview.removeAttribute('src');preview.style.display='none';}
        if(empty)empty.classList.remove('hidden');
        if(status){status.textContent='No image selected';status.classList.add('hidden');}
        remove?.classList.add('hidden');
        return;
      }
      if(f.size>10*1024*1024){
        notice('Maximum image size is 10MB.','error');
        input.value='';
        return show(null);
      }
      objectUrl=URL.createObjectURL(f);
      if(preview){
        preview.src=objectUrl;
        preview.hidden=false;
        preview.style.display='block';
      }
      if(empty)empty.classList.add('hidden');
      if(status){
        status.textContent=`${f.name} · ${(f.size/1024/1024).toFixed(2)} MB`;
        status.classList.remove('hidden');
      }
      remove?.classList.remove('hidden');
    };
    input?.addEventListener('change',()=>show(input.files?.[0]));
    remove?.addEventListener('click',()=>{input.value='';show(null);});
    return {get:()=>selected,set:f=>{if(f){const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;}show(f);}};
  }

  async function wireAuth(){
    const path=location.pathname.toLowerCase();
    if(path.endsWith('welcome.html')){
      $$('[data-demo-citizen],button,a').filter(e=>/get started/i.test(e.textContent)).forEach(e=>e.onclick=()=>go('join.html'));
      $$('button,a').filter(e=>/continue as demo citizen|demo access/i.test(e.textContent)).forEach(e=>e.onclick=async()=>{
        try{
          save(await api('/api/auth/guest',{method:'POST',body:JSON.stringify({display_name:'Demo Citizen'})}));
          go('dashboard.html');
        }catch(err){notice(err.message,'error');}
      });
    }
    if(path.endsWith('join.html')){
      const input=$('input[type=tel]')||$('input');
      const bs=$$('button');
      const guest=bs.find(b=>/demo citizen|guest|without/i.test(b.textContent));
      const cont=bs.find(b=>/send otp|send code|get started/i.test(b.textContent)&&b!==guest);
      guest&&(guest.onclick=async()=>{
        try{
          save(await api('/api/auth/guest',{method:'POST',body:JSON.stringify({display_name:'Demo Citizen'})}));
          go('dashboard.html');
        }catch(e){notice(e.message,'error');}
      });
      cont&&(cont.onclick=async()=>{
        if(!input?.value.trim())return notice('Enter a phone number.','error');
        try{
          const p=await api('/api/auth/phone/request',{method:'POST',body:JSON.stringify({phone:input.value.trim()})});
          localStorage.setItem('civiclens_pending_phone',input.value.trim());
          notice(`Development OTP: ${p.dev_code||'123456'}`);
          go('otp.html');
        }catch(e){notice(e.message,'error');}
      });
    }
  }

  async function wireOtp(){
    const phone=localStorage.getItem('civiclens_pending_phone');
    if(!phone)return go('join.html');
    const inputs=$$('.otp-input, input').filter(i=>i.type!=='hidden'&&i.type!=='submit');
    const btn=$$('button').find(b=>/verify|continue|confirm/i.test(b.textContent));
    
    // Auto focus next input
    inputs.forEach((inp, idx)=>{
      inp.addEventListener('input', ()=>{
        if(inp.value && idx < inputs.length - 1){
          inputs[idx+1].focus();
        }
      });
      inp.addEventListener('keydown', (e)=>{
        if(e.key === 'Backspace' && !inp.value && idx > 0){
          inputs[idx-1].focus();
        }
      });
    });

    btn&&(btn.onclick=async()=>{
      const code=inputs.map(i=>i.value.trim()).join('');
      try{
        save(await api('/api/auth/phone/verify',{method:'POST',body:JSON.stringify({phone,code})}));
        localStorage.removeItem('civiclens_pending_phone');
        go('dashboard.html');
      }catch(e){notice(e.message,'error');}
    });
  }

  function initMap(el,lat,lng,onChange){
    if(!el||!window.L)return null;
    el.style.backgroundImage='none';
    el.innerHTML='';
    const map=L.map(el).setView([lat,lng],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    const marker=L.marker([lat,lng],{draggable:true}).addTo(map);
    const set=(a,b,pan=true)=>{
      marker.setLatLng([a,b]);
      if(pan)map.setView([a,b],15);
      onChange?.({lat:Number(a.toFixed(6)),lng:Number(b.toFixed(6))});
    };
    marker.on('dragend',()=>{
      const p=marker.getLatLng();
      set(p.lat,p.lng,false);
    });
    map.on('click',e=>set(e.latlng.lat,e.latlng.lng));
    setTimeout(()=>map.invalidateSize(),200);
    return {map,marker,set};
  }

  const currentLocation=()=>new Promise((res,rej)=>navigator.geolocation?.getCurrentPosition(
    p=>res({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy}),
    e=>rej(Error(e.code===1?'Location permission was denied.':'Could not determine your location.')),
    {enableHighAccuracy:true,timeout:10000,maximumAge:30000}
  )||rej(Error('Location services are unavailable.')));

  async function wireReport(){
    try{await requireRole('citizen')}catch(e){return notice(e.message,'error');}
    const chips=$$('.category-chip');
    let category=(chips.find(c=>c.classList.contains('bg-secondary-container')||c.classList.contains('active'))||chips[0])?.textContent.trim()||'Pothole';
    chips.forEach(c=>c.onclick=()=>{
      category=c.textContent.trim();
      chips.forEach(x=>x.classList.remove('ring-2','ring-teal-600','bg-teal-50','text-teal-900','border-teal-500'));
      c.classList.add('ring-2','ring-teal-600','bg-teal-50','text-teal-900','border-teal-500');
    });
    const customChip=$('#custom-category-chip'),customInput=$('#custom-category-input');
    customChip?.addEventListener('click',()=>{
      chips.forEach(x=>x.classList.remove('ring-2','ring-teal-600'));
      customChip.classList.toggle('ring-2');
      customChip.classList.toggle('ring-teal-600');
      customInput?.classList.toggle('hidden');
      if(!customInput?.classList.contains('hidden')){
        customInput.focus();
        category=customInput.value.trim()||'Other';
      }
    });
    customInput?.addEventListener('input',()=>{category=customInput.value.trim()||'Other'});
    const desc=$('#issue-description')||$('textarea');
    let analysisTimer;
    let hint=$('#nagarsetu-analysis-hint');
    if(desc&&!hint){
      hint=document.createElement('p');
      hint.id='nagarsetu-analysis-hint';
      hint.setAttribute('aria-live','polite');
      hint.style.cssText='margin:8px 0;color:#0d9488;font:600 12px/18px Inter,sans-serif';
      desc.insertAdjacentElement('afterend',hint);
    }
    desc?.addEventListener('input',()=>{
      clearTimeout(analysisTimer);
      const text=desc.value.trim();
      if(text.length<12){if(hint)hint.textContent='';return;}
      analysisTimer=setTimeout(async()=>{
        try{
          const a=await api('/api/intelligence/analyze',{method:'POST',body:JSON.stringify({description:text})});
          if(hint&&desc.value.trim()===text)hint.textContent=`✨ NagarSetu suggestion: ${a.suggested_category} (${a.severity} priority). ${a.severity_basis.join('; ')}.`;
        }catch{}
      },450);
    });

    const address=$('input[placeholder*="location" i],input[placeholder*="address" i]');
    const input=$('#issue-image'),preview=$('#issue-photo-preview'),status=$('#image-authenticity-status'),remove=$('#remove-photo-btn'),empty=$('#issue-photo-empty');
    const picker=filePipeline(input,preview,status,remove,empty);
    const videoInput=$('#issue-video'),videoPreview=$('#issue-video-preview'),videoStatus=$('#issue-video-status'),videoRemove=$('#remove-video-btn'),videoEmpty=$('#issue-video-empty');
    const videoPicker=filePipeline(videoInput,videoPreview,videoStatus,videoRemove,videoEmpty);
    
    $('#open-camera-btn')?.addEventListener('click',async()=>{
      const f=await openCamera();
      if(f)picker.set(f);
    });

    let loc=null,hasLocation=false;
    const map=initMap($('#report-map'),22.5,79,p=>{
      loc={...(loc||{}),...p};
      hasLocation=true;
      setText('location-status',`Selected: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
    });

    const addrInput=$('#issue-address-input');
    addrInput?.addEventListener('change',async()=>{
      const q=addrInput.value.trim();
      if(!q)return;
      try{
        const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
        const results=await res.json();
        if(results&&results[0]){
          const lat=Number(results[0].lat),lng=Number(results[0].lon);
          loc={...(loc||{}),lat,lng};
          hasLocation=true;
          map?.set(lat,lng);
          setText('location-status',`Matched: ${q}`);
        }else{
          setText('location-status','Address not found. Please drag the pin on the map.');
        }
      }catch{
        setText('location-status','Could not look up address. Please drag the pin on the map.');
      }
    });

    $('#locate-me-btn')?.addEventListener('click',async()=>{
      try{
        const p=await currentLocation();
        loc=p;hasLocation=true;map?.set(p.lat,p.lng);
        setText('location-status',`GPS Location · ±${Math.round(p.accuracy)}m accuracy`);
      }catch(e){
        notice(e.message+' You can drag the pin on the map.','error');
      }
    });

    try{
      const p=await currentLocation();
      loc=p;hasLocation=true;map?.set(p.lat,p.lng);
      setText('location-status',`GPS Location · ±${Math.round(p.accuracy)}m accuracy`);
    }catch{
      setText('location-status','Click the map or drag the marker to set location.');
    }

    const submit=$('#submit-report');
    submit?.removeAttribute('onclick');
    submit?.addEventListener('click',async()=>{
      if(!desc?.value.trim())return notice('Add an issue description.','error');
      if(!picker.get())return notice('Please attach a photo of the issue.','error');
      if(!hasLocation||!loc)return notice('Please select a location on the map.','error');
      submit.disabled=true;
      submit.innerHTML='<span>Submitting report…</span>';
      let createdIssue=false;
      try{
        const r=await api('/api/issues',{
          method:'POST',
          body:JSON.stringify({
            category,
            description:desc.value.trim(),
            address:address?.value.trim()||'Selected map location',
            lat:loc.lat,
            lng:loc.lng
          })
        });
        createdIssue=true;
        const submission={issue:r.issue,cluster:r.cluster,duplicate:r.duplicate,image_analysis:null,image_upload_pending:true};
        localStorage.setItem(LAST_SUBMISSION,JSON.stringify(submission));
        
        const f=picker.get(),form=new FormData();
        form.append('image',f,f.name);
        const a=await api(`/api/issues/${r.issue.id}/images`,{method:'POST',body:form});
        submission.image_analysis=a;
        submission.image_upload_pending=false;
        localStorage.setItem(LAST_SUBMISSION,JSON.stringify(submission));
        
        const vf=videoPicker.get();
        if(vf){
          try{
            const vform=new FormData();
            vform.append('video',vf,vf.name);
            await api(`/api/issues/${r.issue.id}/videos`,{method:'POST',body:vform});
          }catch(e){
            notice('Report saved, video upload skipped: '+e.message,'error');
          }
        }
        go('submitted.html');
      }catch(e){
        if(createdIssue){
          notice('Your report was saved. The photo upload can be retried on the confirmation page.','error');
          go('submitted.html');
        }else{
          submit.disabled=false;
          submit.innerHTML='<span>Submit Report</span>';
          notice(e.message,'error');
        }
      }
    });
  }

  function renderCards(issues){
    const anchor=$('#recent-reports');
    const grid=anchor?.closest('section')?.querySelector('.grid');
    if(!grid)return;
    const rows=issues||[];
    grid.innerHTML=rows.length?rows.map(i=>{
      const st=String(i.status||'reported').replace('_',' ');
      const stBadge=i.status==='resolved'||i.status==='independently_verified'
        ?'bg-emerald-50 text-emerald-800 border-emerald-200'
        :(i.status==='resolution_claimed'
          ?'bg-amber-50 text-amber-800 border-amber-200'
          :'bg-slate-100 text-slate-700 border-slate-200');
      return `<a href="../incident.html?id=${encodeURIComponent(i.tracking_id)}" class="civiclens-report-card md:col-span-6 lg:col-span-6 rounded-2xl p-6 bg-white border border-slate-200 hover:border-teal-500 shadow-sm transition-all block">
        <div class="flex justify-between items-center gap-3 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${stBadge}">${esc(st)}</span>
          <span class="text-xs font-medium text-slate-400">${dateLabel(i.created_at)}</span>
        </div>
        <h4 class="font-bold text-lg text-slate-900 mb-2 leading-snug">${esc(i.title||i.category)}</h4>
        <p class="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">${esc(i.description)}</p>
        <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span class="text-slate-500 flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-teal-600">location_on</span>${esc(i.address)}</span>
          <span class="font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">Track Record →</span>
        </div>
      </a>`;
    }).join(''):'<div class="md:col-span-12 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p class="text-slate-600 font-medium">You have not submitted any reports yet.</p><p class="text-xs text-slate-400 mt-1">Your saved civic reports will appear here in real time.</p></div>';
  }

  async function notifications(role){
    const p=await api(role==='admin'?'/api/admin/notifications':'/api/citizen/notifications');
    return p.notifications||[];
  }

  function showNotifications(role){
    notifications(role).then(items=>{
      const m=modal('Notifications',`<div>${items.length?items.map(n=>`<button data-nid="${esc(n.id)}" style="display:block;width:100%;text-align:left;padding:12px 14px;margin:8px 0;border-radius:10px;border:1px solid #e2e8f0;background:${n.is_read?'#f8fafc':'#f0fdfa'}"><b style="color:#0f172a">${esc(n.title)}</b><br><small style="color:#64748b">${esc(n.message)}</small></button>`).join(''):'<p style="color:#64748b;text-align:center;padding:20px 0">No new notifications.</p>'}</div>`);
      $$('[data-nid]',m.root).forEach(b=>b.onclick=async()=>{
        try{
          await api(`${role==='admin'?'/api/admin/notifications':'/api/citizen/notifications'}/${b.dataset.nid}/read`,{method:'POST'});
          b.style.background='#f8fafc';
        }catch(e){notice(e.message,'error');}
      });
    }).catch(e=>notice(e.message,'error'));
  }

  async function showProfile(role){
    try{
      const p=await api(role==='admin'?'/api/admin/profile':'/api/citizen/profile');
      const x=p.profile||p.user;
      const body=role==='admin'?`
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:50%;background:#0f172a;color:#fff;display:grid;place-items:center;font-weight:700;font-size:18px">O</div>
          <div><b style="font-size:16px;color:#0f172a">${esc(x.display_name||x.name)}</b><p style="margin:2px 0 0;font-size:12px;color:#64748b">${esc(x.department||'Municipal Operations')}</p></div>
        </div>
        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;font-size:13px;line-height:1.8">
          <p style="margin:0"><strong>Role:</strong> ${esc(x.role||'Officer')}</p>
          <p style="margin:0"><strong>Active Assignments:</strong> ${x.active_assignments??0}</p>
          <p style="margin:0"><strong>Resolved Clusters:</strong> ${x.resolved_clusters??0}</p>
          <p style="margin:0"><strong>Current Workload:</strong> ${x.current_workload??0}</p>
        </div>
      `:`
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:50%;background:#0d9488;color:#fff;display:grid;place-items:center;font-weight:700;font-size:18px">C</div>
          <div><b style="font-size:16px;color:#0f172a">${esc(x.display_name)}</b><p style="margin:2px 0 0;font-size:12px;color:#64748b">Verified Resident</p></div>
        </div>
        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;font-size:13px;line-height:1.8">
          <p style="margin:0"><strong>Account Type:</strong> ${esc(x.role||'citizen')}</p>
          <p style="margin:0"><strong>Total Reports:</strong> ${x.total_reports??0}</p>
          <p style="margin:0"><strong>Resolved Reports:</strong> ${x.resolved_reports??0}</p>
        </div>
      `;
      modal(role==='admin'?'Officer Profile':'Citizen Profile',body);
    }catch(e){notice(e.message,'error');}
  }

  async function showSettings(role){
    let p={};
    try{p=await api(role==='admin'?'/api/admin/settings':'/api/citizen/settings')}catch{}
    const s=p.settings||{};
    const m=modal(role==='admin'?'Admin Settings':'Citizen Settings',`
      <div style="display:flex;flex-direction:column;gap:14px">
        <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600">
          <span>Notifications</span>
          <input id="set-notify" type="checkbox" ${s.notifications!==false?'checked':''} style="width:18px;height:18px;accent-color:#0d9488">
        </label>
        <label style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600">
          <span>Location Services</span>
          <input id="set-location" type="checkbox" ${s.location!==false?'checked':''} style="width:18px;height:18px;accent-color:#0d9488">
        </label>
        <label style="font-size:13px;font-weight:600">
          <span style="display:block;margin-bottom:6px">Account Display Name</span>
          <input class="civiclens-field" id="set-name" value="${esc((user()||{}).display_name||'')}">
        </label>
      </div>
      <button class="civiclens-primary" id="save-settings" style="width:100%;margin-top:16px;background:#0d9488">Save Settings</button>
    `);
    $('#save-settings',m.root).onclick=async()=>{
      try{
        await api(role==='admin'?'/api/admin/settings':'/api/citizen/settings',{
          method:'PUT',
          body:JSON.stringify({
            notifications:$('#set-notify',m.root).checked,
            location:$('#set-location',m.root).checked,
            display_name:$('#set-name',m.root).value.trim()
          })
        });
        notice('Settings saved successfully.','success');
        m.close();
      }catch(e){notice(e.message,'error');}
    };
  }

  function showSupport(){
    modal('Help & Support',`
      <div style="font-size:13px;line-height:1.6;display:flex;flex-direction:column;gap:12px">
        <details open style="border:1px solid #e2e8f0;padding:10px 14px;border-radius:10px">
          <summary style="font-weight:700;cursor:pointer;color:#0f172a">How do I report an issue?</summary>
          <p style="margin:8px 0 0;color:#64748b">Select a category, snap a photo or pick an image from your gallery, then confirm your GPS location on the map.</p>
        </details>
        <details style="border:1px solid #e2e8f0;padding:10px 14px;border-radius:10px">
          <summary style="font-weight:700;cursor:pointer;color:#0f172a">How does location work?</summary>
          <p style="margin:8px 0 0;color:#64748b">Allow browser location for precise automatic GPS detection, or drag the map pin to any exact street location.</p>
        </details>
        <details style="border:1px solid #e2e8f0;padding:10px 14px;border-radius:10px">
          <summary style="font-weight:700;cursor:pointer;color:#0f172a">How are resolutions verified?</summary>
          <p style="margin:8px 0 0;color:#64748b">When a municipal officer submits proof of fix, the original reporter receives a verification notification to review Before & After photos and confirm whether it was actually fixed.</p>
        </details>
      </div>
    `);
  }

  function iconSvg(name){
    const p=ICON_PATHS[name]||'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  function wireShell(role){
    addStyles();
    const admin=role==='admin';
    const nav=admin?document.querySelector('body > nav'):document.querySelector('header nav');
    
    if(admin&&nav){
      const links=[
        ['dashboard.html','Clusters','group_work'],
        ['accountability.html','Accountability Desk','assignment'],
        ['escalations.html','Escalations','priority_high'],
        ['metrics.html','Metrics','bar_chart']
      ];
      nav.innerHTML=`
        <div class="civiclens-admin-brand">
          <div style="display:flex;align-items:center;gap:11px">
            <div style="width:36px;height:36px;border-radius:10px;background:#0d9488;color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px;box-shadow:0 2px 8px rgba(13,148,136,.4)">N</div>
            <div>
              <h1 style="margin:0;font-size:17px;font-weight:800;letter-spacing:-.4px;color:#fff">NagarSetu</h1>
              <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:500">Municipal Admin</p>
            </div>
          </div>
        </div>
        <div class="civiclens-admin-links">
          ${links.map(([h,l,i])=>`<a href="${h}" class="civiclens-admin-link ${location.pathname.endsWith(h)?'civiclens-active':''}">${iconSvg(i)}<span>${l}</span></a>`).join('')}
        </div>
        <div class="civiclens-admin-bottom">
          <a href="../public.html" target="_blank" class="civiclens-admin-link">${iconSvg('visibility')}<span>Public View ↗</span></a>
          <button type="button" class="civiclens-admin-link" data-settings>${iconSvg('settings')}<span>Settings</span></button>
          <button type="button" class="civiclens-admin-link" data-support>${iconSvg('help')}<span>Support</span></button>
          <button type="button" class="civiclens-admin-link civiclens-logout" data-logout>${iconSvg('logout')}<span>Logout</span></button>
        </div>
      `;
      $('[data-settings]',nav)?.addEventListener('click',()=>showSettings('admin'));
      $('[data-support]',nav)?.addEventListener('click',showSupport);
      $('[data-logout]',nav)?.addEventListener('click',()=>{
        localStorage.removeItem(ROLE_TOKEN.admin);
        localStorage.removeItem(ROLE_USER.admin);
        go('login.html');
      });

      // Add mobile hamburger toggle if not present
      let mobBtn=$('#admin-mob-btn');
      if(!mobBtn){
        mobBtn=document.createElement('button');
        mobBtn.id='admin-mob-btn';
        mobBtn.type='button';
        mobBtn.className='civiclens-mobile-menu';
        mobBtn.innerHTML=iconSvg('menu');
        mobBtn.setAttribute('aria-label','Toggle admin navigation');
        mobBtn.onclick=()=>nav.classList.toggle('civiclens-mobile-open');
        document.body.appendChild(mobBtn);
      }
    }else if(!admin&&nav){
      let verification=nav.querySelector('#citizen-verification-link, #citizen-verification-link-static');
      if(!verification){
        verification=document.createElement('a');
        verification.href='verify-fix.html';
        verification.className='font-label-md text-label-md text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors px-3 py-2 rounded-lg relative font-medium';
        verification.textContent='Verification';
        nav.appendChild(verification);
      }
      verification.id='citizen-verification-link';
      if(!verification.querySelector('#citizen-verification-badge')){
        const badge=document.createElement('span');
        badge.id='citizen-verification-badge';
        badge.textContent='1';
        badge.style.cssText='display:none;position:absolute;top:2px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#0d9488;color:#fff;font:700 11px/18px Inter,sans-serif;text-align:center';
        verification.appendChild(badge);
      }
      const refreshVerification=async()=>{
        try{
          const d=await api('/api/citizen/dashboard');
          const pending=!!d.pending_verification;
          const badge=$('#citizen-verification-badge');
          if(badge)badge.style.display=pending?'inline-block':'none';
          verification?.classList.toggle('font-bold',pending);
          if(verification)verification.style.color=pending?'#0d9488':'';
          renderVerifyBanner(pending?d.pending_verification:null);
        }catch{}
      };
      refreshVerification();
      window.setInterval(refreshVerification,15000);

      const header=nav.closest('header');
      if(header){
        header.classList.add('civiclens-citizen-header');
        const brand=header.querySelector('h1');
        if(brand){
          brand.classList.remove('absolute','left-1\/2','-translate-x-1\/2');
          brand.style.position='static';
          brand.style.transform='none';
          brand.style.margin='0';
          brand.style.flex='0 0 auto';
          brand.style.textAlign='left';
          brand.innerHTML=`<a href="dashboard.html" style="display:flex;align-items:center;gap:10px;text-decoration:none"><span style="width:34px;height:34px;border-radius:9px;background:#0d9488;color:#fff;display:grid;place-items:center;font-weight:800;font-size:17px;box-shadow:0 2px 6px rgba(13,148,136,.3)">N</span><span style="font-weight:800;font-size:20px;letter-spacing:-.5px;color:#0f172a;font-family:Manrope,sans-serif">NagarSetu</span></a>`;
        }
        const right=nav.parentElement;
        if(right){
          right.style.display='flex';
          right.style.alignItems='center';
          right.style.gap='16px';
          right.style.marginLeft='auto';
        }
        let logout=header.querySelector('[data-citizen-logout]');
        if(!logout){
          logout=document.createElement('button');
          logout.type='button';logout.dataset.citizenLogout='1';logout.className='civiclens-citizen-logout';
          logout.innerHTML=`${iconSvg('logout')}<span>Sign out</span>`;
          logout.addEventListener('click',()=>{
            localStorage.removeItem(ROLE_TOKEN.citizen);
            localStorage.removeItem(ROLE_USER.citizen);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            go('welcome.html');
          });
          if(right) right.appendChild(logout); else header.appendChild(logout);
        }
      }
      const avatar=$('img[alt*="User Profile" i], img[data-alt*="portrait" i], .cursor-pointer:has([data-icon="account_circle"])');
      avatar?.addEventListener('click',()=>showProfile('citizen'));
    }

    if(!admin){
      const bottom=document.querySelector('body > nav.md\\:hidden');
      if(bottom&&!bottom.querySelector('[data-citizen-verification]')){
        const a=document.createElement('a');
        a.href='verify-fix.html';
        a.dataset.citizenVerification='1';
        a.className='flex flex-col items-center gap-1 text-slate-600 hover:text-teal-600';
        a.innerHTML=`${iconSvg('verified')}<span class="text-[10px] font-semibold mt-0.5">Verify</span>`;
        bottom.appendChild(a);
      }
    }
    renderIcons();
  }

  function renderEvidenceRequestBanner(issue){
    let b=$('#civiclens-evidence-request-banner');
    if(!issue){
      b?.remove();
      return;
    }
    if(!b){
      b=document.createElement('div');
      b.id='civiclens-evidence-request-banner';
      const anchor=$('#recent-reports');
      anchor?.closest('section')?.insertAdjacentElement('beforebegin',b);
    }
    b.innerHTML=`<div><div style="font-weight:700;margin-bottom:3px">⚠️ Additional Photo Requested</div><div style="font-size:13px;line-height:20px">A municipal officer requested an updated photo for <b>${esc(issue.title||'your reported issue')}</b> to assist the maintenance crew.</div></div><button type="button" id="civiclens-upload-real-photo">Upload Photo</button>`;
    b.className='civiclens-evidence-request-banner';
    $('#civiclens-upload-real-photo')?.addEventListener('click',()=>openEvidenceUpload(issue));
  }

  function openEvidenceUpload(issue){
    const existing=$('#civiclens-evidence-modal'); existing?.remove();
    const wrap=document.createElement('div');
    wrap.id='civiclens-evidence-modal';
    wrap.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.6);backdrop-filter:blur(6px);z-index:260;display:flex;align-items:center;justify-content:center;padding:18px';
    wrap.innerHTML=`<div style="background:#ffffff;max-width:500px;width:100%;border-radius:18px;padding:26px;box-shadow:0 24px 60px rgba(15,23,42,.2);border:1px solid #e2e8f0">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:start">
        <div>
          <h3 style="margin:0;color:#0f172a;font:700 22px/28px 'Manrope',sans-serif">Upload Follow-up Photo</h3>
          <p style="margin:6px 0 16px;color:#64748b;font-size:13px">Photograph the actual location to assist the municipal team.</p>
        </div>
        <button type="button" id="close-evidence-modal" style="border:0;background:transparent;font-size:24px;color:#64748b;cursor:pointer">×</button>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:13px">
        <b style="color:#0f172a">${esc(issue.tracking_id||'Report')}</b><br>
        <span style="color:#64748b">${esc(issue.title||'Reported issue')}</span>
      </div>
      <input id="civiclens-real-photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/tiff,image/heic,image/heif" style="width:100%;padding:12px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;font-size:13px"/>
      <img id="civiclens-real-photo-preview" alt="Real photo preview" style="display:none;width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-top:14px;border:1px solid #e2e8f0"/>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">
        <button type="button" id="cancel-evidence-modal" class="civiclens-secondary">Cancel</button>
        <button type="button" id="submit-real-photo" class="civiclens-primary" style="background:#0d9488">Send to Municipal Team</button>
      </div>
    </div>`;
    document.body.appendChild(wrap);
    const input=$('#civiclens-real-photo-input'), preview=$('#civiclens-real-photo-preview');
    input?.addEventListener('change',()=>{
      const f=input.files?.[0];
      if(!f){preview.style.display='none';return;}
      preview.src=URL.createObjectURL(f);
      preview.style.display='block';
    });
    const close=()=>wrap.remove();
    $('#close-evidence-modal')?.addEventListener('click',close);
    $('#cancel-evidence-modal')?.addEventListener('click',close);
    $('#submit-real-photo')?.addEventListener('click',async()=>{
      const f=input?.files?.[0];
      if(!f)return notice('Please select a photo first.','error');
      const btn=$('#submit-real-photo');
      btn.disabled=true;
      btn.textContent='Uploading…';
      try{
        const form=new FormData();
        form.append('image',f,f.name);
        await api(`/api/citizen/issues/${encodeURIComponent(issue.id)}/evidence`,{method:'POST',body:form});
        notice('Photo submitted to municipal team.','success');
        close();
        setTimeout(()=>location.reload(),500);
      }catch(e){
        btn.disabled=false;
        btn.textContent='Send to Municipal Team';
        notice(e.message,'error');
      }
    });
  }

  function renderVerifyBanner(issue){
    let b=$('#civiclens-verify-banner');
    if(!issue){
      b?.remove();
      return;
    }
    if(!b){
      b=document.createElement('button');
      b.id='civiclens-verify-banner';
      b.type='button';
      b.onclick=()=>go('verify-fix.html');
      const anchor=$('#recent-reports');
      anchor?.closest('section')?.insertAdjacentElement('beforebegin',b);
    }
    b.innerHTML=`<div style="display:flex;align-items:center;gap:14px">
      <div style="width:42px;height:42px;border-radius:10px;background:#0d9488;color:#fff;display:grid;place-items:center;flex-shrink:0">${iconSvg('verified')}</div>
      <div>
        <b style="font-size:15px;color:#fff;display:block">Fix Verification Needed</b>
        <small style="color:#cbd5e1;font-size:13px">The municipal team marked “${esc(issue.title)}” as resolved. Tap here to inspect the photo and verify.</small>
      </div>
    </div>
    <span style="font-size:13px;font-weight:700;color:#5eead4;white-space:nowrap;margin-left:12px">Review Fix →</span>`;
    b.className='civiclens-verify-banner';
  }

  async function wireDashboard(){
    try{
      const citizen=await requireRole('citizen');
      setText('citizen-welcome',`Welcome back, ${citizen.display_name||'Citizen'}`);
      const d=await api('/api/citizen/dashboard');
      renderCards(d.issues);
      renderEvidenceRequestBanner(d.pending_evidence_request);
      renderVerifyBanner(d.pending_verification);
    }catch(e){notice(e.message,'error');}
  }

  async function wireAdminLogin(){
    const demo=$('#demo-admin-login');
    if(!demo)return;
    demo.onclick=async()=>{
      demo.disabled=true;
      demo.textContent='Signing in…';
      try{
        const p=await api('/api/auth/admin/demo');
        save(p);
        go('dashboard.html');
      }catch(e){
        demo.disabled=false;
        demo.textContent='Continue as Demo Admin';
        notice(e.message,'error');
      }
    };
  }

  async function wireAdminDashboard(){
    try{
      await requireRole('admin');
      const [d,m,rp]=await Promise.all([api('/api/admin/clusters'),api('/api/admin/metrics'),api('/api/admin/issues')]);
      setText('stat-open-issues',m.open_issues);
      setText('stat-overdue',m.overdue_count);
      const reports=$('#admin-reports-list');
      if(reports){
        const rows=rp.issues||[];
        reports.innerHTML=rows.map(i=>{
          const status=String(i.status||'reported').replace('_',' ');
          const priority=Number(i.cluster_priority||0);
          const tone=priority>=75?'High':priority>=50?'Medium':'Low';
          return `<article class="civiclens-admin-report">
            <div class="civiclens-admin-report-top">
              <div>
                <b>${esc(i.title||i.category||'Citizen report')}</b>
                <span class="civiclens-report-status">${esc(status)}</span>
              </div>
              <span class="civiclens-priority-${tone.toLowerCase()}">${tone} priority</span>
            </div>
            <p>${esc(i.description||'No description provided.')}</p>
            <div class="civiclens-admin-report-meta">
              <span>📍 ${esc(i.address||i.cluster_address||'Location provided')}</span>
              <span>Ref: ${esc(i.tracking_id||'—')}</span>
              <span>${dateLabel(i.created_at)}</span>
            </div>
            <button type="button" data-report-cluster="${esc(i.cluster_id||'')}">Open Cluster</button>
          </article>`;
        }).join('')||'<div class="civiclens-empty">No citizen reports yet. New submissions will appear here automatically.</div>';
        
        $$('[data-report-cluster]').forEach(b=>b.onclick=()=>b.dataset.reportCluster&&go(`cluster-detail.html?id=${encodeURIComponent(b.dataset.reportCluster)}`));
      }

      const el=$('#admin-map'),clusters=(d.clusters||[]).filter(c=>c.status!=='resolved'),openCluster=id=>go(`cluster-detail.html?id=${encodeURIComponent(id)}`);
      const render=()=>{
        if(!el)return;
        if(!window.L){mapFallback(el,clusters,openCluster);return;}
        try{
          el.style.backgroundImage='none';
          el.innerHTML='';
          const map=L.map(el).setView([28.6139,77.209],14);
          const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
          const bounds=[];
          let tileLoaded=false;
          tiles.on('tileload',()=>{tileLoaded=true});
          clusters.forEach(c=>{
            const lat=Number(c.lat),lng=Number(c.lng);
            if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
            bounds.push([lat,lng]);
            const color=c.priority_score>=75?'#e11d48':c.priority_score>=50?'#f59e0b':'#10b981';
            const icon=L.divIcon({className:'',html:`<div style="background:${color};width:20px;height:20px;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>`,iconSize:[20,20],iconAnchor:[10,10]});
            const marker=L.marker([lat,lng],{icon}).addTo(map);
            marker.bindPopup(`
              <div style="font-family:Inter,sans-serif;padding:4px 0">
                <b style="font-size:14px;color:#0f172a">${esc(c.title||c.category||'Cluster')}</b>${c.escalated?' <span style="color:#e11d48;font-weight:700">⚠ Escalated</span>':''}<br>
                <span style="font-size:12px;color:#64748b">${esc(c.report_count||0)} reports · Priority ${esc(c.priority_score)}${c.age_days!=null?` · ${esc(c.age_days)}d open`:''}</span><br>
                <span style="font-size:12px;color:#334155">${esc(c.address||'')}</span><br>
                <button data-open-cluster="${esc(c.id)}" style="margin-top:8px;padding:5px 12px;background:#0f172a;color:#fff;border:0;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer">Open Cluster</button>
              </div>
            `);
            marker.on('popupopen',()=>setTimeout(()=>document.querySelector(`[data-open-cluster="${CSS.escape(c.id)}"]`)?.addEventListener('click',()=>openCluster(c.id)),0));
          });
          if(bounds.length)map.fitBounds(bounds,{padding:[40,40],maxZoom:15});
          setTimeout(()=>map.invalidateSize(),250);
          tiles.on('tileerror',()=>{
            if(!el.dataset.mapFallback){el.dataset.mapFallback='1';map.remove();mapFallback(el,clusters,openCluster);}
          });
          setTimeout(()=>{
            if(!tileLoaded&&!el.dataset.mapFallback){el.dataset.mapFallback='1';map.remove();mapFallback(el,clusters,openCluster);}
          },5000);
        }catch(e){mapFallback(el,clusters,openCluster);}
      };
      if(window.L)render();
      else{
        const s=document.createElement('script');
        s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload=render;
        s.onerror=()=>mapFallback(el,clusters,openCluster);
        document.head.appendChild(s);
      }
    }catch(e){notice(e.message,'error');}
  }

  async function wireMetrics(){
    try{
      await requireRole('admin');
      const m=await api('/api/admin/metrics');
      setText('metric-fixed',`${m.outcomes.fixed}%`);
      setText('metric-pending',`${m.outcomes.pending}%`);
      setText('metric-reopened',`${m.outcomes.reopened}%`);
      setText('metric-resolution-hours',`${m.avg_resolution_hours}h`);
      setText('metric-recurrence',`${m.recurrence_rate}%`);
    }catch(e){notice(e.message,'error');}
  }

  async function wireEscalations(){
    try{
      await requireRole('admin');
      const p=await api('/api/admin/escalations');
      const main=$('main');
      if(main){
        main.innerHTML=`<section style="width:100%">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <div>
              <h1 style="font-size:28px;font-weight:800;color:#0f172a;font-family:'Manrope',sans-serif;margin:0 0 6px">Escalated Civic Issues</h1>
              <p style="color:#64748b;font-size:14px;margin:0">High-priority and overdue complaints requiring immediate administrative action.</p>
            </div>
            <a href="dashboard.html" class="civiclens-secondary" style="text-decoration:none">← Back to Clusters</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${(p.escalations||[]).map(x=>`<button data-eid="${esc(x.cluster_id||x.id)}" class="text-left bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-rose-500 hover:shadow-md transition-all">
              <div class="flex justify-between items-start gap-2 mb-2">
                <b class="text-base text-slate-900">${esc(x.title||x.issue)}</b>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Priority ${esc(x.priority_score||x.priority)}</span>
              </div>
              <p class="text-sm text-slate-600 mb-3 flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-teal-600">location_on</span>${esc(x.address||x.location)}</p>
              <div class="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>${esc(x.report_count||0)} reports logged</span>
                <span class="text-rose-600 font-semibold">${esc(x.reason||'Needs attention')}</span>
              </div>
            </button>`).join('')||'<div class="col-span-2 civiclens-empty">No active escalations right now. All priority thresholds are within normal ranges.</div>'}
          </div>
        </section>`;
        $$('[data-eid]').forEach(b=>b.onclick=()=>go(`cluster-detail.html?id=${encodeURIComponent(b.dataset.eid)}`));
      }
    }catch(e){notice(e.message,'error');}
  }

  async function wireDetail(){
    try{
      await requireRole('admin');
      const id=new URLSearchParams(location.search).get('id');
      const p=await api(`/api/admin/clusters/${encodeURIComponent(id||'')}`),c=p.cluster||p;
      setText('cluster-title',c.title);
      setText('cluster-address',c.address);
      setText('cluster-count',c.report_count||c.affected_count);
      setText('cluster-priority',c.priority_score);
      setText('cluster-description',c.description||c.issues?.[0]?.description||'');
      
      const evidence=$('#cluster-evidence');
      if(evidence){
        const issues=p.issues||[];
        const reportImages=issues.flatMap(i=>(i.images||[]).filter(img=>['report','replacement','resolution'].includes(img.image_role)).map(img=>({...img,issueId:i.id,issueTitle:i.title||i.category||'Citizen report',trackingId:i.tracking_id||'',evidenceRequestStatus:i.evidence_request_status||'none'})));
        const escScore=v=>v===null||v===undefined||v===''?'—':`${Math.round(Number(v)*100)}%`;
        const detectorLabel=img=>{
          const provider=String(img.ai_detector_provider||'').toLowerCase();
          const status=String(img.ai_detector_status||'').toLowerCase();
          const state=String(img.final_authenticity_state||'').toLowerCase();
          const prob=img.ai_probability;
          if(state==='likely_synthetic'||status==='high_risk') return `<span class="civiclens-ai-badge civiclens-ai-risk">⚠ Possible AI-generated · ${escScore(prob)} score</span>`;
          if(provider==='sightengine' && prob!==null && prob!==undefined) return `<span class="civiclens-ai-badge civiclens-ai-info">AI check: ${escScore(prob)} probability</span>`;
          if(status==='uncertain'||state==='insufficient_evidence') return `<span class="civiclens-ai-badge civiclens-ai-muted">AI check inconclusive</span>`;
          return `<span class="civiclens-ai-badge civiclens-ai-muted">AI check: ${esc(status||'not run')}</span>`;
        };
        evidence.innerHTML=`<div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 class="font-bold text-lg text-slate-900 mb-1">Image Evidence &amp; Authenticity</h3>
            <p class="text-sm text-slate-500">Citizen-uploaded evidence and recorded integrity signals.</p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">${reportImages.length} image${reportImages.length===1?'':'s'}</span>
        </div>`+
        (reportImages.length?`<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${reportImages.map(img=>`<article class="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div class="aspect-video bg-slate-100">
            <img src="${esc(img.url)}" alt="Citizen evidence" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'h-full flex items-center justify-center text-sm text-slate-400\\'>Evidence preview unavailable</div>'">
          </div>
          <div class="p-4">
            <div class="font-semibold text-sm text-slate-900 mb-1">${esc(img.issueTitle)}</div>
            <div class="text-xs text-slate-500 mb-2">Ref: ${esc(img.trackingId||'—')} · SHA-256 verified</div>
            ${detectorLabel(img)}
            ${img.final_authenticity_state==='likely_synthetic'?'<p class="text-xs text-slate-500 mt-2">Advisory signal; human review recommended.</p>':''}
            ${img.image_role==='resolution'
              ?`<div class="mt-3 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-900">🛠️ Municipal resolution photo attached. Citizen verification pending.</div>`
              :(img.image_role==='replacement'
                ?'<div class="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">Citizen follow-up photo received.</div>'
                :(img.final_authenticity_state==='likely_synthetic' && img.evidenceRequestStatus!=='submitted'
                  ?`<button type="button" class="civiclens-primary mt-3 w-full" data-request-real-photo="${esc(img.issueId)}" style="background:#e11d48">⚠ Request Real Photo from Citizen</button>`:''))}
          </div>
        </article>`).join('')}</div>`:'<div class="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No citizen evidence image has been attached to reports in this cluster yet.</div>');
      }

      $$('[data-request-real-photo]').forEach(btn=>btn.addEventListener('click',async()=>{
        const issueId=btn.dataset.requestRealPhoto;
        if(!issueId)return;
        btn.disabled=true;
        btn.textContent='Sending request…';
        try{
          await api(`/api/admin/issues/${encodeURIComponent(issueId)}/request-real-photo`,{method:'POST'});
          notice('Request sent to the citizen.','success');
          setTimeout(()=>location.reload(),500);
        }catch(e){
          btn.disabled=false;
          btn.textContent='⚠ Request Real Photo from Citizen';
          notice(e.message,'error');
        }
      }));

      const input=$('#resolution-image'),preview=$('#resolution-preview'),status=$('#resolution-file-status');
      const remove=document.createElement('button');
      remove.textContent='Remove photo';
      remove.className='civiclens-secondary hidden';
      remove.style.marginTop='8px';
      status?.after(remove);
      const picker=filePipeline(input,preview,status,remove);
      $('#resolution-camera-btn')?.addEventListener('click',async()=>{
        const f=await openCamera();
        if(f)picker.set(f);
      });

      const modalEl=$('#resolveModal');
      const open=()=>{if(modalEl){modalEl.classList.remove('hidden');modalEl.style.display='flex';}};
      $('#resolveBtn')?.addEventListener('click',open);
      $('#closeModalBtn')?.addEventListener('click',()=>modalEl?.classList.add('hidden'));
      $('#cancelModalBtn')?.addEventListener('click',()=>modalEl?.classList.add('hidden'));
      $('#submitResolutionBtn')?.addEventListener('click',async()=>{
        if(!picker.get())return notice('Choose a resolution photo.','error');
        const b=$('#submitResolutionBtn');
        b.disabled=true;
        b.textContent='Uploading…';
        try{
          const f=picker.get(),form=new FormData();
          form.append('image',f,f.name);
          form.append('resolution_note',$('#resolution-note')?.value||'Resolved by municipal maintenance team.');
          const result=await api(`/api/admin/clusters/${encodeURIComponent(id)}/resolution`,{method:'POST',body:form});
          const ai=result.ai_detector||{};
          const prob=ai.probability==null?'unavailable':`${Math.round(Number(ai.probability)*100)}%`;
          const flagged=String(result.final_authenticity_state||'').toLowerCase()==='likely_synthetic'||String(ai.status||'').toLowerCase()==='high_risk';
          const message=flagged?`Resolution photo attached (AI signal ${prob}). Citizen verification pending.`:`Resolution photo saved. Citizen verification pending.`;
          notice(message,flagged?'error':'success');
          setTimeout(()=>location.reload(),1200);
        }catch(e){
          b.disabled=false;
          b.textContent='Submit Resolution';
          notice(e.message,'error');
        }
      });
    }catch(e){notice(e.message,'error');}
  }

  async function wireDetailExtras(){
    const id=new URLSearchParams(location.search).get('id');
    if(!id)return;
    const reassign=$$('button').find(b=>/reassign crew/i.test(b.textContent));
    reassign?.addEventListener('click',async()=>{
      try{
        const p=await api('/api/admin/crews');
        const crews=p.crews||[];
        const body=crews.length?`
          <p style="font-size:13px;color:#64748b;margin-bottom:12px">Select an active municipal crew to assign this cluster to:</p>
          <label for="crew-select" style="font-weight:700;font-size:12px;color:#0f172a;display:block;margin-bottom:4px">Crew</label>
          <select class="civiclens-field" id="crew-select">${crews.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} | ${esc(c.specialty||'General civic maintenance')} (${esc(c.status)})</option>`).join('')}</select>
        `:`
          <p style="font-size:13px;color:#64748b;margin-bottom:12px">No crew records exist yet. Register a municipal maintenance team to assign:</p>
          <label for="crew-name" style="font-weight:700;font-size:12px;color:#0f172a;display:block;margin-bottom:4px">Municipal Team Name</label>
          <input class="civiclens-field" id="crew-name" maxlength="120" placeholder="e.g. Ward 14 Road Repair Squad">
          <label for="crew-specialty" style="font-weight:700;font-size:12px;color:#0f172a;display:block;margin-bottom:4px">Specialty</label>
          <input class="civiclens-field" id="crew-specialty" maxlength="120" value="General civic maintenance">
        `;
        const m=modal(crews.length?'Reassign Crew':'Add & Assign Municipal Crew',body,`<button class="civiclens-primary" id="assign-crew" style="background:#0d9488">${crews.length?'Assign Crew':'Create & Assign'}</button>`);
        $('#assign-crew',m.root).onclick=async()=>{
          const button=$('#assign-crew',m.root);
          button.disabled=true;
          button.textContent='Saving…';
          try{
            let crewId=$('#crew-select',m.root)?.value;
            if(!crews.length){
              const name=$('#crew-name',m.root).value.trim();
              if(!name)throw Error('Enter the municipal team name.');
              const created=await api('/api/admin/crews',{method:'POST',body:JSON.stringify({name,specialty:$('#crew-specialty',m.root).value.trim()})});
              crewId=created.crew.id;
            }
            await api(`/api/admin/clusters/${encodeURIComponent(id)}/assign`,{method:'POST',body:JSON.stringify({crew_id:crewId})});
            notice('Crew assigned successfully.','success');
            m.close();
            location.reload();
          }catch(e){
            button.disabled=false;
            button.textContent='Assign Crew';
            notice(e.message,'error');
          }
        };
      }catch(e){notice(e.message,'error');}
    });

    const chat=$$('button').find(b=>/chat_bubble/i.test($('.material-symbols-outlined',b)?.textContent||''));
    chat?.addEventListener('click',async()=>{
      try{
        const p=await api(`/api/admin/clusters/${encodeURIComponent(id)}/comments`);
        const m=modal('Internal Cluster Notes',`
          <div id="comment-list" style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
            ${(p.comments||[]).map(c=>`<div style="padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <b style="font-size:13px;color:#0f172a">${esc(c.officer_name||c.author_name||'Officer')}</b>
                <small style="color:#94a3b8;font-size:11px">${dateLabel(c.created_at)}</small>
              </div>
              <p style="margin:0;font-size:13px;color:#475569">${esc(c.body||c.comment)}</p>
            </div>`).join('')||'<p style="color:#94a3b8;text-align:center;padding:16px 0;font-size:13px">No internal notes yet.</p>'}
          </div>
          <textarea class="civiclens-field" id="new-comment" placeholder="Add an internal officer note…" rows="3"></textarea>
          <button class="civiclens-primary" id="add-comment" style="width:100%;background:#0f172a">Add Note</button>
        `);
        $('#add-comment',m.root).onclick=async()=>{
          const body=$('#new-comment',m.root).value.trim();
          if(!body)return;
          try{
            await api(`/api/admin/clusters/${encodeURIComponent(id)}/comments`,{method:'POST',body:JSON.stringify({body})});
            notice('Note recorded.','success');
            m.close();
          }catch(e){notice(e.message,'error');}
        };
      }catch(e){notice(e.message,'error');}
    });
  }

  async function wireVerifyFix(){
    try{await requireRole('citizen')}catch(e){return notice(e.message,'error');}
    const content=$('#verify-content'),empty=$('#verify-empty');
    try{
      const p=await api('/api/citizen/verify-target');
      const issue=p.issue;
      if(!issue){
        content?.classList.add('hidden');
        empty?.classList.remove('hidden');
        return;
      }
      const images=issue.images||[];
      const before=images.find(i=>i.image_role==='report')||images[0];
      const after=images.find(i=>i.image_role==='resolution')||images[images.length-1];
      if(before&&$('#beforeImage'))$('#beforeImage').src=before.url;
      if(after&&$('#afterImage'))$('#afterImage').src=after.url;
      setText('before-location',issue.address||'Reported location');
      setText('before-date',dateLabel(issue.created_at));
      setText('category-label',issue.category||'General Issue');
      setText('resolution-note',issue.resolution_note||'Resolved by municipal maintenance team.');
      setText('resolution-time',dateLabel(issue.created_at));
      setText('verify-issue-title',`${issue.title||'Your report'} · Ref: ${issue.tracking_id||''}`);
      
      const respond=async approved=>{
        const approveBtn=$('#approve-btn'),rejectBtn=$('#reject-btn');
        if(approveBtn)approveBtn.disabled=true;
        if(rejectBtn)rejectBtn.disabled=true;
        try{
          const r=await api(`/api/issues/${issue.id}/verify`,{method:'POST',body:JSON.stringify({approved})});
          notice(r.message||(approved?'Resolution confirmed. Thank you!':'Issue reopened for further review.'),'success');
          setTimeout(()=>go('dashboard.html'),700);
        }catch(e){
          if(approveBtn)approveBtn.disabled=false;
          if(rejectBtn)rejectBtn.disabled=false;
          notice(e.message,'error');
        }
      };
      const ab=$('#approve-btn'),rb=$('#reject-btn');
      if(ab)ab.onclick=()=>respond(true);
      if(rb)rb.onclick=()=>respond(false);
    }catch(e){
      notice(e.message,'error');
      content?.classList.add('hidden');
      empty?.classList.remove('hidden');
    }
  }

  async function wireSubmitted(){
    let data=null;
    try{data=JSON.parse(localStorage.getItem(LAST_SUBMISSION)||'null')}catch{}
    if(!data)return;
    const issue=data.issue||{};
    setText('tracking-id',`#${issue.tracking_id||'--'}`);
    const visualMatches=data.image_analysis?.similar_evidence_suggestions||[];
    setText('community-impact-note',
      (data.duplicate?`Grouped with ${Math.max(0,(data.cluster?.report_count||1)-1)} nearby report(s) to accelerate municipal response.`:'A new civic issue cluster was created for this report.')+
      (visualMatches.length?` Visual evidence matches ${visualMatches.length} earlier report(s).`: '')
    );
    const summary=$('#image-authenticity-summary');
    const showAnalysis=analysis=>{
      if(!summary||!analysis)return;
      const state=analysis.final_authenticity_state||'insufficient_evidence';
      const labels={
        provenance_verified:'Verified provenance (C2PA signed)',
        needs_review:'Flagged for manual review',
        likely_synthetic:'Possible synthetic image; queued for officer review',
        insufficient_evidence:'Image authenticity check complete (informational)'
      };
      summary.textContent=labels[state]||'Image authenticity check complete.';
    };
    showAnalysis(data.image_analysis);
    const panel=$('#photo-retry-panel');
    if(data.image_upload_pending&&panel){
      panel.classList.remove('hidden');
      const input=$('#retry-report-photo'),button=$('#retry-report-photo-btn'),status=$('#photo-retry-status');
      button?.addEventListener('click',async()=>{
        const file=input?.files?.[0];
        if(!file)return notice('Choose the report photo first.','error');
        button.disabled=true;
        if(status)status.textContent='Uploading photo…';
        try{
          const form=new FormData();
          form.append('image',file,file.name);
          const analysis=await api(`/api/issues/${encodeURIComponent(issue.id)}/images`,{method:'POST',body:form});
          data.image_analysis=analysis;
          data.image_upload_pending=false;
          localStorage.setItem(LAST_SUBMISSION,JSON.stringify(data));
          showAnalysis(analysis);
          panel.classList.add('hidden');
          notice('Photo attached to your saved report.','success');
        }catch(e){
          if(status)status.textContent=e.message;
          button.disabled=false;
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    addStyles();
    const p=location.pathname.toLowerCase();
    if(p.includes('/admin/')){
      if(p.endsWith('login.html'))wireAdminLogin();
      else{
        wireShell('admin');
        if(p.endsWith('dashboard.html'))wireAdminDashboard();
        else if(p.endsWith('metrics.html'))wireMetrics();
        else if(p.endsWith('escalations.html'))wireEscalations();
        else if(p.endsWith('cluster-detail.html')){
          wireDetail();
          wireDetailExtras();
        }
      }
    }else{
      if(p.endsWith('welcome.html')||p.endsWith('join.html'))wireAuth();
      if(p.endsWith('otp.html'))wireOtp();
      if(p.endsWith('report.html'))wireReport();
      if(p.endsWith('dashboard.html'))wireDashboard();
      if(p.endsWith('verify-fix.html'))wireVerifyFix();
      if(p.endsWith('submitted.html'))wireSubmitted();
      wireShell('citizen');
    }
    renderIcons();
  });

  window.CivicLens={api,openCamera,notice};
  window.NagarSetu=window.CivicLens;
})();
