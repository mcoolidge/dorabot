import { useState, useCallback, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PenSquare, Save, X, FileText } from 'lucide-react';
import type { Task } from './helpers';
import type { useGateway } from '../../hooks/useGateway';
import { toast } from 'sonner';

type Props = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway: ReturnType<typeof useGateway>;
  onSaved?: () => void;
};

export function PlanDialog({ task, open, onOpenChange, gateway, onSaved }: Props) {
  const [content, setContent] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPlan = useCallback(async (t: Task) => {
    setEditing(false);
    setLoading(true);
    try {
      const res = await gateway.rpc('tasks.plan.read', { id: t.id }) as { content?: string } | null;
      console.log('[PlanDialog] rpc result:', { taskId: t.id, resContent: res?.content?.substring(0, 100), taskPlan: t.plan?.substring(0, 100) });
      const c = res?.content || t.plan || '';
      setContent(c);
      setDraft(c);
    } catch (err) {
      console.log('[PlanDialog] rpc error:', err, 'fallback plan:', t.plan?.substring(0, 100));
      const fallback = t.plan || '';
      setContent(fallback);
      setDraft(fallback);
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  const savePlan = useCallback(async () => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await gateway.rpc('tasks.plan.write', { id: task.id, content: draft }) as { content?: string } | null;
      setContent(res?.content || draft);
      setDraft(res?.content || draft);
      setEditing(false);
      onSaved?.();
    } catch {
      toast.error('failed to save plan');
    } finally {
      setSaving(false);
    }
  }, [gateway, task, draft, onSaved]);

  useEffect(() => {
    if (open && task) void loadPlan(task);
  }, [open, task, loadPlan]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center justify-between border-b border-border px-6 py-4">
          <div>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {task?.title || 'Task Plan'}
            </DialogTitle>
          </div>
          {!editing ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)} disabled={loading}>
              <PenSquare className="mr-1.5 h-3 w-3" /> Edit
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button size="sm" className="h-7 text-xs" onClick={() => void savePlan()} disabled={saving}>
                {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
                Save
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditing(false); setDraft(content); }}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              loading plan...
            </div>
          ) : editing ? (
            <div className="h-full p-6">
              <Textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="h-full min-h-[60vh] font-mono text-sm"
                autoFocus
              />
            </div>
          ) : (
            <div className="markdown-viewer p-6 text-sm">
              <Markdown remarkPlugins={[remarkGfm]}>{content || '_no plan yet_'}</Markdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
