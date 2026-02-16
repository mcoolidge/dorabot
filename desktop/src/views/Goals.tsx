import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { useGateway } from '../hooks/useGateway';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Plus, X, Trash2, LayoutGrid, ChevronRight, Ban, User, Bot, Play, Loader2, Pencil, Save } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type GoalTask = {
  id: string;
  title: string;
  description?: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'done' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  source: 'agent' | 'user';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  result?: string;
  tags?: string[];
};

type GoalExecuteResponse = {
  started: true;
  goalId: string;
  sessionKey: string;
  sessionId: string;
  chatId: string;
};

type DetailEditForm = {
  title: string;
  description: string;
  status: GoalTask['status'];
  priority: GoalTask['priority'];
  tags: string;
  result: string;
};

type Props = {
  gateway: ReturnType<typeof useGateway>;
  onViewSession?: (sessionId: string, channel?: string, chatId?: string, chatType?: string) => void;
};

const COLUMNS: { id: GoalTask['status']; label: string; bg: string; hoverColor: string }[] = [
  { id: 'proposed', label: 'Proposed', bg: 'bg-amber-500/5', hoverColor: 'border-amber-500/40 bg-amber-500/10' },
  { id: 'approved', label: 'Approved', bg: 'bg-blue-500/5', hoverColor: 'border-blue-500/40 bg-blue-500/10' },
  { id: 'in_progress', label: 'In Progress', bg: 'bg-violet-500/5', hoverColor: 'border-violet-500/40 bg-violet-500/10' },
  { id: 'done', label: 'Done', bg: 'bg-emerald-500/5', hoverColor: 'border-emerald-500/40 bg-emerald-500/10' },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-muted text-muted-foreground',
  low: 'bg-muted text-muted-foreground',
};

function canStartExecution(status: GoalTask['status']): boolean {
  return status === 'approved' || status === 'in_progress';
}

function toDetailForm(task: GoalTask): DetailEditForm {
  return {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    tags: task.tags?.join(', ') || '',
    result: task.result || '',
  };
}

// ── Droppable Column ──

