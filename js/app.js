(function(){const D=window.LURE_DATA,L=D.lures,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const v=x=>x==null?'<span class="null">Not listed</span>':esc(x);
$('#fdate').textContent=D.fetched_date;
const species=[...new Set(L.flatMap(l=>l.target_species||[]))].sort();
species.forEach(s=>$('#f-species').insertAdjacentHTML('beforeend',`<option>${esc(s)}</option>`));
const speeds=[...new Set(L.map(l=>l.max_trolling_speed_kn).filter(x=>x!=null))].sort((a,b)=>a-b);
speeds.forEach(s=>$('#f-speed').insertAdjacentHTML('beforeend',`<option value="${s}">${s} kn max or faster</option>`));
const price=l=>l.price==null?null:`$${l.price.toFixed(2)} ${l.currency}`;
function render(){const sp=$('#f-species').value,min=parseFloat($('#f-speed').value)||0;
 const r=L.filter(l=>(!sp||(l.target_species||[]).includes(sp))&&(!min||(l.max_trolling_speed_kn||0)>=min));
 $('#count').textContent=`${r.length} of ${L.length} lures`;
 $('#grid').innerHTML=r.map(l=>`<button class="card" data-id="${l.id}"><div class="img">${l.image_url?`<img loading="lazy" src="${esc(l.image_url)}&width=600" alt="">`:''}</div>
 <div class="body"><h3>${esc(l.model)}</h3><div class="meta">${v(l.length)} · ${v(l.weight)} · ${l.colors.length} colors</div>
 ${l.max_trolling_speed_kn!=null?`<span class="pill">Up to ${l.max_trolling_speed_kn} kn</span>`:''}</div></button>`).join('');
 document.querySelectorAll('.card').forEach(c=>c.onclick=()=>open(c.dataset.id));}
function open(id){const l=L.find(x=>x.id===id);
 $('#detail-body').innerHTML=`<div class="dgrid"><div>${l.image_url?`<img src="${esc(l.image_url)}&width=900" alt="${esc(l.model)}">`:''}</div><div>
 <p class="eyebrow">${esc(l.family)}</p><h2>${esc(l.model)}</h2><div class="muted">${v(price(l))}</div>
 <dl><dt>Length</dt><dd>${v(l.length)}</dd><dt>Weight</dt><dd>${v(l.weight)}</dd><dt>Running depth</dt><dd>${v(l.running_depth)}</dd>
 <dt>Action</dt><dd>${v(l.action)}</dd><dt>Trolling speed</dt><dd>${v(l.trolling_speed_text)}</dd><dt>Hooks</dt><dd>${v(l.hooks_rings)}</dd>
 <dt>Species named</dt><dd>${l.target_species?esc(l.target_species.join(', ')):v(null)}</dd></dl></div></div>
 <p class="eyebrow" style="margin-top:28px">${l.colors.length} colors offered</p><div class="colors">${l.colors.map(c=>`<span>${esc(c)}</span>`).join('')}</div>
 <a class="buy" href="${esc(l.product_url)}" target="_blank" rel="noopener">Buy from Nomad →</a>`;
 $('#detail').hidden=false;document.body.style.overflow='hidden';}
function close(){$('#detail').hidden=true;document.body.style.overflow='';}
$('.close').onclick=close;$('#detail').onclick=e=>{if(e.target.id==='detail')close()};document.onkeydown=e=>{if(e.key==='Escape')close()};
$('#f-species').onchange=$('#f-speed').onchange=render;render();window.openLure=open;const m=location.hash.match(/^#lure=(.+)/);if(m)open(decodeURIComponent(m[1]));})();
