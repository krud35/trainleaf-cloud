import Planner from './planner';
import {LanguageProvider} from './language';
export const dynamic='force-dynamic';
export default function Page(){return <LanguageProvider><Planner/></LanguageProvider>;}
