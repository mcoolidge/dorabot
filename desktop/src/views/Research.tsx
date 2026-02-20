import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { useGateway } from '../hooks/useGateway';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileSearch, ExternalLink, Tag, Clock, Trash2,
  ChevronRight, ChevronLeft, BookOpen, Loader2, Search,
  Plus, Pencil, Check, X,
} from 'lucide-react';

type ResearchItem = {
  id: string;
  topic: string;
  title: string;
  filePath: string;
  status: 'active' | 'completed' | 'archived';
  sources?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

type ResearchItemWithContent = ResearchItem & { content: string };

type Props = {
  gateway: ReturnType<typeof useGateway>;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; next: string }> = {
  active: { label: 'active', dot: 'bg-primary', badge: 'bg-primary/10 text-primary border-primary/20', next: 'completed' },
  completed: { label: 'completed', dot: 'bg-success', badge: 'bg-success/10 text-success border-success/20', next: 'archived' },
  archived: { label: 'archived', dot: 'bg-muted-foreground/40', badge: 'bg-muted/50 text-muted-foreground border-border', next: 'active' },
};

type FilterType = 'all' | 'active' | 'completed' | 'archived';

export function ResearchView({ gateway }: Props) {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ResearchItemWithContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);

  const loadItems = useCallback(async () => {
    if (gateway.connectionState !== 'connected') return;
    try {
      const result = await gateway.rpc('research.list') as ResearchItem[];
      setItems(result || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [gateway]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadItems(); }, [gateway.researchVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch content when selection changes
  useEffect(() => {
    if (!selectedId || gateway.connectionState !== 'connected') {
      setSelectedContent(null);
      return;
    }
    let cancelled = false;
    setContentLoading(true);
    gateway.rpc('research.read', { id: selectedId }).then((result: any) => {
      if (!cancelled) {
        setSelectedContent(result as ResearchItemWithContent);
        setContentLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setSelectedContent(null);
        setContentLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedId, gateway]);

  // re-fetch content when research updates
  useEffect(() => {
    if (!selectedId || gateway.connectionState !== 'connected') return;
    gateway.rpc('research.read', { id: selectedId }).then((result: any) => {
      setSelectedContent(result as ResearchItemWithContent);
    }).catch(() => {});
  }, [gateway.researchVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let result = filter === 'all' ? items : items.filter(i => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q)
        || i.topic.toLowerCase().includes(q)
        || i.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, filter, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ResearchItem[]>>((acc, item) => {
      const topic = item.topic || 'uncategorized';
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const filterCounts = useMemo(() => ({
    all: items.length,
    active: items.filter(i => i.status === 'active').length,
    completed: items.filter(i => i.status === 'completed').length,
    archived: items.filter(i => i.status === 'archived').length,
  }), [items]);

  const handleCreate = async () => {
    if (gateway.connectionState !== 'connected') return;
    try {
      const result = await gateway.rpc('research.add', {
        topic: 'uncategorized',
        title: 'Untitled',
        content: '',
      }) as ResearchItem;
      await loadItems();
      setSelectedId(result.id);
      setEditing(true);
    } catch {}
  };

  const handleDelete = async (itemId: string) => {
    await gateway.rpc('research.delete', { id: itemId });
    if (selectedId === itemId) {
      setSelectedId(null);
      setSelectedContent(null);
      setEditing(false);
    }
    await loadItems();
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    await gateway.rpc('research.update', { id: itemId, status });
    await loadItems();
  };

  const handleSave = async (itemId: string, updates: { title?: string; topic?: string; content?: string; tags?: string[] }) => {
    await gateway.rpc('research.update', { id: itemId, ...updates });
    // re-read the item to get updated data
    const result = await gateway.rpc('research.read', { id: itemId }) as ResearchItemWithContent;
    setSelectedContent(result);
    await loadItems();
    setEditing(false);
  };

  const handleBack = () => {
    setSelectedId(null);
    setSelectedContent(null);
    setEditing(false);
  };

  if (gateway.connectionState !== 'connected') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        not connected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        loading...
      </div>
    );
  }

  // detail view (drilled in)
  if (selectedId) {
    if (contentLoading || !selectedContent) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          loading...
        </div>
      );
    }
    return (
      <DetailView
        item={selectedContent}
        editing={editing}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onBack={handleBack}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onSave={handleSave}
      />
    );
  }

  // list view
  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl p-6 space-y-5">
        {/* header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Research</span>
          </div>
          <span className="text-[11px] text-muted-foreground">{items.length} items</span>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={handleCreate}>
              <Plus className="w-3 h-3" />
              new
            </Button>
          </div>
        </div>

        {/* search + filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="search research..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-secondary/50 border border-border rounded-md outline-none focus:border-primary/50 focus:bg-secondary/80 transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'completed', 'archived'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                  filter === f
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {f}
                {filterCounts[f] > 0 && (
                  <span className="ml-1 text-[10px] opacity-60">{filterCounts[f]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* empty state */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-4" />
            <div className="text-sm text-muted-foreground mb-1">no research yet</div>
            <div className="text-[11px] text-muted-foreground/60 max-w-xs mb-4">
              the agent collects research during scheduled pulses, or you can create your own
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCreate}>
              <Plus className="w-3.5 h-3.5" />
              create research
            </Button>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-6 w-6 text-muted-foreground/30 mb-3" />
            <div className="text-xs text-muted-foreground">no results for "{search || filter}"</div>
          </div>
        ) : (
          /* topic groups */
          <div className="space-y-4">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([topic, topicItems]) => (
              <TopicSection
                key={topic}
                topic={topic}
                items={topicItems}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

/* ---- Topic Section (collapsible group) ---- */

function TopicSection({ topic, items, onSelect }: {
  topic: string;
  items: ResearchItem[];
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-left group"
      >
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {topic.replace(/-/g, ' ')}
        </span>
        <span className="text-[10px] text-muted-foreground/50 ml-1">{items.length}</span>
      </button>

      {expanded && (
        <div className="border-t border-border/40">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors group ${
                i < items.length - 1 ? 'border-b border-border/20' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[item.status]?.dot || 'bg-muted-foreground/30'}`} />
              <span className="text-xs text-foreground group-hover:text-foreground truncate flex-1">{item.title}</span>
              {item.tags && item.tags.length > 0 && (
                <span className="text-[10px] text-muted-foreground/50 truncate max-w-24 hidden sm:inline">{item.tags[0]}</span>
              )}
              <span className="text-[10px] text-muted-foreground/40 shrink-0">
                {formatDate(item.updatedAt)}
              </span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Detail View (full page with edit mode) ---- */

function DetailView({ item, editing, onEdit, onCancelEdit, onBack, onDelete, onStatusChange, onSave }: {
  item: ResearchItemWithContent;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onBack: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onSave: (id: string, updates: { title?: string; topic?: string; content?: string; tags?: string[] }) => Promise<void>;
}) {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
  const [saving, setSaving] = useState(false);

  // edit state
  const [editTitle, setEditTitle] = useState(item.title);
  const [editTopic, setEditTopic] = useState(item.topic);
  const [editContent, setEditContent] = useState(item.content);
  const [editTags, setEditTags] = useState(item.tags?.join(', ') || '');
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // sync edit state when item changes (e.g., after save)
  useEffect(() => {
    setEditTitle(item.title);
    setEditTopic(item.topic);
    setEditContent(item.content);
    setEditTags(item.tags?.join(', ') || '');
  }, [item]);

  // focus title on edit mode
  useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
    await onSave(item.id, {
      title: editTitle || 'Untitled',
      topic: editTopic || 'uncategorized',
      content: editContent,
      tags: tags.length > 0 ? tags : undefined,
    });
    setSaving(false);
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditTopic(item.topic);
    setEditContent(item.content);
    setEditTags(item.tags?.join(', ') || '');
    onCancelEdit();
  };

  // auto-resize textarea
  const autoResize = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(200, el.scrollHeight) + 'px';
  }, []);

  useEffect(() => {
    if (editing) autoResize();
  }, [editing, editContent, autoResize]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* breadcrumb bar */}
      <div className="shrink-0 px-6 py-2 border-b border-border/60 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Research
        </button>
        <span className="text-muted-foreground/30">/</span>
        {editing ? (
          <input
            value={editTopic}
            onChange={e => setEditTopic(e.target.value)}
            className="text-[11px] text-muted-foreground bg-transparent border-b border-dashed border-muted-foreground/30 outline-none focus:border-primary/50 px-1 py-0.5 w-40"
            placeholder="topic"
          />
        ) : (
          <span className="text-[11px] text-muted-foreground truncate">{item.topic.replace(/-/g, ' ')}</span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 text-muted-foreground"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-3 h-3" />
                cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                save
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 text-muted-foreground"
              onClick={onEdit}
            >
              <Pencil className="w-3 h-3" />
              edit
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto max-w-3xl px-6 py-6">
          {/* title + meta */}
          <div className="mb-6">
            {editing ? (
              <input
                ref={titleRef}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-base font-semibold text-foreground bg-transparent border-b border-dashed border-muted-foreground/30 outline-none focus:border-primary/50 pb-1 mb-3"
                placeholder="Research title"
              />
            ) : (
              <h1 className="text-base font-semibold text-foreground leading-snug mb-3">{item.title}</h1>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onStatusChange(item.id, cfg.next)}
                className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors hover:opacity-80 cursor-pointer ${cfg.badge}`}
                title={`click to mark as ${cfg.next}`}
              >
                {cfg.label}
              </button>

              {!editing && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  {item.topic.replace(/-/g, ' ')}
                </span>
              )}

              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>

              {editing ? (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <input
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    className="text-[10px] bg-transparent border-b border-dashed border-muted-foreground/30 outline-none focus:border-primary/50 px-1 py-0.5 w-48"
                    placeholder="tags (comma separated)"
                  />
                </div>
              ) : (
                item.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">{tag}</Badge>
                ))
              )}

              <button
                onClick={() => onDelete(item.id)}
                className="ml-auto p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="delete research"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* divider */}
          <div className="border-t border-border/40 mb-6" />

          {/* content */}
          {editing ? (
            <textarea
              ref={contentRef}
              value={editContent}
              onChange={e => { setEditContent(e.target.value); autoResize(); }}
              className="w-full min-h-[200px] text-xs leading-relaxed bg-transparent border border-dashed border-border/40 rounded-md p-4 outline-none focus:border-primary/30 resize-none font-mono"
              placeholder="Write your research in markdown..."
            />
          ) : (
            <div className="prose-chat">
              <Markdown remarkPlugins={[remarkGfm]}>{item.content}</Markdown>
            </div>
          )}

          {/* sources */}
          {!editing && item.sources && item.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/40">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Sources ({item.sources.length})
              </h3>
              <div className="grid gap-2">
                {item.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-secondary/30 border border-border/30 hover:bg-secondary/60 hover:border-border/60 transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground truncate transition-colors">
                      {extractDomain(src)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* bottom padding */}
          <div className="h-12" />
        </div>
      </ScrollArea>
    </div>
  );
}

/* ---- Helpers ---- */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
