import { ArrowRight, BookOpen, CalendarDays, ChevronRight, ChartNoAxesCombined, Download, History, Settings2, Sun, Target, type LucideIcon } from 'lucide-react';
import { SHORTCUTS, type Profile, type ShortcutId } from '../../data/domain';
import './more.css';
import { useI18n } from '../../i18n';

export type MoreDestination = ShortcutId | 'settings' | 'customize';
type Tool = { id: ShortcutId; Icon: LucideIcon };
const tools: Tool[] = [
  { id: 'library', Icon: BookOpen },
  { id: 'templates', Icon: CalendarDays },
  { id: 'history', Icon: History },
  { id: 'wellness', Icon: Sun },
  { id: 'goals', Icon: Target },
  { id: 'periods', Icon: ChartNoAxesCombined },
  { id: 'backup', Icon: Download },
];
function ToolRow({ tool, compact, onNavigate }: { tool: Tool; compact?: boolean; onNavigate: (destination: MoreDestination) => void }) {
  const { Icon } = tool;
  const { t } = useI18n();
  const name = t(`shortcut.${tool.id}`);
  return <button type="button" className={`more-tool-row ${compact ? 'compact' : ''}`} aria-label={name} onClick={() => onNavigate(tool.id)}><span className="more-leaf-symbol" aria-hidden="true"><Icon size={22}/></span><span className="more-tool-copy"><strong>{name}</strong>{!compact && <small>{t(`more.desc_${tool.id}`)}</small>}</span><ChevronRight className="more-chevron" size={18} aria-hidden="true"/></button>;
}
export function MoreView({ profile, onNavigate }: { profile: Profile; onNavigate: (destination: MoreDestination) => void }) {
  const { t } = useI18n();
  const visible = profile.visibleShortcuts ?? [...SHORTCUTS];
  return <section className="more-hub"><div className="page-heading"><div><h1>{t('more.title')}</h1><p className="intro">{t('more.intro')}</p></div></div>
    <div className="more-section-heading"><h2>{t('more.shortcuts')}</h2><button type="button" className="text-button" aria-label={t('more.customize')} onClick={() => onNavigate('customize')}>{t('more.customize')} <ArrowRight size={18} aria-hidden="true"/></button></div>
    <div className="more-tools">{tools.filter(tool => visible.includes(tool.id)).map(tool => <ToolRow key={tool.id} tool={tool} onNavigate={onNavigate}/>)}{!visible.length && <p className="more-empty">{t('more.empty')}</p>}</div>
    <details className="more-all"><summary>{t('more.allTools')} <span>{tools.length}</span></summary><div>{tools.map(tool => <ToolRow key={tool.id} tool={tool} compact onNavigate={onNavigate}/>)}</div></details>
    <button type="button" className="more-tool-row more-settings" aria-label={t('more.profileSettings')} onClick={() => onNavigate('settings')}><span className="more-leaf-symbol" aria-hidden="true"><Settings2 size={22}/></span><span className="more-tool-copy"><strong>{t('more.settings')}</strong><small>{t('more.settingsHint')}</small></span><ArrowRight size={20} aria-hidden="true"/></button>
  </section>;
}
