'use client';
import {useEffect,useRef,useImperativeHandle,forwardRef} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {L,stations,section,widthAt,tops} from './geometry';
import {parts} from './build-data';
import flatPanels from './flat-panels.json';
import {closurePose} from './closure';
export type ViewerHandle={view:(name:string)=>void;focus:()=>void};
type Props={stage:number;selected:string|null;onSelect:(id:string|null)=>void;hidden:Set<string>;fade:boolean;isolate:boolean;explode:number;labels:boolean;solid:boolean;closure:number|null;onError:(message:string)=>void};
type Entry={id:string;group:T.Group;start:number;end?:number;staged?:boolean;top?:boolean;hull?:boolean;temp?:boolean};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{v=clamp(v);return v*v*(3-2*v)};
export const BoatViewer=forwardRef<ViewerHandle,Props>(function BoatViewer(props,ref){
 const host=useRef<HTMLDivElement>(null),live=useRef(props),api=useRef<ViewerHandle>({view:()=>{},focus:()=>{}});live.current=props;
 useImperativeHandle(ref,()=>({view:n=>api.current.view(n),focus:()=>api.current.focus()}),[]);
 useEffect(()=>{
  const el=host.current!;let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{live.current.onError('3D could not start. Enable hardware acceleration in your browser and reload. The stage guide and source drawings remain available.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x0c202b,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setSize(el.clientWidth,el.clientHeight);el.appendChild(renderer.domElement);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive Flint model. Drag to orbit, scroll to zoom, right-drag to pan. Arrow keys rotate; Home resets the view.');renderer.domElement.tabIndex=0;
  const scene=new T.Scene();const camera=new T.PerspectiveCamera(35,el.clientWidth/el.clientHeight,0.01,100);camera.position.set(-5.8,4.4,6.8);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0.08,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=1.2;controls.maxDistance=16;controls.maxPolarAngle=Math.PI-.08;
  scene.add(new T.HemisphereLight(0xe4f3ff,0x64777e,1.8));const sun=new T.DirectionalLight(0xffecd2,2.6);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:3,bottom:-3,near:.1,far:16});sun.shadow.normalBias=.008;sun.shadow.bias=-.0001;scene.add(sun);const fill=new T.DirectionalLight(0xc7e6f1,.8);fill.position.set(2,2,-4);scene.add(fill);
  const entries:Entry[]=[];const pickable:T.Mesh[]=[];const allMats:T.Material[]=[];
  const grid=new T.GridHelper(14,56,0x315461,0x233a44);grid.position.y=-.29;const gm=grid.material as T.Material;gm.transparent=true;gm.opacity=.38;scene.add(grid);
  const wood=new T.MeshStandardMaterial({color:0xd6a76e,roughness:.76,metalness:0,side:T.DoubleSide});
  const frameMat=new T.MeshStandardMaterial({color:0xefc990,roughness:.8,side:T.DoubleSide});
  const jointMat=new T.MeshStandardMaterial({color:0x54c6b9,roughness:.6,transparent:true,opacity:.78,side:T.DoubleSide});
  const metal=new T.MeshStandardMaterial({color:0xaac9d1,roughness:.27,metalness:.7});
  const tempMat=new T.MeshStandardMaterial({color:0xf3bf69,roughness:.6});
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#dcc49a';ctx.fillRect(0,0,256,256);
  for(let i=0;i<160;i++){const y=i*1.7;ctx.strokeStyle=`rgba(94,55,23,${.035+(i%5)*.012})`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(90,y+Math.sin(i)*4,170,y+Math.cos(i)*3,256,y+1);ctx.stroke();}
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,1);texture.colorSpace=T.SRGBColorSpace;wood.map=texture;frameMat.map=texture;
  function entry(id:string,start:number,extra:Partial<Entry>={}){const group=new T.Group();scene.add(group);const e={id,group,start,...extra};entries.push(e);return e;}
  function mesh(e:Entry,g:T.BufferGeometry,mat=wood,edges=true){const material=mat.clone();allMats.push(material);const o=new T.Mesh(g,material);o.castShadow=true;o.receiveShadow=true;o.userData.map=material.map;o.userData.part=e.id;o.userData.original=material.color.clone();o.userData.opacity=material.opacity;e.group.add(o);if(!e.temp)pickable.push(o);if(edges){const ln=new T.LineSegments(new T.EdgesGeometry(g,30),new T.LineBasicMaterial({color:0x725438,transparent:true,opacity:.55}));o.add(ln);}return o;}
  function beam(e:Entry,a:T.Vector3,b:T.Vector3,w:number,d:number,mat=frameMat){const o=mesh(e,new T.BoxGeometry(w,a.distanceTo(b),d),mat);o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return o;}
  const point=(x:number,y:number,z:number)=>new T.Vector3(x-L/2,y,z);
  function panelGeo(side:number,isSide:boolean){const pos:number[]=[],uv:number[]=[],ind:number[]=[];const n=100;for(let i=0;i<=n;i++){let x=L*i/n;const s=section(x);for(let j=0;j<=4;j++){const v=j/4;const y=isSide?T.MathUtils.lerp(s.ch,s.h,v):T.MathUtils.lerp(s.k,s.ch,v);const z=side*(isSide?T.MathUtils.lerp(s.c,s.w,v):s.c*v);const xx=x+(isSide?(1-v):1)*.16*Math.pow(1-x/L,10);pos.push(xx-L/2,y,z);uv.push(i/n,v);}}for(let i=0;i<n;i++)for(let j=0;j<4;j++){const a=i*5+j;ind.push(a,a+5,a+1,a+1,a+5,a+6);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;}
  const hulls:{e:Entry;o:T.Mesh;original:Float32Array;side:number;isSide:boolean}[]=[];
  for(const side of [-1,1])for(const isSide of [false,true]){const e=entry(`${isSide?'side':'bottom'}${side}`,1,{hull:true});const o=mesh(e,panelGeo(side,isSide),wood,false);hulls.push({e,o,original:(o.geometry.getAttribute('position').array as Float32Array).slice(),side,isSide});}
  function surfaceCurve(fn:(x:number)=>T.Vector3,a=0,b=L,n=100){return Array.from({length:n+1},(_,i)=>fn(a+(b-a)*i/n));}
  function tube(e:Entry,pts:T.Vector3[],r:number,mat=jointMat){return mesh(e,new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.max(12,pts.length),r,6,false),mat,false);}
  // Workbench blanks: four separate sheets, arranged as two long pairs.
  const sheets=entry('sheets',0,{end:1,temp:true});for(let a=0;a<2;a++)for(let b=0;b<2;b++){const o=mesh(sheets,new T.BoxGeometry(2.4,.006,1.2));o.position.set((a-.5)*2.4,-.13,(b-.5)*1.26);}
  const bulkheads:Entry[]=[];
  for(const [i,id] of ['1','1A','2','2A','3'].entries()){
   const s=stations[i+2],e=entry(`bhd${id}`,2,{staged:true});bulkheads.push(e);
   const sh=new T.Shape();sh.moveTo(-s.c,s.ch);sh.lineTo(0,s.k);sh.lineTo(s.c,s.ch);const sw=widthAt(s.x,s.seat);sh.lineTo(sw,s.seat);sh.lineTo(-sw,s.seat);sh.closePath();
   const hole=new T.Path();hole.absarc(0,s.k+.10,id==='1'?.06:.05,0,Math.PI*2,true);if(id!=='2')sh.holes.push(hole);
   const geom=new T.ExtrudeGeometry(sh,{depth:.006,bevelEnabled:false});geom.rotateY(Math.PI/2);geom.translate(s.x-L/2,0,0);mesh(e,geom);
   const forward=id==='1'||id==='2';const fx=s.x+(forward?-.016:.009);
   for(const side of [-1,1])beam(e,point(fx,s.ch,side*s.c),point(fx,s.h,side*s.w),.015,.034);
   beam(e,point(fx,s.seat-.016,-sw),point(fx,s.seat-.016,sw),.012,.032);
   // Additional cleat supporting the forward tank top on bulkhead 1.
   if(id==='1')beam(e,point(s.x-.016,.198,-widthAt(s.x,.214)),point(s.x-.016,.198,widthAt(s.x,.214)),.012,.032);
   if(['1A','2A','3'].includes(id)){const ring=mesh(e,new T.TorusGeometry(.056,.006,8,36),metal,false);ring.rotation.y=Math.PI/2;ring.position.copy(point(s.x+.008,s.k+.10,0));}
  }
  const ports=entry('ports',12);for(const i of [3,5,6]){const s=stations[i];const cap=mesh(ports,new T.CylinderGeometry(.049,.049,.006,32),metal,false);cap.rotation.z=Math.PI/2;cap.position.copy(point(s.x+.009,s.k+.10,0));}
  const transom=entry('transom',2,{staged:true});bulkheads.push(transom);const ts=stations.at(-1)!;
  const tsh=new T.Shape();tsh.moveTo(-ts.c,ts.ch);tsh.lineTo(0,ts.k);tsh.lineTo(ts.c,ts.ch);tsh.lineTo(ts.w,ts.h);tsh.lineTo(-ts.w,ts.h);tsh.closePath();
  const tg=new T.ExtrudeGeometry(tsh,{depth:.006,bevelEnabled:false});tg.rotateY(Math.PI/2);const tp=tg.getAttribute('position');for(let i=0;i<tp.count;i++)tp.setX(i,tp.getX(i)+L/2-(ts.h-tp.getY(i))*.21);tg.computeVertexNormals();mesh(transom,tg);
  for(const y of [ts.ch+.022,ts.h-.05]){const w=widthAt(L,y);beam(transom,point(L-.02-(ts.h-y)*.21,y,-w),point(L-.02-(ts.h-y)*.21,y,w),.019,y>.1?.095:.042);}
  const braces=entry('braces',4,{end:7,temp:true});for(const s of [stations[2],stations[4],stations[6]])beam(braces,point(s.x,s.h+.012,-s.w),point(s.x,s.h+.012,s.w),.022,.018,tempMat);
  const ties=entry('ties',3,{end:7,temp:true});for(let i=1;i<44;i++){const x=L*i/44,s=section(x);tube(ties,[point(x,s.k+.012,-.018),point(x+.006,s.k-.012,0),point(x,s.k+.012,.018)],.002,tempMat);}
  const sideTies=entry('side-ties',5,{end:7,temp:true});for(const side of [-1,1])for(let i=1;i<38;i++){const x=L*i/38,s=section(x);tube(sideTies,[point(x,s.ch-.012,side*(s.c-.012)),point(x+.005,s.ch+.012,side*(s.c+.012))],.002,tempMat);}
  const joints=entry('joints',7);tube(joints,surfaceCurve(x=>{const s=section(x);return point(x+.16*Math.pow(1-x/L,10),s.k+.003,0)}),.012);
  for(const side of [-1,1])tube(joints,surfaceCurve(x=>{const s=section(x);return point(x+.16*Math.pow(1-x/L,10),s.ch+.005,side*(s.c-.004))}),.012);
  for(const s of stations.slice(2,-1))tube(joints,[point(s.x,s.seat,-widthAt(s.x,s.seat)),point(s.x,s.ch,-s.c),point(s.x,s.k,0),point(s.x,s.ch,s.c),point(s.x,s.seat,widthAt(s.x,s.seat))],.009);
  tube(joints,[point(.16,.02,0),point(.08,.25,0),point(0,.56,0)],.018);
  tube(joints,[point(L-.035,ts.h,-ts.w),point(L-.06,ts.ch,-ts.c),point(L-.075,ts.k,0),point(L-.06,ts.ch,ts.c),point(L-.035,ts.h,ts.w)],.015);
  const outer=entry('outerglass',8);for(const side of [-1,0,1])tube(outer,surfaceCurve(x=>{const s=section(x);return point(x+.16*Math.pow(1-x/L,10),side?s.ch-.006:s.k-.006,side*s.c)}),.014);
  for(const side of [-1,1]){const e=entry(`rail${side}`,9);for(let layer=0;layer<2;layer++)tube(e,surfaceCurve(x=>{const s=section(x);return point(x,s.h,side*(s.w+.013+layer*.017))}),.012,frameMat);}
  const corners=entry('corners',10);
  function flatShape(e:Entry,coords:[number,number][],y:number,thickness:number){const sh=new T.Shape();coords.forEach(([x,z],i)=>i?sh.lineTo(x-L/2,-z):sh.moveTo(x-L/2,-z));sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:thickness,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,y,0);return mesh(e,g,frameMat);}
  flatShape(corners,[[.025,0],[.24,-section(.24).w],[.24,section(.24).w]],.50,.019);
  for(const side of [-1,1])flatShape(corners,[[L-.03,side*.49],[L-.20,side*.52],[L-.03,side*.34]],.232,.019);
  const backing=mesh(corners,new T.BoxGeometry(.06,.07,.06),frameMat);backing.position.copy(point(.14,.20,0));
  const supports=entry('supports',11,{top:true});
  for(const top of tops){
   const e=entry(top.id,11,{top:true});const coords:[number,number][]=[];for(let i=0;i<=28;i++){const x=top.a+(top.b-top.a)*i/28;coords.push([x,widthAt(x,top.y)]);}for(let i=28;i>=0;i--){const x=top.a+(top.b-top.a)*i/28;coords.push([x,-widthAt(x,top.y)]);}flatShape(e,coords,top.y,.006);
   // A thin exposed-edge stripe makes the plywood thickness readable. It is
   // a visual section cue, not a claim about the purchased plywood ply count.
   const edgePts=coords.map(([x,z])=>point(x,top.y+.003,z));edgePts.push(edgePts[0].clone());
   const edgeMat=frameMat.clone();edgeMat.color.set(0x79512d);edgeMat.map=null;
   tube(e,edgePts,.0008,edgeMat);edgeMat.dispose();
   for(const f of [.25,.75]){const z=(f-.5)*widthAt((top.a+top.b)/2,top.y)*2;
    // 38 mm wide across z, 16 mm deep vertically; top face touches plywood.
    const brace=mesh(supports,new T.BoxGeometry(top.b-top.a-.09,.016,.038),frameMat);
    brace.position.copy(point((top.a+top.b)/2,top.y-.008,z));brace.userData.topId=top.id;
   }
  }
  const skeg=entry('skeg',13);const sk=new T.Shape();const a=L-.844;sk.moveTo(a-L/2,section(a).k-.008);for(let i=1;i<=9;i++){const x=Math.min(L,a+i*.1);sk.lineTo(x-L/2,section(x).k-.008);}const depths=[.004,.015,.025,.037,.048,.061,.075,.088,.101];for(let i=8;i>=0;i--){const x=a+.844*i/8;sk.lineTo(x-L/2,section(x).k-.01-depths[i]);}sk.closePath();const sg=new T.ExtrudeGeometry(sk,{depth:.019,bevelEnabled:false});sg.translate(0,0,-.0095);mesh(skeg,sg,frameMat);
  const feet=entry('feet',13);for(const x of [2.034,3.186])for(const side of [-1,1]){const s=section(x);beam(feet,point(x,s.k+.025,side*.03),point(x+.15,s.ch+.024,side*(s.c-.04)),.019,.019);}
  const locks=entry('oarlocks',13);for(const x of [2.229,3.381])for(const side of [-1,1]){const s=section(x);const box=mesh(locks,new T.BoxGeometry(.07,.04,.016),metal);box.position.copy(point(x,s.h-.02,side*(s.w+.04)));const ring=mesh(locks,new T.TorusGeometry(.014,.005,8,20),metal,false);ring.rotation.x=Math.PI/2;ring.position.copy(point(x,s.h+.015,side*(s.w+.035)));}
  const centerGeom=new T.BufferGeometry().setFromPoints([point(0,.60,0),point(L,.30,0)]);const center=new T.Line(centerGeom,new T.LineDashedMaterial({color:0xf0bb6b,dashSize:.08,gapSize:.05,transparent:true,opacity:.65}));center.computeLineDistances();scene.add(center);
  const labelEls:{e:Entry;dom:HTMLButtonElement}[]=[];for(const e of entries.filter(e=>e.id.startsWith('bhd')||['transom','mainseat','skeg'].includes(e.id))){const b=document.createElement('button');b.className='model-label';b.textContent=parts.find(p=>p.id===e.id)?.name??e.id;b.onclick=()=>live.current.onSelect(e.id);el.appendChild(b);labelEls.push({e,dom:b});}
  const hit=new T.Raycaster(),mouse=new T.Vector2();let downX=0,downY=0;
  const down=(ev:PointerEvent)=>{downX=ev.clientX;downY=ev.clientY};
  const click=(ev:PointerEvent)=>{if(ev.button!==0||Math.hypot(ev.clientX-downX,ev.clientY-downY)>5)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);hit.setFromCamera(mouse,camera);const hits=hit.intersectObjects(pickable.filter(o=>o.parent?.visible&&(o.material as T.MeshStandardMaterial).opacity>.15),false);live.current.onSelect(hits[0]?.object.userData.part??null);};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',click);
  let camGoal:T.Vector3|null=null,targetGoal:T.Vector3|null=null;
  function setView(name:string){
   const detail:{[key:string]:[number[],number[]]}={compartment:[[1.7,.32,0],[.5,2.4,2.5]],underside:[[1.7,.63,0],[.35,.48,2.1]],access:[[1.32,.04,0],[-.2,.6,1.45]]};
   if(detail[name]){targetGoal=new T.Vector3(...detail[name][0] as [number,number,number]);camGoal=new T.Vector3(...detail[name][1] as [number,number,number]);return;}
   targetGoal=new T.Vector3(0,.05,0);camGoal=new T.Vector3(...(name==='top'?[0,7.8,.001]:name==='side'?[0,.35,8.8]:name==='bow'?[-7,.8,0]:name==='bottom'?[0,-7,1.5]:[-5.8,4.4,6.8]) as [number,number,number]);}
  api.current={view:setView,focus(){const e=entries.find(e=>e.id===live.current.selected&&e.group.visible);if(!e)return;const box=new T.Box3().setFromObject(e.group);targetGoal=box.getCenter(new T.Vector3());const size=box.getSize(new T.Vector3()).length();const dir=camera.position.clone().sub(controls.target).normalize();camGoal=targetGoal.clone().addScaledVector(dir,Math.max(.85,size*1.5));}};
  const keyboard=(ev:KeyboardEvent)=>{if(ev.key==='Home'){setView('iso');ev.preventDefault();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){const sph=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));sph.theta+=ev.key==='ArrowLeft'?.12:ev.key==='ArrowRight'?-.12:0;sph.phi+=ev.key==='ArrowUp'?-.12:ev.key==='ArrowDown'?.12:0;sph.phi=Math.max(.05,Math.min(Math.PI-.05,sph.phi));camera.position.copy(new T.Vector3().setFromSpherical(sph).add(controls.target));ev.preventDefault();}};
  renderer.domElement.addEventListener('keydown',keyboard);const cancelCam=()=>{camGoal=null;targetGoal=null};controls.addEventListener('start',cancelCam);
  const resize=new ResizeObserver(()=>{if(!el.clientWidth||!el.clientHeight)return;camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)});resize.observe(el);
  let lastHullStage=-1;let frame=0,current=live.current.stage,prevTime=performance.now(),disposed=false;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(time:number){if(disposed)return;const dt=Math.min(.1,(time-prevTime)/1000);prevTime=time;const pr=live.current;current=reduced||Math.abs(current-pr.stage)>1.05?pr.stage:T.MathUtils.damp(current,pr.stage,5,dt);if(Math.abs(current-pr.stage)<.005)current=pr.stage;
   grid.visible=camera.position.y>-.25;center.visible=pr.stage===6;
   for(const e of entries){
    const seen=current>=e.start-.98&&(e.end===undefined||current<e.end-.02);e.group.visible=seen&&!pr.hidden.has(e.id)&&(!pr.isolate||!pr.selected||e.id===pr.selected)&&(!e.temp||!pr.isolate);
    e.group.position.set(0,0,0);e.group.rotation.set(0,0,0);
    const arrival=ease(current-e.start+1);if(!e.hull&&!e.staged&&e.start>0&&!e.temp)e.group.position.y=(1-arrival)*.55;
    if(e.staged){const isA=e.id.includes('A'),s=parts.find(p=>p.id===e.id)?.position??L;const arrived=ease(current-(isA?5:3));const angle=-(1-arrived)*Math.PI/2;const pivot=s-L/2;e.group.rotation.z=angle;e.group.position.x=pivot*(1-Math.cos(angle));e.group.position.y=-pivot*Math.sin(angle)+(1-arrived)*.04;e.group.position.z=(1-arrived)*1.55;}
    if(e.top)e.group.position.y+=pr.closure===null?(1-ease(current-11))*.6:closurePose(pr.closure).lift;
    if(pr.closure!==null&&e.id==='ports'){e.group.position.y=0;e.group.visible=closurePose(pr.closure).coversVisible&&!pr.hidden.has(e.id)&&(!pr.isolate||!pr.selected||pr.selected===e.id);}
    if(pr.explode&&seen&&!e.temp){const s=e.id.endsWith('-1')?-1:1;if(e.hull)e.group.position.z+=s*pr.explode*.45;else if(e.id.startsWith('rail'))e.group.position.z+=s*pr.explode*.65;else if(e.top)e.group.position.y+=pr.explode*.65;else if(e.id==='skeg')e.group.position.y-=pr.explode*.45;else if(e.staged)e.group.position.y+=pr.explode*.3;}
    e.group.traverse(obj=>{if(!(obj instanceof T.Mesh))return;const mat=obj.material as T.MeshStandardMaterial;const selected=pr.selected===e.id;const deEmphasis=pr.selected&&!selected;mat.color.copy(pr.solid?new T.Color(0xc3d0d2):obj.userData.original);const desiredMap=pr.solid?null:obj.userData.map;if(mat.map!==desiredMap){mat.map=desiredMap;mat.needsUpdate=true;}obj.castShadow=!(pr.fade&&e.hull);mat.emissive.set(selected?0x267468:0);mat.emissiveIntensity=selected?.7:0;let opacity=obj.userData.opacity??1;if(pr.fade&&e.hull&&!selected)opacity=.16;else if(deEmphasis&&!e.temp)opacity*=.68;mat.opacity=opacity;mat.transparent=opacity<1;mat.depthWrite=opacity>.7;obj.castShadow=opacity>.7;obj.children.forEach(c=>{if(c instanceof T.LineSegments)(c.material as T.LineBasicMaterial).opacity=opacity*.55;});});
   }
   if(Math.abs(current-lastHullStage)>.0001)for(const h of hulls){const attr=h.o.geometry.getAttribute('position') as T.BufferAttribute;const fold=ease(current-(h.isSide?4:2));for(let i=0;i<attr.count;i++){const ox=h.original[i*3],oy=h.original[i*3+1],oz=h.original[i*3+2],v=(i%5)/4;const flat=flatPanels[h.isSide?'side':'bottom'][Math.floor(i/5)];const flatZ=h.side*((h.isSide?.85:.08)+T.MathUtils.lerp(flat[1],flat[2],v));const flatY=-.12;const aft=clamp((ox+L/2)/L);const lift=h.isSide?Math.sin(fold*Math.PI)*aft*.65:0;attr.setXYZ(i,T.MathUtils.lerp(flat[0],ox,fold),T.MathUtils.lerp(flatY,oy,fold)+lift,T.MathUtils.lerp(flatZ,oz,fold));}attr.needsUpdate=true;h.o.geometry.computeVertexNormals();h.o.geometry.computeBoundingSphere();h.o.geometry.computeBoundingBox();}
   lastHullStage=current;
   if(camGoal&&targetGoal){const factor=reduced?1:1-Math.exp(-dt*5);camera.position.lerp(camGoal,factor);controls.target.lerp(targetGoal,factor);if(camera.position.distanceTo(camGoal)<.005){camGoal=null;targetGoal=null;}}
   controls.update();scene.updateMatrixWorld();
   for(const {e,dom} of labelEls){dom.style.display=pr.labels&&e.group.visible?'block':'none';if(dom.style.display==='none')continue;const b=new T.Box3().setFromObject(e.group),v=b.getCenter(new T.Vector3());v.y=b.max.y+.04;v.project(camera);dom.style.left=`${(v.x*.5+.5)*el.clientWidth}px`;dom.style.top=`${(-v.y*.5+.5)*el.clientHeight}px`;dom.style.visibility=v.z<1?'visible':'hidden';}
   renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  }
  frame=requestAnimationFrame(animate);
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',click);renderer.domElement.removeEventListener('keydown',keyboard);scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments||o instanceof T.Line){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});texture.dispose();wood.dispose();frameMat.dispose();jointMat.dispose();metal.dispose();tempMat.dispose();renderer.dispose();renderer.domElement.remove();labelEls.forEach(x=>x.dom.remove());};
 },[]);
 return <div className="model-canvas" ref={host}/>;
});

