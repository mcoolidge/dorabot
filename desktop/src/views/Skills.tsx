import { useState, useEffect, useCallback } from 'react';
import type { useGateway } from '../hooks/useGateway';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Plus, X, Trash2, Pencil, ChevronDown, ChevronRight, Sparkles, Save, ArrowLeft } from 'lucide-react';

type SkillInfo = {
  name: string;
  description: string;
  path: string;
  userInvocable: boolean;
  metadata: { requires?: { bins?: string[]; env?: string[] } };
  eligibility: { eligible: boolean; reasons: string[] };
  builtIn: boolean;
};

type SkillForm = {
  name: string;
  description: string;
  userInvocable: boolean;
  bins: string;
  env: string;
  content: string;
};

const emptyForm: SkillForm = {
  name: '',
  description: '',
  userInvocable: true,
  bins: '',
  env: '',
  content: '',
};

type Props = {
  gateway: ReturnType<typeof useGateway>;
};

export function SkillsView({ gateway }: Props) {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [form, setForm] = useState<SkillForm>(emptyForm);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSkills = useCallback(async () => {
    if (gateway.connectionState !== 'connected') return;
    try {
      const result = await gateway.rpc('skills.list');
      if (Array.isArray(result)) setSkills(result);
      setLoading(false);
    } catch (err) {
      console.error('failed to load skills:', err);
      setLoading(false);
    }
  }, [gateway.connectionState, gateway.rpc]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingName(null);
    setMode('create');
  };

  const openEdit = async (skill: SkillInfo) => {
    try {
      const result = await gateway.rpc('skills.read', { name: skill.name }) as { raw: string };
      // parse frontmatter to extract content body
      const raw = result.raw;
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      const body = fmMatch ? fmMatch[2].trim() : raw;

      setForm({
        name: skill.name,
        description: skill.description,
        userInvocable: skill.userInvocable,
        bins: skill.metadata.requires?.bins?.join(', ') || '',
        env: skill.metadata.requires?.env?.join(', ') || '',
        content: body,
      });
      setEditingName(skill.name);
      setMode('edit');
    } catch (err) {
      console.error('failed to read skill:', err);
    }
  };

  const saveSkill = async () => {
    setSaving(true);
    const bins = form.bins.split(',').map(s => s.trim()).filter(Boolean);
    const env = form.env.split(',').map(s => s.trim()).filter(Boolean);
    const metadata: Record<string, unknown> = {};
    if (bins.length || env.length) {
      metadata.requires = {} as Record<string, string[]>;
      if (bins.length) (metadata.requires as any).bins = bins;
      if (env.length) (metadata.requires as any).env = env;
    }

    try {
      await gateway.rpc('skills.create', {
        name: form.name,
        description: form.description,
        userInvocable: form.userInvocable,
        metadata: Object.keys(metadata).length ? metadata : undefined,
        content: form.content,
      });
      setMode('list');
      setForm(emptyForm);
      setEditingName(null);
      setTimeout(loadSkills, 100);
    } catch (err) {
      console.error('failed to save skill:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSkill = async (name: string) => {
    try {
      await gateway.rpc('skills.delete', { name });
      setTimeout(loadSkills, 100);
    } catch (err) {
      console.error('failed to delete skill:', err);
    }
  };

  const canSave = form.name && form.description && form.content;

  if (gateway.connectionState !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <Sparkles className="w-6 h-6 opacity-40" />
        <span className="text-sm">connecting...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // create / edit form
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
          <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={() => { setMode('list'); setForm(emptyForm); }}>
            <ArrowLeft className="w-3 h-3 mr-1" />back
          </Button>
          <span className="font-semibold text-sm">{mode === 'create' ? 'New Skill' : `Edit: ${editingName}`}</span>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-3 max-w-2xl">
            <div className="space-y-1">
              <Label className="text-[11px]">name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                placeholder="my-skill"
                className="h-8 text-xs font-mono"
                disabled={mode === 'edit'}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">description</Label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="what this skill teaches the agent to do"
                className="h-8 text-xs"
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-1 flex-1">
                <Label className="text-[11px]">required binaries</Label>
                <Input
                  value={form.bins}
                  onChange={e => setForm({ ...form, bins: e.target.value })}
                  placeholder="gh, curl, ffmpeg"
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">comma-separated, checked via `which`</span>
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-[11px]">required env vars</Label>
                <Input
                  value={form.env}
                  onChange={e => setForm({ ...form, env: e.target.value })}
                  placeholder="GITHUB_TOKEN, API_KEY"
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">comma-separated</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-[11px]">user-invocable</Label>
              <Button
                variant={form.userInvocable ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={() => setForm({ ...form, userInvocable: !form.userInvocable })}
              >
                {form.userInvocable ? 'yes' : 'no'}
              </Button>
              <span className="text-[10px] text-muted-foreground">can users trigger this skill directly?</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">content (markdown)</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder={"# My Skill\n\nInstructions for the agent...\n\n## Examples\n\n- do this\n- then that"}
                rows={20}
                className="text-xs font-mono leading-relaxed"
              />
              <span className="text-[10px] text-muted-foreground">
                markdown instructions the agent follows when this skill is matched
              </span>
            </div>

            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={saveSkill}
              disabled={!canSave || saving}
            >
              <Save className="w-3 h-3 mr-1" />
              {saving ? 'saving...' : mode === 'create' ? 'create skill' : 'save changes'}
            </Button>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // list mode
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
        <span className="font-semibold text-sm">Skills</span>
        <Badge variant="outline" className="text-[10px]">{skills.length}</Badge>
        <Button
          variant="default"
          size="sm"
          className="ml-auto h-6 text-[11px] px-2"
          onClick={openCreate}
        >
          <Plus className="w-3 h-3 mr-1" />new
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Sparkles className="w-6 h-6 opacity-40" />
              <span className="text-sm">no skills found</span>
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map(skill => {
                const isExpanded = expanded === skill.name;
                return (
                  <Collapsible key={skill.name} open={isExpanded} onOpenChange={open => setExpanded(open ? skill.name : null)}>
                    <Card className={cn('transition-colors', isExpanded && 'border-primary/50')}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold flex-1 text-left">{skill.name}</span>
                            {skill.builtIn && (
                              <Badge variant="outline" className="text-[9px] h-4">built-in</Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] h-4', skill.eligibility.eligible
                                ? 'bg-success/15 text-success border-success/30'
                                : 'bg-destructive/15 text-destructive border-destructive/30'
                              )}
                            >
                              {skill.eligibility.eligible ? 'ready' : 'unavailable'}
                            </Badge>
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <div className="text-[11px] text-muted-foreground text-left mt-1 line-clamp-1">{skill.description}</div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-0 border-t border-border mt-1">
                          {!skill.eligibility.eligible && skill.eligibility.reasons.length > 0 && (
                            <div className="text-[10px] text-destructive mt-2 space-y-0.5">
                              {skill.eligibility.reasons.map((r, i) => <div key={i}>{r}</div>)}
                            </div>
                          )}

                          {(skill.metadata.requires?.bins?.length || skill.metadata.requires?.env?.length) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-2">
                              {skill.metadata.requires?.bins?.map(b => (
                                <span key={b} className="font-mono bg-secondary rounded px-1">{b}</span>
                              ))}
                              {skill.metadata.requires?.env?.map(e => (
                                <span key={e} className="font-mono bg-secondary rounded px-1">${e}</span>
                              ))}
                            </div>
                          )}

                          <div className="text-[10px] text-muted-foreground mt-2 font-mono truncate">{skill.path}</div>

                          <div className="flex gap-1.5 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[11px] px-2"
                              onClick={(e) => { e.stopPropagation(); openEdit(skill); }}
                            >
                              <Pencil className="w-3 h-3 mr-1" />{skill.builtIn ? 'view' : 'edit'}
                            </Button>
                            {!skill.builtIn && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" className="h-6 text-[11px] px-2" onClick={e => e.stopPropagation()}>
                                    <Trash2 className="w-3 h-3 mr-1" />delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-sm">delete "{skill.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs">this will remove the skill from ~/.dorabot/skills/. this cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="h-7 text-xs">cancel</AlertDialogCancel>
                                    <AlertDialogAction className="h-7 text-xs" onClick={() => deleteSkill(skill.name)}>delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
