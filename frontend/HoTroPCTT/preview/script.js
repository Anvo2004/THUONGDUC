const PHASES = ['Nhận biết dấu hiệu','Trước khi xảy ra','Trong khi xảy ra','Sau khi xảy ra','Kỹ năng an toàn'];

const CATEGORIES = [
  {id:'bao', name:'Bão, áp thấp nhiệt đới', img:9, vid:3, shape:'wind', color:'#2563EB'},
  {id:'lu', name:'Lũ', img:6, vid:5, shape:'wave', color:'#0891B2'},
  {id:'luquet', name:'Lũ quét', img:4, vid:4, shape:'wave', color:'#F97316'},
  {id:'satlo', name:'Sạt lở đất', img:4, vid:1, shape:'mountain', color:'#9333EA'},
  {id:'ngaplut', name:'Ngập lụt', img:2, vid:0, shape:'house', color:'#16A34A'},
  {id:'set', name:'Sét', img:3, vid:1, shape:'bolt', color:'#CA8A04'},
  {id:'mualon', name:'Mưa lớn', img:1, vid:0, shape:'drop', color:'#0284C7'},
  {id:'loc', name:'Lốc', img:2, vid:0, shape:'wind', color:'#0D9488'},
  {id:'muada', name:'Mưa đá', img:2, vid:0, shape:'drop', color:'#64748B'},
  {id:'nangnong', name:'Nắng nóng', img:4, vid:0, shape:'sun', color:'#D97706'},
  {id:'xamnhapman', name:'Xâm nhập mặn', img:3, vid:0, shape:'drop', color:'#059669'},
  {id:'hanhan', name:'Hạn hán', img:3, vid:0, shape:'sun', color:'#B45309'},
  {id:'rethai', name:'Rét hại', img:5, vid:0, shape:'snow', color:'#38BDF8'},
  {id:'suongmuoi', name:'Sương muối', img:2, vid:0, shape:'snow', color:'#94A3B8'},
  {id:'dongdat', name:'Động đất', img:1, vid:0, shape:'triangle', color:'#DC2626'},
  {id:'songthan', name:'Sóng thần', img:1, vid:0, shape:'wave', color:'#0E7490'},
  {id:'chayrung', name:'Cháy rừng', img:2, vid:0, shape:'flame', color:'#C2410C'},
  {id:'sutlundat', name:'Sụt lún đất', img:1, vid:0, shape:'triangle', color:'#92400E'},
  {id:'xoaynuoc', name:'Xoáy nước', img:1, vid:0, shape:'spiral', color:'#7C3AED'},
  {id:'giomanhbien', name:'Gió mạnh trên biển', img:1, vid:0, shape:'wind', color:'#0369A1'},
];
const HOME_FEATURED = ['bao','lu','luquet','satlo','ngaplut','set'];

function hexToRgba(hex,a){const h=hex.replace('#','');const r=parseInt(h.substring(0,2),16),g=parseInt(h.substring(2,4),16),b=parseInt(h.substring(4,6),16);return `rgba(${r},${g},${b},${a})`;}
function stripeBg(color){return `repeating-linear-gradient(135deg, ${hexToRgba(color,.16)} 0px, ${hexToRgba(color,.16)} 10px, ${hexToRgba(color,.06)} 10px, ${hexToRgba(color,.06)} 20px)`;}
function tint(color){return hexToRgba(color,.12);}
function catById(id){return CATEGORIES.find(c=>c.id===id);}

