(function(){const D=window.LURE_DATA,L=D.lures,R=window.RIGGING||{},$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FISH={'Bluefin tuna':'Tuna','Yellowfin tuna':'Tuna','Wahoo':'Wahoo'};
// Spec parsing (only from data.js fields)
const spd=l=>{const m=(l.trolling_speed_text||'').match(/(\d+)\s*-\s*(\d+)\s*kn/);return m?[+m[1],+m[2]]:null};
const dep=l=>{const t=l.running_depth||'';if(/surface/i.test(t))return 0;const n=t.match(/\d+/g);return n?+n[n.length-1]:null};
const len=l=>{const m=(l.length||'').match(/^(\d+)(?:-(\d+)\/(\d+))?/);return m?+m[1]+(m[2]?m[2]/m[3]:0):0};
// Positions in fixed fill order. x: -1 port … +1 starboard, back: 0 at transom … 1 farthest.
const POS=[['Shotgun (center)',0,.95],['Short corner (port)',-.22,.28],['Short corner (starboard)',.22,.28],['Long rigger (port)',-.95,.82],
 ['Long rigger (starboard)',.95,.82],['Short rigger (port)',-.7,.55],['Short rigger (starboard)',.7,.55],['Flat line (starboard)',.12,.14]];
function build(fish,n){const tag=FISH[fish],pool=L.map(l=>({l,s:spd(l),d:dep(l),z:len(l),sp:(l.target_species||[]).includes(tag)})).filter(x=>x.s&&x.d!=null);
 // Rule 1: common speed = integer knot covered by the most lures; ties -> more species-named lures -> lower speed.
 let best=null;for(let k=1;k<=25;k++){const c=pool.filter(x=>x.s[0]<=k&&k<=x.s[1]);if(!c.length)continue;
  const sc=[Math.min(c.length,n),c.filter(x=>x.sp).length,c.length];
  if(!best||sc[0]>best.sc[0]||(sc[0]==best.sc[0]&&(sc[1]>best.sc[1]||(sc[1]==best.sc[1]&&sc[2]>best.sc[2]))))best={k,c,sc};}
 const c=best.c,lo=Math.max(...c.map(x=>x.s[0])),hi=Math.min(...c.map(x=>x.s[1]));
 // Rule 2: species-named lures first, then pick to spread running depth (alternate deepest/shallowest remaining), sizes as tie-break.
 const named=c.filter(x=>x.sp),other=c.filter(x=>!x.sp),order=[];
 for(const grp of [named,other]){const g=[...grp].sort((a,b)=>b.d-a.d||b.z-a.z);let t=1;while(g.length){order.push(t?g.shift():g.pop());t^=1;}}
 let picks=order.slice(0,n);while(picks.length<n)picks.push(order[picks.length%order.length]); // Rule 3: reuse models only if fewer models than rods
 // Rule 4: deepest runners closest to the boat, shallowest farthest back.
 const pos=POS.slice(0,n).map((p,i)=>({p,i})).sort((a,b)=>a.p[2]-b.p[2]);picks=[...picks].sort((a,b)=>b.d-a.d||b.z-a.z);
 const used=new Set(),rods=pos.map((q,j)=>{const x=picks[j];
  // Rule 5 (neutral, not a performance claim): first color in Nomad's list not yet used in this spread.
  const col=x.l.colors.find(c=>!used.has(c))||x.l.colors[j%x.l.colors.length];used.add(col);
  const why=[`Runs ${x.l.running_depth}, ${x.l.length}`,`troll range ${x.s[0]}–${x.s[1]} kn covers the ${lo}–${hi} kn common window`,
   x.sp?`Nomad's page names ${tag}`:`Nomad's page does not name ${tag} (filler: no species-named lure left at this speed)`,
   x.d>=30?'deep runner kept close to the boat':x.d<=5?'shallow runner set farther back':'mid-depth runner'];
  return {i:q.i,pos:q.p,l:x.l,col,why:why.join('; ')+'.',sp:x.sp}}).sort((a,b)=>a.i-b.i);
 return {lo,hi,rods}}
function boat(rods){const W=520,H=360,cx=W/2,ty=70,s=e=>({x:cx+e.pos[1]*220,y:ty+30+e.pos[2]*240});
 return `<svg class="boatsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Spread diagram behind the boat">
 <path d="M${cx},10 C${cx+30},30 ${cx+32},60 ${cx+30},${ty} L${cx-30},${ty} C${cx-32},60 ${cx-30},30 ${cx},10Z" fill="#0a2540"/>
 <line x1="${cx-30}" y1="50" x2="${cx-130}" y2="80" stroke="#6b7a8c" stroke-width="2"/><line x1="${cx+30}" y1="50" x2="${cx+130}" y2="80" stroke="#6b7a8c" stroke-width="2"/>
 ${rods.map((r,k)=>{const p=s(r),ax=Math.abs(r.pos[1])>.5?cx+Math.sign(r.pos[1])*130:cx+r.pos[1]*80,ay=Math.abs(r.pos[1])>.5?80:ty;
 return `<line x1="${ax}" y1="${ay}" x2="${p.x}" y2="${p.y}" stroke="#9fb0c2" stroke-dasharray="4 4"/><circle cx="${p.x}" cy="${p.y}" r="13" fill="#ff6a3d"/><text x="${p.x}" y="${p.y+4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${k+1}</text>`}).join('')}
 <text x="${cx}" y="${H-6}" text-anchor="middle" font-size="11" fill="#6b7a8c">Schematic only, not to scale</text></svg>`}
// Map regions: rough lon/lat boxes, equirectangular 720x360 (later entries drawn on top).
const RG=[['North Atlantic',[[-80,0,-5,65]]],['South Atlantic',[[-70,-60,20,0]]],['North Pacific',[[120,0,180,60],[-180,0,-100,60]]],
 ['South Pacific',[[140,-60,180,0],[-180,-60,-70,0]]],['Indian Ocean',[[20,-60,120,25]]],['Gulf of Mexico & Caribbean',[[-98,8,-60,31]]],
 ['Mediterranean',[[-6,30,36,46]]],['Coral & Tasman Seas',[[145,-45,175,-10]]],['Eastern Tropical Pacific',[[-120,-15,-77,20]]]];
const X=lon=>(lon+180)*2,Y=lat=>(90-lat)*2;let region=null;
$('#map').innerHTML=`<svg viewBox="0 20 720 300" class="worldsvg" role="group" aria-label="World map, click an ocean region">
 ${RG.map(([n,bs])=>`<g class="rg" data-r="${esc(n)}" tabindex="0" role="button" aria-label="${esc(n)}"><title>${esc(n)}</title>${bs.map(b=>`<rect x="${X(b[0])}" y="${Y(b[3])}" width="${X(b[2])-X(b[0])}" height="${Y(b[1])-Y(b[3])}"/>`).join('')}</g>`).join('')}
 <path d="${window.WORLD_LAND}" class="land"/></svg>`;
document.querySelectorAll('.rg').forEach(g=>{const pick=()=>{region=g.dataset.r;document.querySelectorAll('.rg').forEach(o=>o.classList.toggle('on',o===g));$('#region-name').textContent=region;run()};
 g.onclick=pick;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}}});
Object.keys(FISH).forEach(f=>$('#s-fish').insertAdjacentHTML('beforeend',`<option>${esc(f)}</option>`));
for(let i=1;i<=8;i++)$('#s-rods').insertAdjacentHTML('beforeend',`<option${i==4?' selected':''}>${i}</option>`);
const rigLine=l=>{const r=R[l.id]||{},bits=[`Hooks: ${l.hooks_rings||'Not listed by Nomad'}`];
 bits.push(r.split_rings?'Heavy-duty split rings (per Nomad)':'Split rings: Not listed by Nomad');bits.push('Leader: '+(r.leader?'see Nomad note':'Not listed by Nomad'));
 return esc(bits.join(' · '))+` · <a href="${esc(l.product_url)}" target="_blank" rel="noopener">source</a>`};
function run(){const fish=$('#s-fish').value,n=+$('#s-rods').value,o=build(fish,n);window.lastSpread=o;
 $('#spread-out').innerHTML=`<p class="eyebrow">Suggested starting spread, rule of thumb from Nomad specs, not Nomad advice</p>
 <h3 class="sp-h">${n} rod${n>1?'s':''} · ${esc(fish)} · ${esc(region||'No region selected')} · ${o.lo}–${o.hi} kn</h3>
 <p class="muted sp-note">${region?`Region: <b>${esc(region)}</b>. `:''}Region-specific tuning coming once catch data is added. The region does not change this spread.</p>
 <div class="sp-grid">${boat(o.rods)}<ol class="rods">${o.rods.map(r=>`<li><div class="rod-pos">${esc(r.pos[0])}</div>
 <button class="rod-lure" data-id="${r.l.id}">${esc(r.l.model)}</button> <span class="chip">${esc(r.col)}</span>
 <p class="muted">${esc(r.why)}</p><p class="rig">${rigLine(r.l)}</p></li>`).join('')}</ol></div>
 <p class="muted small">Colors: neutral rule (first color in Nomad's list not already used in this spread), not a claim about what works.</p>`;
 document.querySelectorAll('.rod-lure').forEach(b=>b.onclick=()=>window.openLure(b.dataset.id));}
$('#s-fish').onchange=$('#s-rods').onchange=run;window.buildSpread=build;run();})();
