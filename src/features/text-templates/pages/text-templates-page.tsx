import { useMemo, useState } from "react";
import { Copy, Plus, Star, StarOff, Tag, Upload, X } from "lucide-react";

import {
  templateCategories,
  type TemplateStatus,
  type TemplateVariable,
  type TextTemplate,
} from "@/data/text-templates";
import { employees } from "@/data/employees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { useTextTemplateStore } from "@/features/text-templates/store/text-templates-store";

const statusMapping: Record<TemplateStatus, { label: string; className: string }> = {
  entwurf: { label: "Entwurf", className: "bg-warning/25 text-warning-foreground" },
  review: { label: "Review", className: "bg-secondary/15 text-secondary" },
  freigegeben: { label: "Freigegeben", className: "bg-success/15 text-success" },
};

export function TextTemplatesPage() {
  // Use Zustand store instead of local state
  const templates = useTextTemplateStore((state) => state.templates);
  const favorites = useTextTemplateStore((state) => state.favorites);
  const createTemplate = useTextTemplateStore((state) => state.createTemplate);
  const updateTemplate = useTextTemplateStore((state) => state.updateTemplate);
  const deleteTemplate = useTextTemplateStore((state) => state.deleteTemplate);
  const toggleFavorite = useTextTemplateStore((state) => state.toggleFavorite);
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TextTemplate | null>(templates[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = [
        template.title,
        template.subCategory,
        template.owner,
        template.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory = category === "all" ? true : template.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [templates, search, category]);

  const handleCopy = async (payload: string, id: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = payload;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const handleCreateTemplate = (template: TextTemplate) => {
    createTemplate(template);
    setSelectedTemplate(template);
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Intelligente Textbausteine</h1>
          <p className="text-sm text-muted-foreground">
            Vorlagen & KI-Prompts für eine effiziente Praxis-Kommunikation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <Upload className="size-4" /> Vorlage importieren
          </Button>
          <Button size="sm" className="gap-2 rounded-full" onClick={() => setShowCreateModal(true)}>
            <Plus className="size-4" /> Neue Vorlage
          </Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b border-border/50 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Suche nach Titel, Tag oder Verantwortlichem"
                className="flex-1"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <label htmlFor="category-filter" className="text-xs uppercase tracking-wide">
                  Kategorie
                </label>
                <select
                  id="category-filter"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                >
                  <option value="all">Alle</option>
                  {templateCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/40 p-0">
            {filteredTemplates.map((template) => {
              const status = statusMapping[template.status];
              const isFavorite = favorites.includes(template.id);
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "flex w-full flex-col gap-2 px-5 py-4 text-left transition",
                    "hover:bg-primary/5",
                    selectedTemplate?.id === template.id ? "bg-primary/10" : "bg-white/90",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
                        {template.subCategory}
                      </span>
                      <p className="text-sm font-semibold text-foreground/90">{template.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge size="sm" className={status.className}>
                        {status.label}
                      </Badge>
                      <Badge size="sm" variant="muted">
                        {template.usageCount} Nutzungen
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full border border-transparent"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(template.id);
                        }}
                      >
                        {isFavorite ? (
                          <Star className="size-4 text-amber-500" />
                        ) : (
                          <StarOff className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80">
                    <span>zuletzt aktualisiert {formatDate(template.updatedAt)}</span>
                    <span>Autor: {template.owner}</span>
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" /> {template.tags.join(", ")}
                    </span>
                  </div>
                </button>
              );
            })}
            {!filteredTemplates.length ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                Keine Vorlagen gefunden. Passen Sie die Filter an.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {selectedTemplate && (
          <TemplateDetail
            template={selectedTemplate}
            copied={copiedId === selectedTemplate.id}
            onCopy={(content) => handleCopy(content, selectedTemplate.id)}
          />
        )}
      </div>

      {showCreateModal ? (
        <TemplateCreationModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTemplate}
        />
      ) : null}
    </div>
  );
}

function TemplateDetail({
  template,
  onCopy,
  copied,
}: {
  template: TextTemplate;
  onCopy: (content: string) => void;
  copied: boolean;
}) {
  const status = statusMapping[template.status];

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <CardDescription>
              Kategorie {templateCategories.find((cat) => cat.id === template.category)?.label ?? "-"}
            </CardDescription>
          </div>
          <Badge size="sm" className={status.className}>
            {status.label}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>besitzt {template.usageCount} Nutzungen</span>
          <span>verantwortlich: {template.owner}</span>
          <span>aktualisiert: {formatDate(template.updatedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Variablen automatisch validiert</span>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => onCopy(template.content)}>
            <Copy className="size-4" /> {copied ? "Kopiert!" : "In Zwischenablage"}
          </Button>
        </div>
        <Textarea value={template.content} className="min-h-[220px] border border-primary/25 bg-white/95" readOnly />
        <Card className="border border-border/60 bg-surface-100/80 shadow-inner">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Verfügbare Platzhalter</CardTitle>
            <CardDescription>Greifen direkt auf Patienten- und Terminobjekte zu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {template.variables.map((variable) => (
              <div
                key={variable.key}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-white/90 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground/90">{"{{" + variable.key + "}}"}</p>
                  <p className="text-xs text-muted-foreground/80">{variable.label}</p>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                  Beispiel: {variable.sample}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function TemplateCreationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (template: TextTemplate) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(templateCategories[0]!.id);
  const [subCategory, setSubCategory] = useState("Allgemein");
  const [status, setStatus] = useState<TemplateStatus>("entwurf");
  const [owner, setOwner] = useState(employees[0]!.name);
  const [tags, setTags] = useState<string>("");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarSample, setNewVarSample] = useState("");

  const handleAddVariable = () => {
    if (!newVarKey.trim()) return;
    setVariables((prev) => [
      ...prev,
      { key: newVarKey.trim(), label: newVarLabel.trim() || newVarKey.trim(), sample: newVarSample.trim() || "" },
    ]);
    setNewVarKey("");
    setNewVarLabel("");
    setNewVarSample("");
  };

  const handleRemoveVariable = (key: string) => {
    setVariables((prev) => prev.filter((variable) => variable.key !== key));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const template: TextTemplate = {
      id: "TPL-" + Date.now(),
      title: title.trim(),
      category,
      subCategory: subCategory.trim() || "Allgemein",
      owner,
      status,
      usageCount: 0,
      updatedAt: new Date().toISOString(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      content,
      variables: variables.length
        ? variables
        : [{ key: "patient.name", label: "Patientenname", sample: "Max Mustermann" }],
    };
    onCreate(template);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur">
      <Card className="w-full max-w-3xl border border-border/50 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle>Neue Vorlage erstellen</CardTitle>
          <CardDescription>Definieren Sie Inhalt, Variablen und Freigabestatus.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Titel</label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Kategorie</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {templateCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Subkategorie</label>
                <Input value={subCategory} onChange={(event) => setSubCategory(event.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TemplateStatus)}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  <option value="entwurf">Entwurf</option>
                  <option value="review">Review</option>
                  <option value="freigegeben">Freigegeben</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Owner</label>
                <select
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.name}>
                      {employee.name} • {employee.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Tags (kommagetrennt)</label>
                <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Post-OP, Knie, Standard" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Inhalt</label>
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-[200px]" required />
            </div>
            <div className="rounded-xl border border-border/40 bg-surface-100/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground/85">Platzhalter</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={newVarKey}
                    onChange={(event) => setNewVarKey(event.target.value)}
                    placeholder="patient.name"
                    className="h-8 w-32"
                  />
                  <Input
                    value={newVarLabel}
                    onChange={(event) => setNewVarLabel(event.target.value)}
                    placeholder="Label"
                    className="h-8 w-32"
                  />
                  <Input
                    value={newVarSample}
                    onChange={(event) => setNewVarSample(event.target.value)}
                    placeholder="Beispiel"
                    className="h-8 w-32"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddVariable}>
                    Hinzufügen
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {variables.map((variable) => (
                  <span key={variable.key} className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-white/90 px-3 py-1">
                    {"{{" + variable.key + "}}"} • {variable.label}
                    <button type="button" aria-label="Remove" onClick={() => handleRemoveVariable(variable.key)}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2">
              <Plus className="size-4" /> Vorlage speichern
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
