import { useMemo, useState } from "react";
import { Copy, Edit2, Layers3, Plus, Search, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKiPromptStore } from "@/features/ki-prompts/store/ki-prompts-store";

export function KiPromptLibraryPage() {
  const { prompts, createPrompt, updatePrompt, deletePrompt } = useKiPromptStore();
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ id: string } | null>(null);

  const scopes = useMemo(() => {
    return Array.from(new Set(prompts.map((prompt) => prompt.scope)));
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return prompts.filter((prompt) => {
      const matchesScope = scopeFilter === "all" ? true : prompt.scope === scopeFilter;
      if (!matchesScope) return false;
      if (!term) return true;
      return (
        prompt.title.toLowerCase().includes(term) ||
        prompt.prompt.toLowerCase().includes(term) ||
        prompt.useCase.toLowerCase().includes(term)
      );
    });
  }, [prompts, query, scopeFilter]);

  const handleCopy = async (promptId: string, content: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      }
      setCopiedId(promptId);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error("copy prompt failed", error);
    }
  };

  const handleDeletePrompt = (promptId: string) => {
    if (!window.confirm("Prompt wirklich löschen?")) return;
    deletePrompt(promptId);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">KI Prompt Library</h1>
          <p className="text-sm text-muted-foreground">
            Kuratierte Prompts für Dokumentation, Kommunikation und Praxissteuerung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" className="rounded-full">Ready for AI MedAssist & Co.</Badge>
          <Button className="gap-2 rounded-full" size="sm" onClick={() => { setEditingPrompt(null); setShowPromptModal(true); }}>
            <Plus className="size-4" /> Neuer Prompt
          </Button>
        </div>
      </header>

      <Card className="border border-border/40 bg-white/85">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Prompts durchsuchen</CardTitle>
            <CardDescription>Filter nach Anwendungsbereich oder Stichwort.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-white/80 px-3 py-2">
              <Search className="size-4 text-muted-foreground/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-6 border-none bg-transparent text-sm outline-none"
                placeholder="Prompt oder Use Case suchen"
              />
            </div>
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-muted-foreground/70" />
              <select
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value)}
                className="rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
              >
                <option value="all">Alle Bereiche</option>
                {scopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredPrompts.length ? (
            filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="rounded-2xl border border-border/40 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground/90">{prompt.title}</p>
                    <p className="text-xs text-muted-foreground/70">{prompt.scope} • {prompt.useCase}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full"
                      onClick={() => handleCopy(prompt.id, prompt.prompt)}
                    >
                      <Copy className="size-4" /> {copiedId === prompt.id ? "Kopiert" : "In Zwischenablage"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setEditingPrompt({ id: prompt.id });
                        setShowPromptModal(true);
                      }}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-100/80 p-3 text-sm text-muted-foreground/90">
{prompt.prompt}
                </pre>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/40 bg-white/70 p-6 text-center text-sm text-muted-foreground">
              Keine Prompts gefunden – Filter anpassen oder Suchbegriff ändern.
            </div>
          )}
        </CardContent>
      </Card>

      {showPromptModal ? (
        <PromptModal
          promptId={editingPrompt?.id}
          onClose={() => setShowPromptModal(false)}
          onSubmit={(payload) => {
            if (editingPrompt?.id) {
              updatePrompt(editingPrompt.id, payload);
            } else {
              createPrompt(payload);
            }
            setShowPromptModal(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PromptModal({
  promptId,
  onClose,
  onSubmit,
}: {
  promptId?: string;
  onClose: () => void;
  onSubmit: (payload: { title: string; scope: string; prompt: string; useCase: string }) => void;
}) {
  const prompt = useKiPromptStore((state) => state.prompts.find((entry) => entry.id === promptId));
  const [form, setForm] = useState({
    title: prompt?.title ?? "",
    scope: prompt?.scope ?? "",
    useCase: prompt?.useCase ?? "",
    prompt: prompt?.prompt ?? "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.prompt.trim()) return;
    onSubmit({
      title: form.title.trim(),
      scope: form.scope.trim(),
      useCase: form.useCase.trim(),
      prompt: form.prompt.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-3xl border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>{prompt ? "Prompt bearbeiten" : "Neuer Prompt"}</CardTitle>
          <CardDescription>Scope, Use Case und Prompttext definieren.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Titel</label>
                <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Scope</label>
                <Input value={form.scope} onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Use Case</label>
              <Input value={form.useCase} onChange={(event) => setForm((prev) => ({ ...prev, useCase: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Prompt</label>
              <Textarea
                value={form.prompt}
                onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
                rows={8}
                placeholder="Strukturierten Prompt-Text erfassen"
                required
              />
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              {prompt ? "Änderungen speichern" : "Prompt anlegen"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
