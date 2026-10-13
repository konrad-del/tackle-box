(function(){const D=window.LURE_DATA,L=D.lures,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FISH={'Bluefin tuna':'Tuna','Yellowfin tuna':'Tuna','Wahoo':'Wahoo'};
// Spec parsing (only from data.js fields)
const spd=l=>{const m=(l.trolling_speed_text||'').match(/(\d+)\s*-\s*(\d+)\s*kn/);return m?[+m[1],+m[2]]:null};
const dep=l=>{const t=l.running_depth||'';if(/surface/i.test(t))return 0;const n=t.match(/\d+/g);return n?+n[n.length-1]:null};
const len=l=>{const m=(l.length||'').match(/^(\d+)(?:-(\d+)\/(\d+))?/);return m?+m[1]+(m[2]?m[2]/m[3]:0):0};
// Positions in fixed fill order. x: -1 port … +1 starboard, back: 0 at transom … 1 farthest.
const POS=[['Shotgun (center)',0,.95],['Short corner (port)',-.22,.28],['Short corner (starboard)',.22,.28],['Long rigger (port)',-.95,.82],
 ['Long rigger (starboard)',.95,.82],['Short rigger (port)',-.7,.55],['Short rigger (starboard)',.7,.55],['Flat line (starboard)',.5,.06]];
const SR=L.map(spd).filter(Boolean),SMIN=Math.min(...SR.map(r=>r[0])),SMAX=Math.max(...SR.map(r=>r[1]));
function build(fish,n,k){const tag=FISH[fish],pool=L.map(l=>({l,s:spd(l),d:dep(l),z:len(l),sp:(l.target_species||[]).includes(tag)})).filter(x=>x.s&&x.d!=null);
 // Rule 1: only lures whose Nomad trolling range includes the chosen speed k.
 const c=pool.filter(x=>x.s[0]<=k&&k<=x.s[1]);if(!c.length)return {k,rods:[],count:0};
 // Rule 2: species-named lures first, then pick to spread running depth (alternate deepest/shallowest remaining), sizes as tie-break.
 const named=c.filter(x=>x.sp),other=c.filter(x=>!x.sp),order=[];
 for(const grp of [named,other]){const g=[...grp].sort((a,b)=>b.d-a.d||b.z-a.z);let t=1;while(g.length){order.push(t?g.shift():g.pop());t^=1;}}
 let picks=order.slice(0,n);while(picks.length<n)picks.push(order[picks.length%order.length]); // Rule 3: reuse models only if fewer models than rods
 // Rule 4: deepest runners closest to the boat, shallowest farthest back.
 const pos=POS.slice(0,n).map((p,i)=>({p,i})).sort((a,b)=>a.p[2]-b.p[2]);picks=[...picks].sort((a,b)=>b.d-a.d||b.z-a.z);
 const used=new Set(),rods=pos.map((q,j)=>{const x=picks[j];
  // Rule 5 (neutral, not a performance claim): first color in Nomad's list not yet used in this spread.
  const col=x.l.colors.find(c=>!used.has(c))||x.l.colors[j%x.l.colors.length];used.add(col);
  const why=[`Runs ${x.l.running_depth}, ${x.l.length}`,`troll range ${x.s[0]}–${x.s[1]} kn includes your ${k} kn`,
   x.sp?`Nomad's page names ${tag}`:`Nomad's page does not name ${tag} (filler: no species-named lure left at this speed)`,
   x.d>=30?'deep runner kept close to the boat':x.d<=5?'shallow runner set farther back':'mid-depth runner'];
  return {i:q.i,pos:q.p,l:x.l,col,why:why.join('; ')+'.',sp:x.sp}}).sort((a,b)=>a.i-b.i);
 return {k,rods,count:c.length}}
// Stylized top-down boat + animated spread. Tiers: 1-2 center console, 3 sportfisher, 4-6 large sportfisher + outriggers, 7-8 game boat + tower.
const RM=matchMedia('(prefers-reduced-motion: reduce)');
function hull(cx,y,L,W){const r=W/2;return `M${cx},${y} C${cx+r*.9},${y+L*.18} ${cx+r},${y+L*.45} ${cx+r},${y+L*.62} L${cx+r*.92},${y+L} L${cx-r*.92},${y+L} L${cx-r},${y+L*.62} C${cx-r},${y+L*.45} ${cx-r*.9},${y+L*.18} ${cx},${y}Z`}
function boatSVG(n,cx,y){const T=n<=2?{L:120,W:46,k:'cc'}:n<=3?{L:160,W:60,k:'sf'}:n<=6?{L:180,W:68,k:'sfr'}:{L:205,W:76,k:'gb'};
 const {L,W}=T,b=y+L,riggers=T.k=='sfr'||T.k=='gb',span=T.k=='gb'?330:290;let g='';
 // outriggers (behind hull)
 if(riggers)for(const s of[-1,1])g+=`<line x1="${cx+s*W*.42}" y1="${y+L*.42}" x2="${cx+s*span}" y2="${y+L*.95}" stroke="#c9d3de" stroke-width="3" stroke-linecap="round"/><circle cx="${cx+s*span}" cy="${y+L*.95}" r="3.5" fill="#fff"/>`;
 g+=`<path d="${hull(cx,y+4,L,W)}" fill="#03111f" opacity=".35"/>`;
 g+=`<path d="${hull(cx,y,L,W)}" fill="url(#hullg)" stroke="#d9dee4" stroke-width="1.5"/>`;
 g+=`<path d="${hull(cx,y+7,L-12,W-10)}" fill="#e8e3d8"/>`;
 g+=`<line x1="${cx}" y1="${y+8}" x2="${cx}" y2="${y+L*.3}" stroke="#d6d0c3" stroke-width="1"/>`;
 if(T.k=='cc'){g+=`<rect x="${cx-10}" y="${y+L*.42}" width="20" height="18" rx="4" fill="#0a2540"/><rect x="${cx-12}" y="${y+L*.38}" width="24" height="5" rx="2" fill="#7fb3d5" opacity=".9"/><rect x="${cx-14}" y="${b-12}" width="28" height="8" rx="2" fill="#2c3e50"/>`}
 else{const cw=W*.72,ch=L*.38,cy=y+L*.28;g+=`<rect x="${cx-cw/2}" y="${cy}" width="${cw}" height="${ch}" rx="9" fill="#fff" stroke="#cfd6dd"/><path d="M${cx-cw/2+4},${cy+8} Q${cx},${cy-2} ${cx+cw/2-4},${cy+8} L${cx+cw/2-6},${cy+16} Q${cx},${cy+8} ${cx-cw/2+6},${cy+16}Z" fill="#0a2540"/>`;
  if(T.k!='sf'||true)g+=`<rect x="${cx-cw*.32}" y="${cy+ch*.45}" width="${cw*.64}" height="${ch*.4}" rx="6" fill="#eef1f4" stroke="#cfd6dd"/>`;
  if(T.k=='gb'){g+=`<rect x="${cx-cw*.42}" y="${cy-6}" width="${cw*.84}" height="${ch*.62}" rx="6" fill="none" stroke="#0a2540" stroke-width="2.5"/><rect x="${cx-cw*.3}" y="${cy+2}" width="${cw*.6}" height="${ch*.3}" rx="4" fill="#0a2540" opacity=".85"/>`}
  g+=`<rect x="${cx-W*.3}" y="${b-L*.2}" width="${W*.6}" height="${L*.12}" rx="3" fill="#d8cfbe"/><circle cx="${cx}" cy="${b-L*.14}" r="4" fill="#0a2540"/>`}
 // rod tips: transom corners & center
 const tips={c:[cx,b-2],p:[cx-W*.4,b-4],s:[cx+W*.4,b-4],P:riggers?[cx-span,y+L*.95]:[cx-W*.46,b-L*.25],S:riggers?[cx+span,y+L*.95]:[cx+W*.46,b-L*.25]};
 return {svg:g,tips,b,kind:T.k}}
function boat(rods){const n=rods.length,W=1000,cx=W/2,top=26,B=boatSVG(n,cx,top),H=B.b+(n>3?560:420),mo=!RM.matches;
 const far=H-B.b-190,pt=r=>({x:cx+r.pos[1]*(B.kind=='gb'?380:B.kind=='sfr'?360:300),y:B.b+80+r.pos[2]*far});
 const tip=r=>{const x=r.pos[1];return Math.abs(x)>.5?(x<0?B.tips.P:B.tips.S):x==0?B.tips.c:(x<0?B.tips.p:B.tips.s)};
 const wake=`<g class="wake"><path d="M${cx-24},${B.b} Q${cx-90},${B.b+160} ${cx-200},${H}" /><path d="M${cx+24},${B.b} Q${cx+90},${B.b+160} ${cx+200},${H}" /><path class="prop" d="M${cx},${B.b} L${cx},${H}"/></g>`;
 const lines=rods.map((r,k)=>{const a=tip(r),p=pt(r),d=2.5+k*.37,mx=(a[0]+p.x)/2,my=(a[1]+p.y)/2+18,sw=6+r.pos[2]*6,
  path=dx=>`M${a[0]},${a[1]} Q${mx+dx*.5},${my} ${p.x+dx},${p.y-36}`,
  anim=mo?`<animate attributeName="d" dur="${d}s" repeatCount="indefinite" values="${path(-sw)};${path(sw)};${path(-sw)}" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`:'',
  tr=mo?`<animateTransform attributeName="transform" type="translate" dur="${d}s" repeatCount="indefinite" values="${-sw} 0;${sw} 0;${-sw} 0" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>`:'',
  img=r.l.image_url?`<image href="${esc(r.l.image_url)}&width=240" x="${p.x-62}" y="${p.y-32}" width="124" height="64" preserveAspectRatio="xMidYMid meet" clip-path="url(#lc)"/>`:'';
  return {line:`<path class="fl" d="${path(0)}">${anim}</path>`,lure:`<g class="lure"><g>${tr}<g class="bob" style="animation-delay:-${k*.4}s"><ellipse cx="${p.x}" cy="${p.y+2}" rx="76" ry="42" fill="#7fd3ff" opacity=".12"/><rect x="${p.x-66}" y="${p.y-36}" width="132" height="72" rx="16" fill="#fff" stroke="rgba(255,255,255,.6)"/>${img}<circle cx="${p.x-64}" cy="${p.y-34}" r="15" fill="#ff6a3d" stroke="#fff" stroke-width="2"/><text x="${p.x-64}" y="${p.y-28.5}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${k+1}</text></g></g><text x="${p.x}" y="${p.y+58}" text-anchor="middle" class="lab">${esc(r.pos[0].replace(/ \(.*\)/,''))}</text></g>`}});
 return `<svg class="boatsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${n}-rod spread behind a stylized boat">
 <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d3a63"/><stop offset="1" stop-color="#061a2e"/></linearGradient>
 <linearGradient id="hullg" x1="0" x2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#dfe5ea"/></linearGradient>
 <clipPath id="lc">${rods.map((r,k)=>{const p=pt(r);return `<rect x="${p.x-64}" y="${p.y-34}" width="128" height="68" rx="14"/>`}).join('')}</clipPath>
 <pattern id="ripple" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 Q20 12 40 20 T80 20" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="2"/></pattern></defs>
 <rect width="${W}" height="${H}" rx="22" fill="url(#sea)"/><rect class="ripple" width="${W}" height="${H+40}" y="-40" fill="url(#ripple)"/>
 ${wake}${lines.map(x=>x.line).join('')}${B.svg}${lines.map(x=>x.lure).join('')}
 <text x="${W-16}" y="${H-18}" text-anchor="end" font-size="14" fill="#9fb0c2">Stylized, not to scale · lure photos: Nomad main product image</text></svg>`}

Object.keys(FISH).forEach(f=>$('#s-fish').insertAdjacentHTML('beforeend',`<option>${esc(f)}</option>`));
for(let i=1;i<=8;i++)$('#s-rods').insertAdjacentHTML('beforeend',`<option${i==4?' selected':''}>${i}</option>`);
function run(){const fish=$('#s-fish').value,n=+$('#s-rods').value,k=+$('#s-speed').value,o=build(fish,n,k);window.lastSpread=o;$('#s-speed-val').textContent=k+' kn';
 if(!o.rods.length){$('#spread-out').innerHTML=`<p class="eyebrow">Suggested starting spread, rule of thumb from Nomad specs, not Nomad advice</p><h3 class="sp-h">No Nomad lure in this demo is rated for ${k} kn</h3><p class="muted">Trolling ranges in this demo run from ${SMIN} to ${SMAX} kn. Try another speed.</p>`;return}
 $('#spread-out').innerHTML=`<p class="eyebrow">Suggested starting spread, rule of thumb from Nomad specs, not Nomad advice</p>
 <h3 class="sp-h">${n} rod${n>1?'s':''} · ${esc(fish)} · ${k} kn · ${o.count} of ${L.length} lures rated for this speed</h3>
 <div class="sp-grid">${boat(o.rods)}<ol class="rods">${o.rods.map(r=>`<li><div class="rod-pos">${esc(r.pos[0])}</div>
 <button class="rod-lure" data-id="${r.l.id}">${esc(r.l.model)}</button> <span class="chip">${esc(r.col)}</span>
 <p class="muted">${esc(r.why)}</p></li>`).join('')}</ol></div>
 <p class="muted small">Colors: neutral rule (first color in Nomad's list not already used in this spread), not a claim about what works.</p>`;
 document.querySelectorAll('.rod-lure').forEach(b=>b.onclick=()=>window.openLure(b.dataset.id));}
$('#s-fish').onchange=$('#s-rods').onchange=run;$('#s-speed').oninput=run;window.buildSpread=build;run();})();
