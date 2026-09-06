// Coordinates are metres. x runs bow → stern, y is height above DWL, z is half-breadth.
// Sections transcribed from metric plan pp3,6–9. Bow/transom closures and interpolation are illustrative.
export const L=4.456;
export type Section={x:number;w:number;c:number;k:number;h:number;ch:number;seat:number};
export const stations:Section[]=[
{x:0,w:0,c:0,k:0.02,h:0.565,ch:0.21,seat:0.214},
{x:0.35,w:0.135,c:0.047,k:-0.023,h:0.493,ch:0.13,seat:0.214},
{x:1.134,w:0.384,c:0.261,k:-0.105,h:0.372,ch:0.07,seat:0.214},
{x:1.434,w:0.458,c:0.324,k:-0.122,h:0.336,ch:0.038,seat:0.128},
{x:2.286,w:0.583,c:0.461,k:-0.147,h:0.266,ch:-0.024,seat:0.08},
{x:2.586,w:0.601,c:0.484,k:-0.147,h:0.257,ch:-0.029,seat:0.08},
{x:3.544,w:0.599,c:0.488,k:-0.101,h:0.269,ch:0.002,seat:0.093},
{x:L,w:0.521,c:0.416,k:-0.095,h:0.255,ch:0.002,seat:0.093},
];
export function section(x:number):Section{
 const i=Math.max(0,Math.min(stations.length-2,stations.findIndex((q,j)=>j<stations.length-1&&x<=stations[j+1].x)));
 const a=stations[i],b=stations[i+1],t=Math.max(0,Math.min(1,(x-a.x)/(b.x-a.x)));
 const r={x} as Section;
 for(const key of ['w','c','k','h','ch','seat'] as const){
  const prev=stations[Math.max(0,i-1)],next=stations[Math.min(stations.length-1,i+2)];
  const m0=(b[key]-prev[key])/(b.x-prev.x)*(b.x-a.x),m1=(next[key]-a[key])/(next.x-a.x)*(b.x-a.x);
  r[key]=(2*t*t*t-3*t*t+1)*a[key]+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*b[key]+(t*t*t-t*t)*m1;
 }
 return r;
}
export function widthAt(x:number,y:number){const s=section(x);return s.c+(s.w-s.c)*Math.max(0,Math.min(1,(y-s.ch)/(s.h-s.ch)));}
export const tops=[{id:'foretop',a:0.035,b:1.134,y:0.214},{id:'foreseat',a:1.134,b:1.434,y:0.128},{id:'mainseat',a:2.286,b:2.586,y:0.08},{id:'afttop',a:3.544,b:4.435,y:0.093}];
