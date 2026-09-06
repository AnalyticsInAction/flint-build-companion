// Demonstration poses only: this is assembly order, not adhesive cure time.
export const closureSteps = [
 {label:'Inspect inside',at:0,view:'compartment',part:'bhd3',text:'The aft top is lifted for access. Review internal sealing and the bulkhead inspection opening before concealing them.'},
 {label:'Check underside',at:.30,view:'underside',part:'supports',text:'The 6 mm top and its underside stiffeners travel together. Their fitted lengths and spacing are representative. Plan p10; manual p15.'},
 {label:'Lower the top',at:.58,view:'compartment',part:'afttop',text:'Bring the fitted top onto its supporting edges. Fit and notch it on the actual hull; this animation illustrates placement.'},
 {label:'Review the closure',at:1,view:'access',part:'ports',text:'The top is seated. Inspect edge bonding and retain access through the bulkhead port. Resolve the source notes on joint reinforcement before building.'},
];
export function closurePose(progress:number){
 const p=Math.max(0,Math.min(1,progress));
 const t=Math.max(0,Math.min(1,(p-.40)/.48));
 const eased=t*t*(3-2*t);
 return {lift:.60*(1-eased),coversVisible:p>=.94,step:p<.25?0:p<.45?1:p<.94?2:3};
}