function KanbanColumn({
  id,
  label,
  tasks,
  onDelete,
  onView,
  onStart,
  isRunning,
  bg,
  hoverColor,
}: {
  id: string;
  label: string;
  tasks: GoalTask[];
  onDelete: (id: string) => void;
  onView: (task: GoalTask) => void;
  onStart: (task: GoalTask) => void;
  isRunning: (id: string) => boolean;
  bg: string;
  hoverColor: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-0 min-h-0 rounded-lg border border-border transition-colors',
        isOver ? hoverColor : bg,
      )}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border shrink-0">
        <span className="text-[11px] font-semibold truncate">{label}</span>
        <Badge variant="outline" className="text-[9px] h-4 ml-auto">{tasks.length}</Badge>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1.5">
          {tasks.length === 0 && (
            <div className="text-[10px] text-muted-foreground text-center py-6 opacity-50">
              drop here
            </div>
          )}
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onDelete={onDelete}
              onView={onView}
              onStart={onStart}
              isRunning={isRunning(task.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Draggable Card ──

function KanbanCard({
  task,
  onDelete,
  onView,
  onStart,
  isRunning,
  overlay,
}: {
  task: GoalTask;
  onDelete: (id: string) => void;
  onView?: (task: GoalTask) => void;
  onStart?: (task: GoalTask) => void;
  isRunning?: boolean;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const canStart = canStartExecution(task.status);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      onClick={e => {
        if (!onView) return;
        if ((e.target as HTMLElement).closest('[data-delete-trigger], [data-start-trigger]')) return;
        onView(task);
      }}
      className={cn(
        'group rounded-md border border-border bg-card p-2 text-xs transition-shadow cursor-grab active:cursor-grabbing overflow-hidden',
        isDragging && 'opacity-30',
        overlay && 'shadow-lg border-primary/50 rotate-2',
      )}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[11px] leading-tight break-words">{task.title}</div>
          {task.description && (
            <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{task.description}</div>
          )}
          {task.result && (
            <div className="text-[10px] text-muted-foreground mt-1 italic line-clamp-2">Result: {task.result}</div>
          )}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {task.priority !== 'medium' && (
              <Badge className={cn('text-[8px] h-3.5 px-1', PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </Badge>
            )}
            <Badge variant="outline" className="text-[8px] h-3.5 px-1">
              {task.source}
            </Badge>
            {isRunning && (
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 gap-0.5 text-primary border-primary/40">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />running
              </Badge>
            )}
            {task.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-[8px] h-3.5 px-1">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {!overlay && (
          <div className="flex items-start gap-1 shrink-0">
            {canStart && onStart && (
              <button
                data-start-trigger
                title="start execution"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => {
                  e.stopPropagation();
                  if (!isRunning) onStart(task);
                }}
                disabled={isRunning}
              >
                {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              </button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  data-delete-trigger
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onPointerDown={e => e.stopPropagation()}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={e => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm">delete "#{task.id} {task.title}"?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">this cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-7 text-xs">cancel</AlertDialogCancel>
                  <AlertDialogAction className="h-7 text-xs" onClick={() => onDelete(task.id)}>delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Goals View ──

export function GoalsView({ gateway, onViewSession }: Props) {
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [activeTask, setActiveTask] = useState<GoalTask | null>(null);
  const [viewTask, setViewTask] = useState<GoalTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailForm, setDetailForm] = useState<DetailEditForm>({
    title: '',
    description: '',
    status: 'proposed',
    priority: 'medium',
    tags: '',
    result: '',
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    tags: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const isGoalRunning = useCallback((goalId: string) => {
    return gateway.goalExecutions[goalId]?.status === 'started';
  }, [gateway.goalExecutions]);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899', '#f97316'],
      ticks: 120,
      gravity: 1.2,
      scalar: 0.8,
    });
  }, []);

  const loadTasks = useCallback(async () => {
    if (gateway.connectionState !== 'connected') return;
    try {
      const result = await gateway.rpc('goals.list');
      if (Array.isArray(result)) setTasks(result);
      setLoading(false);
    } catch (err) {
      console.error('failed to load goals:', err);
      setLoading(false);
    }
  }, [gateway.connectionState, gateway.rpc]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (gateway.goalsVersion > 0) loadTasks();
  }, [gateway.goalsVersion, loadTasks]);

  useEffect(() => {
    if (!viewTask) return;
    const latest = tasks.find(t => t.id === viewTask.id);
    if (!latest) {
      setViewTask(null);
      setDetailOpen(false);
      setDetailEditing(false);
      return;
    }
    if (latest.updatedAt !== viewTask.updatedAt) {
      setViewTask(latest);
      if (!detailEditing) setDetailForm(toDetailForm(latest));
    }
  }, [tasks, viewTask, detailEditing]);

  const addTask = async () => {
    try {
      await gateway.rpc('goals.add', {
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        source: 'user',
        tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });
      setNewTask({ title: '', description: '', priority: 'medium', tags: '' });
      setShowAddForm(false);
      setTimeout(loadTasks, 100);
    } catch (err) {
      console.error('failed to add goal:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await gateway.rpc('goals.delete', { id });
      setTimeout(loadTasks, 100);
    } catch (err) {
      console.error('failed to delete goal:', err);
    }
  };

  const startExecution = async (task: GoalTask) => {
    if (!canStartExecution(task.status)) return;
    if (isGoalRunning(task.id)) return;

    setTasks(prev => prev.map(t => (
      t.id === task.id && t.status === 'approved'
        ? { ...t, status: 'in_progress', updatedAt: new Date().toISOString() }
        : t
    )));

    try {
      const result = await gateway.rpc('goals.execute', { id: task.id }) as GoalExecuteResponse;
      const chatId = result?.chatId || `goal-${task.id}`;
      if (onViewSession && result?.sessionId) {
        onViewSession(result.sessionId, 'desktop', chatId, 'dm');
      }
      setTimeout(loadTasks, 100);
    } catch (err) {
      console.error('failed to start goal execution:', err);
      loadTasks();
    }
  };

  const saveDetailEdit = async () => {
    if (!viewTask) return;
    const title = detailForm.title.trim();
    if (!title) return;

    try {
      const tags = detailForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const updated = await gateway.rpc('goals.update', {
        id: viewTask.id,
        title,
        description: detailForm.description,
        status: detailForm.status,
        priority: detailForm.priority,
        result: detailForm.result,
        tags,
      }) as GoalTask;

      if (updated && typeof updated === 'object') {
        setViewTask(updated);
        setDetailForm(toDetailForm(updated));
      }
      setDetailEditing(false);
      setTimeout(loadTasks, 100);
    } catch (err) {
      console.error('failed to save goal edit:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as GoalTask['status'] } : t));
    if (newStatus === 'approved') fireConfetti();

    try {
      await gateway.rpc('goals.move', { id: taskId, status: newStatus });
      setTimeout(loadTasks, 100);
    } catch (err) {
      console.error('failed to move goal:', err);
      loadTasks();
    }
  };

  if (gateway.connectionState !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <LayoutGrid className="w-6 h-6 opacity-40" />
        <span className="text-sm">connecting...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          {COLUMNS.map(col => <Skeleton key={col.id} className="h-64 flex-1" />)}
        </div>
      </div>
    );
  }

  const tasksByStatus = (status: string) => tasks.filter(t => t.status === status);
  const rejectedTasks = tasksByStatus('rejected');

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
        <span className="font-semibold text-sm">Goals</span>
        <Badge variant="outline" className="text-[10px]">{tasks.filter(t => t.status !== 'rejected').length}</Badge>
        <Button
          variant={showAddForm ? 'outline' : 'default'}
          size="sm"
          className="ml-auto h-6 text-[11px] px-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <><X className="w-3 h-3 mr-1" />cancel</> : <><Plus className="w-3 h-3 mr-1" />new goal</>}
        </Button>
      </div>

      {showAddForm && (
        <div className="px-4 pt-3 shrink-0">
          <Card className="border-primary/50">
            <CardContent className="p-3 space-y-2">
              <div className="space-y-1">
                <Label className="text-[11px]">title</Label>
                <Input
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="what needs to be done?"
                  className="h-8 text-xs"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && newTask.title) addTask(); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="optional details"
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col @sm:flex-row @sm:items-center gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">priority</Label>
                  <div className="flex gap-1">
                    {(['high', 'medium', 'low'] as const).map(p => (
                      <Button
                        key={p}
                        variant={newTask.priority === p ? 'default' : 'outline'}
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-[11px]">tags</Label>
                  <Input
                    value={newTask.tags}
                    onChange={e => setNewTask({ ...newTask, tags: e.target.value })}
                    placeholder="comma separated"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={addTask} disabled={!newTask.title}>
                add goal
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 @xl:grid-cols-4 gap-3 p-4 flex-1 min-h-0 auto-rows-[1fr]">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              bg={col.bg}
              hoverColor={col.hoverColor}
              tasks={tasksByStatus(col.id)}
              onDelete={deleteTask}
              onStart={startExecution}
              isRunning={isGoalRunning}
              onView={t => {
                setViewTask(t);
                setDetailForm(toDetailForm(t));
                setDetailEditing(false);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} onDelete={() => {}} overlay />}
        </DragOverlay>
      </DndContext>

      {rejectedTasks.length > 0 && (
        <div className="shrink-0 border-t border-border">
          <button
            className="flex items-center gap-1.5 w-full px-4 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowRejected(!showRejected)}
          >
            <ChevronRight className={cn('w-3 h-3 transition-transform', showRejected && 'rotate-90')} />
            <Ban className="w-3 h-3" />
            <span>Rejected</span>
            <Badge variant="outline" className="text-[9px] h-4">{rejectedTasks.length}</Badge>
          </button>
          {showRejected && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {rejectedTasks.map(task => (
                <div key={task.id} className="group flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
                  <span className="line-through">#{task.id} {task.title}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm">delete "#{task.id} {task.title}"?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">this cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-7 text-xs">cancel</AlertDialogCancel>
                        <AlertDialogAction className="h-7 text-xs" onClick={() => deleteTask(task.id)}>delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) {
            setDetailEditing(false);
            setViewTask(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] !grid-rows-[auto_1fr_auto] overflow-hidden">
          {viewTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground font-normal">#{viewTask.id}</span>
                  {detailEditing ? detailForm.title || viewTask.title : viewTask.title}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <Badge variant="outline" className="text-[9px] h-4">{viewTask.status.replace('_', ' ')}</Badge>
                    {viewTask.priority !== 'medium' && (
                      <Badge className={cn('text-[8px] h-3.5 px-1', PRIORITY_COLORS[viewTask.priority])}>
                        {viewTask.priority}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] h-4 gap-0.5">
                      {viewTask.source === 'agent' ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                      {viewTask.source}
                    </Badge>
                    {isGoalRunning(viewTask.id) && (
                      <Badge variant="outline" className="text-[9px] h-4 gap-1 text-primary border-primary/40">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />running
                      </Badge>
                    )}
                    {viewTask.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[9px] h-4">{tag}</Badge>
                    ))}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="min-h-0">
                {!detailEditing ? (
                  <div className="space-y-3 pr-3">
                    {viewTask.description && (
                      <>
                        <Separator />
                        <div className="prose-chat text-xs">
                          <Markdown remarkPlugins={[remarkGfm]}>{viewTask.description}</Markdown>
                        </div>
                      </>
                    )}

                    {viewTask.result && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">result</div>
                          <div className="prose-chat text-xs">
                            <Markdown remarkPlugins={[remarkGfm]}>{viewTask.result}</Markdown>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="grid grid-cols-1 @xs:grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                      <div>created: {new Date(viewTask.createdAt).toLocaleString()}</div>
                      <div>updated: {new Date(viewTask.updatedAt).toLocaleString()}</div>
                      {viewTask.completedAt && <div className="col-span-2">completed: {new Date(viewTask.completedAt).toLocaleString()}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pr-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">title</Label>
                      <Input
                        value={detailForm.title}
                        onChange={e => setDetailForm(prev => ({ ...prev, title: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">description</Label>
                      <Textarea
                        rows={4}
                        value={detailForm.description}
                        onChange={e => setDetailForm(prev => ({ ...prev, description: e.target.value }))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">result</Label>
                      <Textarea
                        rows={3}
                        value={detailForm.result}
                        onChange={e => setDetailForm(prev => ({ ...prev, result: e.target.value }))}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">status</Label>
                      <div className="flex gap-1 flex-wrap">
                        {(['proposed', 'approved', 'in_progress', 'done', 'rejected'] as const).map(status => (
                          <Button
                            key={status}
                            variant={detailForm.status === status ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => setDetailForm(prev => ({ ...prev, status }))}
                          >
                            {status.replace('_', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">priority</Label>
                      <div className="flex gap-1">
                        {(['high', 'medium', 'low'] as const).map(priority => (
                          <Button
                            key={priority}
                            variant={detailForm.priority === priority ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => setDetailForm(prev => ({ ...prev, priority }))}
                          >
                            {priority}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">tags</Label>
                      <Input
                        value={detailForm.tags}
                        onChange={e => setDetailForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="comma separated"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </ScrollArea>

              <div className="flex justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => startExecution(viewTask)}
                    disabled={!canStartExecution(viewTask.status) || isGoalRunning(viewTask.id)}
                  >
                    {isGoalRunning(viewTask.id)
                      ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />running</>
                      : <><Play className="w-3 h-3 mr-1" />start execution</>}
                  </Button>
                  {!detailEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setDetailForm(toDetailForm(viewTask));
                        setDetailEditing(true);
                      }}
                    >
                      <Pencil className="w-3 h-3 mr-1" />edit
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDetailEditing(false)}>
                        cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={saveDetailEdit}
                        disabled={!detailForm.title.trim()}
                      >
                        <Save className="w-3 h-3 mr-1" />save
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => { deleteTask(viewTask.id); setDetailOpen(false); }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />delete
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDetailOpen(false)}>close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
