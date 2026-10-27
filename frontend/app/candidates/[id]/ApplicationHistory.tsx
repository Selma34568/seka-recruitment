"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../../../lib/api";

type Event = {id:number; event_type:string; payload:Record<string,string>; actor_label:string|null; created_at:string};
export default function ApplicationHistory({candidateId, applicationId}:{candidateId:number;applicationId?:number}) {
 const [events,setEvents]=useState<Event[]>([]); const [filter,setFilter]=useState("");const [error,setError]=useState("");
 useEffect(()=>{const base=applicationId?`/demo/applications/${applicationId}/history`:`/demo/candidates/${candidateId}/history`;
 fetch(`${API_URL}${base}${filter?`?event_type=${filter}`:""}`,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("History unavailable");return r.json()}).then(d=>{setEvents(d.events??[]);setError("")}).catch(()=>setError("Historia niedostępna / History unavailable"));},[candidateId,applicationId,filter]);
 return <section className="mt-4 rounded-lg border p-4"><div className="flex justify-between gap-3"><h4 className="font-bold">Historia / History</h4><select aria-label="Filter event" className="border rounded p-1" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All</option>{["CANDIDATE_CREATED","APPLICATION_CREATED","STATUS_CHANGED","NOTES_UPDATED","CV_UPLOADED","EMAIL_DRAFTED"].map(x=><option key={x}>{x}</option>)}</select></div>{error&&<p className="text-red-600">{error}</p>}{events.map(e=><article key={e.id} className="border-b py-2 text-sm"><b>{e.event_type.replaceAll("_"," ")}</b> · {new Date(e.created_at).toLocaleString()}<p className="text-slate-600">{e.actor_label??"system"} · {Object.entries(e.payload??{}).map(([k,v])=>`${k}: ${v}`).join("; ")}</p></article>)}</section>;
}
