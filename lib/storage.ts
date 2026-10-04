import { env } from 'cloudflare:workers';
import { initialState } from './seed';
import type { State } from './domain';
import { StateError, logRecovery, recoverState, type QuarantineEntry } from './state-recovery';
export { StateError } from './state-recovery';
export type Snapshot = { state: State; revision: number; health: 'ok' | 'degraded'; quarantine: QuarantineEntry[]; blockedProfiles: string[] };
export function database(){if(!env.DB)throw Error('Baza danych jest chwilowo niedostępna.');return env.DB;}
export async function readStateRow(owner:string){const db=database();let row=await db.prepare('SELECT payload, revision FROM planner_state WHERE owner = ?').bind(owner).first<{payload:string;revision:number}>();if(!row){await db.prepare('INSERT OR IGNORE INTO planner_state (owner, payload, revision, updated_at) VALUES (?, ?, 0, ?)').bind(owner,JSON.stringify(initialState()),new Date().toISOString()).run();row=await db.prepare('SELECT payload, revision FROM planner_state WHERE owner = ?').bind(owner).first<{payload:string;revision:number}>();}if(!row)throw Error('Nie udało się odczytać danych');return row;}
/** Reads the coach document. Invalid records are quarantined in memory (health 'degraded'); an unrecoverable document throws StateError. */
export async function loadState(owner:string):Promise<Snapshot>{
 const row=await readStateRow(owner);
 let raw:unknown;
 try{raw=JSON.parse(row.payload)}catch{const issues=[{path:'',code:'invalid_json'}];logRecovery(row.revision,{health:'corrupt',issues});throw new StateError(issues,row.revision)}
 const recovery=await recoverState(raw);
 logRecovery(row.revision,recovery);
 if(recovery.health==='corrupt')throw new StateError(recovery.issues,row.revision);
 return recovery.health==='ok'?{state:recovery.state,revision:row.revision,health:'ok',quarantine:[],blockedProfiles:[]}:{state:recovery.state,revision:row.revision,health:'degraded',quarantine:recovery.entries,blockedProfiles:recovery.blockedProfiles};
}
