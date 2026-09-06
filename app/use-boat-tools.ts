'use client';
import {useEffect,useRef} from 'react';
import {parts,stages} from './build-data';
type Tool={name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function useBoatTools(state:{stage:number;selected:string|null;playing:boolean;hidden:string[]},actions:{go:(stage:number)=>void;select:(id:string)=>void}){
 const latest=useRef({state,actions});latest.current={state,actions};
 useEffect(()=>{
 const context=(document as unknown as {modelContext?:Context}).modelContext;if(!context?.registerTool)return;
 const controller=new AbortController();const settled=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 const tools:Tool[]=[
 {name:'get_flint_build_state',description:'Read the current illustrative construction stage, selection and playback state. This is not real workshop completion.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({...latest.current.state,stage:latest.current.state.stage+1,stageTitle:stages[latest.current.state.stage].title})},
 {name:'show_flint_build_stage',description:'Navigate to a numbered construction stage (1–15) and pause playback. Does not record work as completed.',inputSchema:{type:'object',properties:{stage:{type:'integer',minimum:1,maximum:15}},required:['stage'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{const n=(input as {stage?:unknown})?.stage;if(typeof n!=='number'||!Number.isInteger(n)||n<1||n>15)throw new Error('stage must be an integer from 1 to 15');latest.current.actions.go(n-1);await settled();return {stage:latest.current.state.stage+1,title:stages[latest.current.state.stage].title};}},
 {name:'select_flint_part',description:'Select a named component by its stable ID and show its details. Does not change geometry or mark construction complete.',inputSchema:{type:'object',properties:{id:{type:'string',enum:parts.map(p=>p.id)}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async input=>{const id=(input as {id?:unknown})?.id;const part=parts.find(p=>p.id===id);if(!part)throw new Error('Unknown component ID');latest.current.actions.select(part.id);await settled();return {id:part.id,name:part.name,selected:latest.current.state.selected};}},
 ];
 for(const tool of tools)try{Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{/* The app remains fully usable in browsers without WebMCP. */}
 return()=>controller.abort();
 },[]);
}