function iconSvg(shape){
  const o = 'width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  switch(shape){
    case 'wind': return `<svg ${o}><path d="M3 9c4 0 4-3 8-3s4 3 8 3"/><path d="M3 15c4 0 4-3 8-3s4 3 8 3"/></svg>`;
    case 'wave': return `<svg ${o}><path d="M2 10.5c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0"/><path d="M2 15.5c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0"/></svg>`;
    case 'mountain': return `<svg ${o}><path d="M3 19L9 7l4 5 3-3 5 10z"/></svg>`;
    case 'house': return `<svg ${o}><path d="M4 12l8-7 8 7"/><path d="M6 11v8h12v-8"/><path d="M4 20h16" stroke-width="1.5"/></svg>`;
    case 'bolt': return `<svg ${o}><polygon points="13 2 3 14 11 14 9 22 21 10 13 10" fill="#fff" stroke="none"/></svg>`;
    case 'drop': return `<svg ${o}><path d="M12 2C12 2 5 11 5 15a7 7 0 0014 0c0-4-7-13-7-13z" fill="#fff" stroke="none"/></svg>`;
    case 'sun': return `<svg ${o}><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="M4.9 4.9l2.1 2.1"/><path d="M17 17l2.1 2.1"/><path d="M4.9 19.1L7 17"/><path d="M17 7l2.1-2.1"/></svg>`;
    case 'snow': return `<svg ${o}><path d="M12 2v20"/><path d="M4 7l16 10"/><path d="M20 7L4 17"/></svg>`;
    case 'triangle': return `<svg ${o}><path d="M12 3L22 20H2z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="0.6" fill="#fff"/></svg>`;
    case 'flame': return `<svg ${o}><path d="M12 2c3 4 6 7 6 11a6 6 0 11-12 0c0-2 1-4 2-5 .3 1.3 1.6 2 1.6 2-1-3 1-6 2.4-8z" fill="#fff" stroke="none"/></svg>`;
    case 'spiral': return `<svg ${o}><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.2"/></svg>`;
    default: return `<svg ${o}><circle cx="12" cy="12" r="7"/></svg>`;
  }
}
const playIcon = (color,size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="M8 5v14l11-7z"/></svg>`;

function genItems(cat, count, kind){
  const items = [];
  for(let i=0;i<count;i++){
    const phase = PHASES[i % PHASES.length];
    items.push({
      idx:i, phase,
      title: kind==='video' ? `${phase} khi có ${cat.name.toLowerCase()}` : `${phase} ${cat.name.toLowerCase()}`,
      duration: `${3+(i%4)}:${(10+i*7)%60 < 10 ? '0'+((10+i*7)%60) : (10+i*7)%60}`,
    });
  }
  return items;
}
function tipsFor(name, phase){
  const n = name.toLowerCase();
  const bank = {
    before:[`Theo dõi bản tin thời tiết và cảnh báo ${n} từ chính quyền địa phương.`,`Chuẩn bị sẵn đồ dùng thiết yếu: nước uống, đèn pin, thuốc, giấy tờ quan trọng.`,`Xác định nơi trú ẩn an toàn và đường di chuyển của gia đình.`],
    during:[`Giữ bình tĩnh, đưa trẻ em và người già đến nơi an toàn đã chọn trước.`,`Không di chuyển qua khu vực đang chịu ảnh hưởng của ${n}.`,`Luôn theo dõi thông báo mới nhất từ loa phát thanh xã, phường.`],
    after:[`Kiểm tra an toàn nhà cửa, điện, nước trước khi quay lại sinh hoạt.`,`Báo cáo thiệt hại với chính quyền địa phương để được hỗ trợ.`,`Vệ sinh môi trường, phòng tránh dịch bệnh sau ${n}.`],
  };
  return bank[phase];
}

const state = { page:'home', galleryCatId:null, videoCatId:null, selectedItemKey:null, selectedVideoKey:null, searchQuery:'' };
const app = document.getElementById('app');

function goHome(){ Object.assign(state,{page:'home',galleryCatId:null,videoCatId:null}); render(); }
function goGalleryTab(){ Object.assign(state,{page:'gallery',galleryCatId:null}); render(); }
function goVideoTab(){ Object.assign(state,{page:'video',videoCatId:null}); render(); }
function openGalleryCat(id){ Object.assign(state,{page:'gallery',galleryCatId:id}); render(); }
function openVideoCat(id){ Object.assign(state,{page:'video',videoCatId:id}); render(); }
function backToGalleryCats(){ Object.assign(state,{page:'gallery',galleryCatId:null}); render(); }
function backToVideoCats(){ Object.assign(state,{page:'video',videoCatId:null}); render(); }
function backToGalleryItems(){ state.page='gallery'; state.selectedItemKey=null; render(); }
function backToVideoItems(){ state.page='video'; state.selectedVideoKey=null; render(); }
function openItem(catId,idx){ Object.assign(state,{page:'guideDetail',galleryCatId:catId,selectedItemKey:catId+'-'+idx}); render(); }
function openVideo(catId,idx){ Object.assign(state,{page:'videoDetail',videoCatId:catId,selectedVideoKey:catId+'-'+idx}); render(); }
function onSearchChange(e){ state.searchQuery=e.target.value; render(); }

function renderNav(){
  const tabClass = (active) => 'tab' + (active ? ' active' : '');
  document.getElementById('nav-home').className = tabClass(state.page==='home');
  document.getElementById('nav-gallery').className = tabClass(state.page==='gallery'||state.page==='guideDetail');
  document.getElementById('nav-video').className = tabClass(state.page==='video'||state.page==='videoDetail');
}

function renderHome(){
  const featured = HOME_FEATURED.map(catById).filter(c => !state.searchQuery || c.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
  const chips = featured.map(c => `
    <div class="cat-chip" onclick="openGalleryCat('${c.id}')">
      <div class="cat-icon-round" style="background:${c.color};box-shadow:0 8px 18px -6px ${c.color};">${iconSvg(c.shape)}</div>
      <div class="cat-name">${c.name}</div>
    </div>`).join('');
  const noResults = state.searchQuery && featured.length===0 ? `<div class="no-results">Không tìm thấy chuyên đề phù hợp.</div>` : '';
  const searchLabel = state.searchQuery ? `<div class="muted" style="font-size:13px;">${featured.length} kết quả cho "${state.searchQuery}"</div>` : '';

  return `
  <div class="hero">
    <div class="hero-content">
      <div class="hero-label">UBND XÃ THƯỢNG ĐỨC</div>
      <div class="hero-title">Kỹ năng phòng chống thiên tai</div>
      <div class="hero-desc">Hình ảnh và video hướng dẫn cách giữ an toàn cho gia đình khi có bão, lũ, sạt lở đất và các loại thiên tai khác. Xem miễn phí, tải về được, chia sẻ cho người thân.</div>
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
        <input placeholder="Tìm: bão, sạt lở, đuối nước..." value="${state.searchQuery}" oninput="onSearchChange(event)"/>
        <div class="search-btn">Tìm</div>
      </div>
    </div>
  </div>

  <div class="section-row"><div class="section-title">Chuyên đề thường gặp</div>${searchLabel}</div>
  <div class="grid-cats">${chips}</div>
  ${noResults}

  <div class="section-title" style="margin-top:38px;margin-bottom:16px;">Xem theo định dạng</div>
  <div class="grid-format">
    <div class="format-card" onclick="goGalleryTab()">
      <div class="format-icon" style="background:linear-gradient(135deg,#EC4899,#8B5CF6);"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-4-4 3-3-2-6 5"/></svg></div>
      <div><div class="format-title">Hình ảnh hướng dẫn</div><div class="format-meta">57 bài · 20 chuyên đề</div><div class="format-desc">Tranh minh họa từng bước cần làm trước, trong và sau thiên tai.</div></div>
    </div>
    <div class="format-card" onclick="goVideoTab()">
      <div class="format-icon" style="background:linear-gradient(135deg,#0EA5E9,#22C55E);"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 9l4-2v10l-4-2z"/></svg></div>
      <div><div class="format-title">Video hướng dẫn</div><div class="format-meta">14 video · Đa số có bản thủ ngữ</div><div class="format-desc">Phim hoạt hình ngắn, dễ hiểu, có bản dành cho người khiếm thính.</div></div>
    </div>
  </div>

  <div class="emergency">
    <div class="emergency-title">Khi có tình huống khẩn cấp</div>
    <div class="emergency-desc">Gọi ngay các số dưới đây — miễn phí, gọi được cả khi máy hết tiền.</div>
    <div class="emergency-grid">
      <a class="emergency-card" href="tel:112"><div class="emergency-num" style="color:#DC2626;">112</div><div class="emergency-label">Cứu nạn, cứu hộ</div></a>
      <a class="emergency-card" href="tel:113"><div class="emergency-num" style="color:#2563EB;">113</div><div class="emergency-label">Công an</div></a>
      <a class="emergency-card" href="tel:114"><div class="emergency-num" style="color:#EA580C;">114</div><div class="emergency-label">Cứu hỏa</div></a>
      <a class="emergency-card" href="tel:115"><div class="emergency-num" style="color:#16A34A;">115</div><div class="emergency-label">Cấp cứu y tế</div></a>
    </div>
  </div>`;
}

function renderGalleryCats(){
  const cards = CATEGORIES.map(c => `
    <div class="cover-card" onclick="openGalleryCat('${c.id}')">
      <div class="cover-strip" style="background:${stripeBg(c.color)};">
        <div class="cover-badge" style="background:${c.color};box-shadow:0 6px 16px -4px ${c.color};">${iconSvg(c.shape)}</div>
      </div>
      <div class="cover-body"><div class="cover-name">${c.name}</div><div class="cover-meta">${c.img} bài hướng dẫn</div></div>
    </div>`).join('');
  return `
  <div class="breadcrumb"><a class="link" onclick="goHome()">Trang chủ</a> &nbsp;›&nbsp; Hình ảnh hướng dẫn</div>
  <div style="font-size:28px;font-weight:800;">Hình ảnh hướng dẫn</div>
  <div class="muted" style="font-size:14px;margin:8px 0 24px;">57 bài hướng dẫn bằng hình, chia theo 20 loại thiên tai. Chọn chuyên đề bạn quan tâm.</div>
  <div class="grid-covers">${cards}</div>`;
}

function renderGalleryItems(){
  const cat = catById(state.galleryCatId);
  const items = genItems(cat, cat.img, 'image');
  const cards = items.map(it => `
    <div class="item-card" onclick="openItem('${cat.id}',${it.idx})">
      <div class="item-thumb" style="background:${stripeBg(cat.color)};">ảnh minh họa</div>
      <div class="item-body">
        <div class="item-tag" style="color:${cat.color};background:${tint(cat.color)};">${it.phase}</div>
        <div class="item-title">${it.title}</div>
      </div>
    </div>`).join('');
  return `
  <div class="breadcrumb"><a class="link" onclick="goHome()">Trang chủ</a> &nbsp;›&nbsp; <a class="link" onclick="backToGalleryCats()">Hình ảnh hướng dẫn</a> &nbsp;›&nbsp; ${cat.name}</div>
  <div class="cat-header">
    <div class="cat-header-icon" style="background:${cat.color};box-shadow:0 8px 20px -6px ${cat.color};">${iconSvg(cat.shape)}</div>
    <div><div class="cat-header-name">${cat.name}</div><div class="cat-header-meta">${cat.img} bài hướng dẫn</div></div>
  </div>
  <div class="grid-items">${cards}</div>`;
}

function renderGuideDetail(){
  const [catId, idxStr] = state.selectedItemKey.split('-');
  const cat = catById(catId); const idx = parseInt(idxStr,10);
  const it = genItems(cat, cat.img, 'image')[idx];
  const tipsBlock = (title, color, tips) => `
    <div class="tips-card"><div class="tips-heading" style="color:${color};">${title}</div>${tips.map(t=>`<div class="tip-line">• ${t}</div>`).join('')}</div>`;
  return `
  <div class="breadcrumb"><a class="link" onclick="goHome()">Trang chủ</a> &nbsp;›&nbsp; <a class="link" onclick="backToGalleryCats()">Hình ảnh hướng dẫn</a> &nbsp;›&nbsp; <a class="link" onclick="backToGalleryItems()">${cat.name}</a> &nbsp;›&nbsp; ${it.title}</div>
  <div class="back-link" onclick="backToGalleryItems()">← Quay lại danh sách</div>
  <div class="detail-cover" style="background:${stripeBg(cat.color)};">ảnh minh họa hướng dẫn</div>
  <div class="detail-tag-row"><div class="detail-tag" style="color:${cat.color};background:${tint(cat.color)};">${cat.name}</div></div>
  <div class="detail-title">${it.title}</div>
  <div class="tips-grid">
    ${tipsBlock('Trước khi xảy ra','#0EA5E9', tipsFor(cat.name,'before'))}
    ${tipsBlock('Trong khi xảy ra','#F59E0B', tipsFor(cat.name,'during'))}
    ${tipsBlock('Sau khi xảy ra','#22C55E', tipsFor(cat.name,'after'))}
  </div>`;
}

function renderVideoCats(){
  const cards = CATEGORIES.filter(c=>c.vid>0).map(c => `
    <div class="cover-card" onclick="openVideoCat('${c.id}')">
      <div class="cover-strip" style="background:${stripeBg(c.color)};">
        <div class="play-dot">${playIcon(c.color,16)}</div>
        <div class="cover-badge" style="background:${c.color};box-shadow:0 6px 16px -4px ${c.color};">${iconSvg(c.shape)}</div>
      </div>
      <div class="cover-body"><div class="cover-name">${c.name}</div><div class="cover-meta">${c.vid} video</div></div>
    </div>`).join('');
  return `
  <div class="breadcrumb"><a class="link" onclick="goHome()">Trang chủ</a> &nbsp;›&nbsp; Video hướng dẫn</div>
  <div style="font-size:28px;font-weight:800;">Video hướng dẫn</div>
  <div class="muted" style="font-size:14px;margin:8px 0 18px;">14 phim hoạt hình ngắn hướng dẫn ứng phó bão, lũ, lũ quét, sạt lở đất và sét.</div>
  <div class="signlang-banner">Phần lớn video có bản thủ ngữ dành cho người khiếm thính</div>
  <div class="grid-covers">${cards}</div>`;
}

function renderVideoItems(){
  const cat = catById(state.videoCatId);
  const items = genItems(cat, cat.vid, 'video');
  const cards = items.map(it => `
    <div class="item-card" onclick="openVideo('${cat.id}',${it.idx})">
      <div class="item-thumb" style="background:${stripeBg(cat.color)};"><div class="play-circle">${playIcon(cat.color,18)}</div></div>
      <div class="item-body"><div class="item-title">${it.title}</div><div class="item-duration">${it.duration} · Có phụ đề</div></div>
    </div>`).join('');
  return `
  <div class="breadcrumb"><a class="link" onclick="goHome()">Trang chủ</a> &nbsp;›&nbsp; <a class="link" onclick="backToVideoCats()">Video hướng dẫn</a> &nbsp;›&nbsp; ${cat.name}</div>
  <div class="cat-header">
    <div class="cat-header-icon" style="background:${cat.color};box-shadow:0 8px 20px -6px ${cat.color};">${iconSvg(cat.shape)}</div>
    <div><div class="cat-header-name">${cat.name}</div><div class="cat-header-meta">${cat.vid} video</div></div>
  </div>
  <div class="grid-items">${cards}</div>`;
}

function renderVideoDetail(){
  const [catId, idxStr] = state.selectedVideoKey.split('-');
  const cat = catById(catId); const idx = parseInt(idxStr,10);
  const it = genItems(cat, cat.vid, 'video')[idx];
  const desc = `Phim hoạt hình ngắn hướng dẫn kỹ năng ${it.phase.toLowerCase()} ${cat.name.toLowerCase()}, dễ hiểu cho mọi lứa tuổi, có bản thủ ngữ dành cho người khiếm thính.`;
  return `
  <div class="breadcrumb"><a class="link" onclick="goHome()">Trang chủ</a> &nbsp;›&nbsp; <a class="link" onclick="backToVideoCats()">Video hướng dẫn</a> &nbsp;›&nbsp; <a class="link" onclick="backToVideoItems()">${cat.name}</a> &nbsp;›&nbsp; ${it.title}</div>
  <div class="back-link" onclick="backToVideoItems()">← Quay lại danh sách</div>
  <div class="detail-video-cover" style="background:${stripeBg(cat.color)};"><div class="play-circle-lg">${playIcon(cat.color,30)}</div></div>
  <div class="detail-tag-row">
    <div class="detail-tag" style="color:${cat.color};background:${tint(cat.color)};">${cat.name}</div>
    <div class="detail-tag-signlang">Có bản thủ ngữ</div>
  </div>
  <div class="detail-title">${it.title}</div>
  <div class="detail-desc">${desc}</div>`;
}

function render(){
  renderNav();
  let html = '';
  if(state.page==='home') html = renderHome();
  else if(state.page==='gallery' && !state.galleryCatId) html = renderGalleryCats();
  else if(state.page==='gallery' && state.galleryCatId) html = renderGalleryItems();
  else if(state.page==='guideDetail') html = renderGuideDetail();
  else if(state.page==='video' && !state.videoCatId) html = renderVideoCats();
  else if(state.page==='video' && state.videoCatId) html = renderVideoItems();
  else if(state.page==='videoDetail') html = renderVideoDetail();
  app.innerHTML = html;
}

render();
