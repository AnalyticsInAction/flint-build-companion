import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {L,stations,section,widthAt,tops} from '../app/geometry.ts';
import {stages,parts,sourceUrl} from '../app/build-data.ts';
import {closureSteps,closurePose} from '../app/closure.ts';

test('closure preserves inspection access before seating the tops and showing covers',()=>{
 assert.equal(closurePose(0).lift,.6);
 assert.equal(closurePose(.3).lift,.6);
 assert.equal(closurePose(1).lift,0);
 let previous=.6;
 for(let i=0;i<=100;i++){const pose=closurePose(i/100);assert.ok(pose.lift<=previous&&pose.lift>=0);previous=pose.lift;if(pose.coversVisible)assert.equal(pose.lift,0);}
 assert.deepEqual(closurePose(-5),closurePose(0));assert.deepEqual(closurePose(5),closurePose(1));
 for(const [i,step] of closureSteps.entries()){assert.equal(closurePose(step.at).step,i);assert.ok(parts.some(p=>p.id===step.part));}
});

test('reconstructed cross-sections pass through every plan station',()=>{
 for(const s of stations)for(const key of ['w','c','k','h','ch'])assert.ok(Math.abs(section(s.x)[key]-s[key])<1e-9,`${s.x}: ${key}`);
 assert.equal(L,4.456);
 assert.deepEqual(parts.filter(p=>p.id.startsWith('bhd')).map(p=>p.position),[1.134,1.434,2.286,2.586,3.544]);
});
test('sampled hull stays finite, with ordered keel/chine/sheer and positive breadth',()=>{
 for(let i=0;i<=1000;i++){const s=section(L*i/1000);for(const value of Object.values(s))assert.ok(Number.isFinite(value));assert.ok(s.w>=s.c&&s.c>=0);assert.ok(s.h>s.ch&&s.ch>=s.k);assert.ok(s.w<.65);assert.ok(Math.abs(widthAt(s.x,s.h)-s.w)<1e-8);}
});
test('seat spans respect the bulkhead stations and fit inside the hull',()=>{
 for(const top of tops){assert.ok(top.b>top.a);for(let i=0;i<=10;i++){const x=top.a+(top.b-top.a)*i/10,s=section(x);assert.ok(widthAt(x,top.y)<=s.w+.000001);assert.ok(top.y>s.k);}}
 assert.equal(tops.find(t=>t.id==='mainseat').a,2.286);assert.equal(tops.find(t=>t.id==='mainseat').b,2.586);
});
test('all stage and component references resolve within the supplied PDFs',()=>{
 for(const item of [...stages,...parts]){assert.ok(item.sources.length);for(const source of item.sources){assert.ok(source.page>=1&&source.page<=(source.type==='plans'?23:22));if(!process.argv.includes('--public'))assert.ok(existsSync(`public/sources/${source.type}.pdf`));assert.match(sourceUrl(source),/^\/sources\/(plans|manual)\.pdf#page=\d+$/);}}
});
test('construction data distinguishes all five bulkheads and rowing-only scope',()=>{
 assert.equal(stages.length,15);assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);assert.equal(parts.filter(p=>p.id.startsWith('bhd')).length,5);
 for(const p of parts){assert.ok(p.stage>=0&&p.stage<15);assert.ok(p.material&&p.verified&&p.description);assert.doesNotMatch(p.name,/mast|sail|daggerboard|motor/i);}
 assert.match(stages[6].checks.join(' '),/centreline/);assert.match(stages[11].action,/Seal/);assert.match(stages[7].note,/conflicting/);
});
test('DXF-derived flat panel samples are finite and consistently ordered',()=>{
 const data=JSON.parse(readFileSync(new URL('../app/flat-panels.json',import.meta.url)));
 for(const key of ['bottom','side']){const points=data[key];assert.equal(points.length,101);for(let i=0;i<points.length;i++){const [x,lo,hi]=points[i];assert.ok([x,lo,hi].every(Number.isFinite));assert.ok(hi>=lo);if(i)assert.ok(x>points[i-1][0]);}assert.ok(points[100][0]-points[0][0]>4.3);}
});
