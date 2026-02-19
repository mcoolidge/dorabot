import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, FileText, Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Goal } from './helpers';

type Props = {
  tasks: Task[];
  goalsById: Map<string, Goal>;
  onApprove: (task: Task) => void;
  onDeny: (task: Task, reason?: string) => void;
  onViewPlan: (task: Task) => void;
  busy?: string | null;
};

export function ApprovalBanner({ tasks, goalsById, onApprove, onDeny, onViewPlan, busy }: Props) {
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [expanded, setExpanded] = useState(true);

  if (tasks.length === 0) return null;

  const handleDeny = (task: Task) => {
    if (denyingId === task.id) {
      onDeny(task, denyReason.trim() || undefined);
      setDenyingId(null);
      setDenyReason('');
    } else {
      setDenyingId(task.id);
      setDenyReason('');
    }
  };

  const handleApproveAll = () => {
    for (const task of tasks) onApprove(task);
  };

  const handleDenyAll = () => {
    for (const task of tasks) onDeny(task);
  };

  return (
    <div className="rounded-lg border border-border bg-card glass">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} needing approval
        </span>
        <ChevronDown className={cn(
          'h-3 w-3 text-muted-foreground/50 transition-transform',
          expanded && 'rotate-180',
        )} />
      </button>

      {expanded && (
        <>
          {tasks.length > 2 && (
            <div className="flex items-center gap-2 border-t border-border/50 px-4 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-emerald-500 hover:bg-emerald-500/10"
                onClick={handleApproveAll}
                disabled={!!busy}
              >
                <Check className="mr-1 h-3 w-3" />
                approve all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                onClick={handleDenyAll}
                disabled={!!busy}
              >
                <X className="mr-1 h-3 w-3" />
                deny all
              </Button>
            </div>
          )}

          <ScrollArea className={cn(tasks.length > 4 && 'max-h-[280px]')}>
            <div className="divide-y divide-border/50">
              {tasks.map(task => {
                const goal = task.goalId ? goalsById.get(task.goalId) : null;
                const isBusy = !!busy && (busy === `task:${task.id}:approve` || busy === `task:${task.id}:deny`);

                return (
                  <div key={task.id} className="px-4 py-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {goal && (
                          <div className="text-[10px] text-muted-foreground">{goal.title}</div>
                        )}
                        <div className="text-xs font-medium">{task.title}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-primary"
                          onClick={() => onViewPlan(task)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Plan
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isBusy}
                          onClick={() => handleDeny(task)}
                          title="Deny"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                          disabled={isBusy}
                          onClick={() => onApprove(task)}
                          title="Approve"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {denyingId === task.id && (
                      <div className="mt-2 flex items-end gap-2">
                        <Textarea
                          value={denyReason}
                          onChange={e => setDenyReason(e.target.value)}
                          placeholder="reason (optional)"
                          className="min-h-[50px] text-xs"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Escape') { setDenyingId(null); setDenyReason(''); }
                            if (e.key === 'Enter' && e.metaKey) { onDeny(task, denyReason.trim() || undefined); setDenyingId(null); setDenyReason(''); }
                          }}
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px]"
                            disabled={isBusy}
                            onClick={() => { onDeny(task, denyReason.trim() || undefined); setDenyingId(null); setDenyReason(''); }}
                          >
                            Send
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px]"
                            onClick={() => { setDenyingId(null); setDenyReason(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
