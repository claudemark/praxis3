import { useMemo, useState } from "react";
import { ClipboardCopy, Edit2, Plus, Search, Star, Trash2 } from "lucide-react";

import type { GoACode, BillingChannel, CodeBundle } from "@/data/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, cn } from "@/lib/utils";
import { useBillingStore } from "@/features/billing/store/billing-store";

const sectionMeta: Record<
  BillingChannel,
  { title: string; description: string; accent: string; badge: string }
> = {
  privat: {
    title: "Privat nach GOÄ",
    description: "Hausinterne Favoriten, inklusive Standardkombinationen.",
    accent: "bg-emerald-50 text-emerald-900 border-emerald-100",
    badge: "Privat",
  },
  bg: {
    title: "BG / D-Arzt",
    description: "Unfälle, BG-Pauschalen & häufige Gutachtenziffern.",
    accent: "bg-amber-50 text-amber-900 border-amber-100",
    badge: "BG",
  },
  kv: {
    title: "KV / GKV",
    description: "Regelleistungen und Kontrolltermine im KV-Kontext.",
    accent: "bg-sky-50 text-sky-900 border-sky-100",
    badge: "KV",
  },
};

export function BillingPage() {
  const {
    codes,
    bundles,
    createCode,
    updateCode,
    deleteCode,
    toggleCodeFavorite,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleBundleFavorite,
  } = useBillingStore();

  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeChannel, setActiveChannel] = useState<BillingChannel>("privat");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedBundle, setCopiedBundle] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [editingCode, setEditingCode] = useState<GoACode | null>(null);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<CodeBundle | null>(null);

  const normalized = query.trim().toLowerCase();

  const sortedCodes = useMemo(
    () => [...codes].sort((a, b) => parseFrequency(b.haeufigkeit) - parseFrequency(a.haeufigkeit)),
    [codes],
  );

  const filteredCodes = useMemo(() => {
    if (!normalized) return sortedCodes;
    return sortedCodes.filter((code) =>
      (code.nummer + " " + code.bezeichnung + " " + code.kategorie + " " + code.region)
        .toLowerCase()
        .includes(normalized),
    );
  }, [sortedCodes, normalized]);

  const groupedCodes = useMemo(
    () =>
      filteredCodes.reduce<Record<BillingChannel, GoACode[]>>(
        (acc, code) => {
          acc[code.abrechnung].push(code);
          return acc;
        },
        { privat: [], bg: [], kv: [] },
      ),
    [filteredCodes],
  );

  const activeCodes = useMemo(() => {
    const list = groupedCodes[activeChannel];
    if (!favoritesOnly) return list;
    return list.filter((code) => code.favorite);
  }, [groupedCodes, activeChannel, favoritesOnly]);

  const codeLookup = useMemo(() => {
    const map = new Map<string, GoACode>();
    codes.forEach((code) => map.set(code.nummer, code));
    return map;
  }, [codes]);

  const activeBundles = useMemo(() => {
    const list = bundles.filter((bundle) => bundle.channel === activeChannel);
    if (!favoritesOnly) return list;
    return list.filter((bundle) => bundle.favorite);
  }, [bundles, activeChannel, favoritesOnly]);

  const hasCodeMatches = activeCodes.length > 0;

  const renderCodeCard = (code: GoACode) => (
    <div
      key={code.nummer}
      className="rounded-2xl border border-border/30 bg-white/95 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" size="sm">
              Nr. {code.nummer}
            </Badge>
            <Badge size="sm" variant="muted">
              {code.kategorie}
            </Badge>
            <Badge size="sm" variant="muted">
              {code.region}
            </Badge>
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", sectionMeta[code.abrechnung].accent)}>
              {sectionMeta[code.abrechnung].badge}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground/90">{code.bezeichnung}</p>
          <p className="text-xs text-muted-foreground/80">{code.beschreibung}</p>
          <p className="text-xs text-muted-foreground/60">
            Kompatibel mit: {code.kompatibelMit.length ? code.kompatibelMit.join(", ") : "Einzelleistung"}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-foreground/90">{formatCurrency(code.euro)}</p>
          <p className="text-xs text-muted-foreground/70">{code.punktzahl} Punkte</p>
          <p className="text-[11px] text-muted-foreground/70">Häufigkeit: {code.haeufigkeit}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground/80">
        <span>Dokumentationshilfe: {code.nummer} + {code.kompatibelMit.join(" / ") || "Einzelleistung"}</span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant={code.favorite ? "subtle" : "ghost"}
            size="sm"
            className={cn("gap-1", code.favorite && "text-amber-600")}
            onClick={() => toggleCodeFavorite(code.nummer)}
          >
            <Star
              className={cn(
                "size-3.5",
                code.favorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground/50",
              )}
            />
            Favorit
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => { setEditingCode(code); setShowCodeModal(true); }}>
            <Edit2 className="size-3.5" /> Bearbeiten
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => confirmAndDeleteCode(code.nummer)}
          >
            <Trash2 className="size-3.5" /> Löschen
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => handleCodeCopy(code)}>
            <ClipboardCopy className="size-4" /> {copiedCode === code.nummer ? "Kopiert" : "In Clipboard"}
          </Button>
        </div>
      </div>
    </div>
  );

  const handleCodeCopy = async (code: GoACode) => {
    const snippet = code.nummer;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      }
      setCopiedCode(code.nummer);
      window.setTimeout(() => setCopiedCode(null), 1500);
    } catch (error) {
      console.error("copy failed", error);
    }
  };

  const confirmAndDeleteCode = (nummer: string) => {
    if (window.confirm("Ziffer wirklich löschen?")) {
      deleteCode(nummer);
    }
  };

  const confirmAndDeleteBundle = (id: string) => {
    if (window.confirm("Kombination wirklich löschen?")) {
      deleteBundle(id);
    }
  };

  const handleBundleCopy = async (bundle: CodeBundle) => {
    const snippet = bundle.codes
      .map((nummer) => nummer.trim())
      .filter(Boolean)
      .join("-");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      }
      setCopiedBundle(bundle.id);
      window.setTimeout(() => setCopiedBundle(null), 1500);
    } catch (error) {
      console.error("copy failed", error);
    }
  };

  const renderBundleCard = (bundle: CodeBundle) => (
    <div
      key={bundle.id}
      className="rounded-2xl border border-border/40 bg-white/95 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground/90">{bundle.title}</p>
          <p className="text-xs text-muted-foreground/80">{bundle.beschreibung}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground/80">
            {bundle.codes.map((nummer) => (
              <span
                key={nummer}
                className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-surface-50 px-2 py-1"
              >
                <span className="font-semibold text-foreground/80">{nummer}</span>
                <span className="text-muted-foreground/70">
                  {codeLookup.get(nummer)?.bezeichnung ?? "Ziffer hinterlegen"}
                </span>
              </span>
            ))}
          </div>
        </div>
        <Badge variant="outline" className="rounded-full text-[11px]">
          {bundle.codes.length} Ziffern
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground/80">
        <span>Perfekt für Copy & Paste in PVS oder E-Mail.</span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant={bundle.favorite ? "subtle" : "ghost"}
            size="sm"
            className={cn("gap-1", bundle.favorite && "text-amber-600")}
            onClick={() => toggleBundleFavorite(bundle.id)}
          >
            <Star
              className={cn(
                "size-3.5",
                bundle.favorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground/50",
              )}
            />
            Favorit
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => { setEditingBundle(bundle); setShowBundleModal(true); }}>
            <Edit2 className="size-3.5" /> Bearbeiten
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => confirmAndDeleteBundle(bundle.id)}
          >
            <Trash2 className="size-3.5" /> Löschen
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => handleBundleCopy(bundle)}>
            <ClipboardCopy className="size-4" /> {copiedBundle === bundle.id ? "Kopiert" : "In Clipboard"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Abrechnungscenter</h1>
          <p className="text-sm text-muted-foreground">
            Häufige Ziffern pflegen, Kombinationen sichern und Favoriten steuerbar halten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted" className="rounded-full">PVS-Fehlerquote &lt; 1%</Badge>
          <Button className="gap-2 rounded-full" size="sm" onClick={() => { setEditingCode(null); setShowCodeModal(true); }}>
            <Plus className="size-4" /> Neue Ziffer
          </Button>
          <Button variant="outline" className="gap-2 rounded-full" size="sm" onClick={() => { setEditingBundle(null); setShowBundleModal(true); }}>
            <Plus className="size-4" /> Neue Kombination
          </Button>
        </div>
      </header>

      <Card className="border border-border/40 bg-white/85">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Intelligente Ziffern</CardTitle>
              <CardDescription>Drei Abrechnungspfade, Suchfunktion und Favoritenfilter.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-white/80 px-3 py-2">
                <Search className="size-4 text-muted-foreground/70" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-6 border-none bg-transparent text-sm outline-none"
                  placeholder="Ziffer, Leistung oder Region suchen"
                />
              </div>
              <Switch checked={favoritesOnly} onCheckedChange={setFavoritesOnly} label="Nur Favoriten" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {(["privat", "bg", "kv"] as BillingChannel[]).map((channel) => {
              const meta = sectionMeta[channel];
              const isActive = activeChannel === channel;
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setActiveChannel(channel)}
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition",
                    isActive
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border/40 bg-white/80 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground/70">
                    <span>{meta.badge}</span>
                    <span>{groupedCodes[channel].length} Ziffern</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground/90">{meta.title}</p>
                  <p className="text-xs text-muted-foreground/70">{meta.description}</p>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col rounded-2xl border border-border/30 bg-white/95">
            <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground/90">{sectionMeta[activeChannel].title}</p>
                <p className="text-xs text-muted-foreground/70">{sectionMeta[activeChannel].description}</p>
              </div>
              <Badge variant="outline" className="rounded-full text-[11px]">
                {activeCodes.length} Ziffer{activeCodes.length === 1 ? "" : "n"}
              </Badge>
            </div>
            <div className="flex-1 space-y-3 p-4">
              {hasCodeMatches ? (
                activeCodes.map((code) => renderCodeCard(code))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/40 bg-surface-100/70 p-6 text-center text-sm text-muted-foreground">
                  {favoritesOnly
                    ? "Keine Favoriten für diesen Pfad."
                    : "Keine Ziffern gefunden – Suche oder Kanal wechseln."}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Code-Kombinationen</CardTitle>
            <CardDescription>Vorkonfigurierte Bündel pro Pfad – einmal klicken, komplett kopieren.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => { setEditingBundle(null); setShowBundleModal(true); }}>
            <Plus className="size-4" /> Neue Kombination
          </Button>
        </CardHeader>
        <CardContent>
          {activeBundles.length ? (
            <div className="space-y-4">{activeBundles.map((bundle) => renderBundleCard(bundle))}</div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/40 bg-white/70 p-6 text-center text-sm text-muted-foreground">
              {favoritesOnly
                ? "Noch keine Favoriten-Kombination für diesen Pfad."
                : "Noch keine Kombination hinterlegt – einfach oben erstellen."}
            </div>
          )}
        </CardContent>
      </Card>

      {showCodeModal ? (
        <CodeModal
          initial={editingCode ?? undefined}
          onClose={() => setShowCodeModal(false)}
          onSubmit={(payload) => {
            if (editingCode) {
              updateCode(editingCode.nummer, payload);
            } else {
              createCode(payload);
            }
            setShowCodeModal(false);
          }}
        />
      ) : null}

      {showBundleModal ? (
        <BundleModal
          initial={editingBundle ?? undefined}
          onClose={() => setShowBundleModal(false)}
          onSubmit={(payload) => {
            if (editingBundle) {
              const { id: _removed, ...rest } = payload;
              void _removed;
              updateBundle(editingBundle.id, rest);
            } else {
              createBundle(payload);
            }
            setShowBundleModal(false);
          }}
        />
      ) : null}
    </div>
  );
}

function parseFrequency(label: string) {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function CodeModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: GoACode;
  onClose: () => void;
  onSubmit: (payload: GoACode) => void;
}) {
  const [form, setForm] = useState<GoACode>(
    initial ?? {
      nummer: "",
      bezeichnung: "",
      punktzahl: 0,
      euro: 0,
      region: "",
      kategorie: "",
      beschreibung: "",
      kompatibelMit: [],
      haeufigkeit: "",
      abrechnung: "privat",
      favorite: false,
    },
  );

  const updateField = (key: keyof GoACode, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.nummer.trim() || !form.bezeichnung.trim()) return;

    const payload: GoACode = {
      ...form,
      nummer: form.nummer.trim(),
      bezeichnung: form.bezeichnung.trim(),
      punktzahl: Number(form.punktzahl) || 0,
      euro: Number(form.euro) || 0,
      region: form.region.trim(),
      kategorie: form.kategorie.trim(),
      beschreibung: form.beschreibung.trim(),
      kompatibelMit: form.kompatibelMit,
      haeufigkeit: form.haeufigkeit.trim(),
      abrechnung: form.abrechnung,
      favorite: form.favorite ?? false,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-3xl border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>{initial ? "Ziffer bearbeiten" : "Neue Abrechnungsziffer"}</CardTitle>
          <CardDescription>Leistungsbeschreibung, Punktzahl und Kombinationen pflegen.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Nummer</label>
                <Input value={form.nummer} onChange={(event) => updateField("nummer", event.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Bezeichnung</label>
                <Input
                  value={form.bezeichnung}
                  onChange={(event) => updateField("bezeichnung", event.target.value)}
                  required
                  placeholder="Leistungstitel"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Region</label>
                <Input value={form.region} onChange={(event) => updateField("region", event.target.value)} placeholder="z. B. Knie" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Abrechnungspfad</label>
                <select
                  value={form.abrechnung}
                  onChange={(event) => updateField("abrechnung", event.target.value as BillingChannel)}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  <option value="privat">Privat nach GOÄ</option>
                  <option value="bg">BG / D-Arzt</option>
                  <option value="kv">KV / GKV</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Kategorie</label>
                <Input value={form.kategorie} onChange={(event) => updateField("kategorie", event.target.value)} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Punktzahl</label>
                <Input
                  type="number"
                  min="0"
                  value={form.punktzahl}
                  onChange={(event) => updateField("punktzahl", Number(event.target.value))}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Euro</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.euro}
                  onChange={(event) => updateField("euro", Number(event.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Beschreibung</label>
              <Textarea
                value={form.beschreibung}
                onChange={(event) => updateField("beschreibung", event.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Kompatible Ziffern (kommagetrennt)</label>
                <Input
                  value={form.kompatibelMit.join(", ")}
                  onChange={(event) =>
                    updateField(
                      "kompatibelMit",
                      event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Häufigkeit</label>
                <Input value={form.haeufigkeit} onChange={(event) => updateField("haeufigkeit", event.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Switch
                checked={Boolean(form.favorite)}
                onCheckedChange={(checked) => updateField("favorite", checked)}
                label="Als Favorit markieren"
              />
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              {initial ? "Änderungen speichern" : "Ziffer anlegen"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function BundleModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CodeBundle;
  onClose: () => void;
  onSubmit: (payload: Omit<CodeBundle, "id"> & { id?: string }) => void;
}) {
  const [form, setForm] = useState<Omit<CodeBundle, "id"> & { id?: string }>(
    initial
      ? { ...initial }
      : {
          id: undefined,
          title: "",
          beschreibung: "",
          codes: [],
          channel: "privat",
          favorite: false,
        },
  );
  const [codesInput, setCodesInput] = useState(initial ? initial.codes.join(", ") : "");

  const updateField = (key: keyof CodeBundle, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    const normalizedCodes = codesInput
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!normalizedCodes.length) return;

    onSubmit({
      id: initial?.id ?? form.id,
      title: form.title.trim(),
      beschreibung: form.beschreibung.trim(),
      codes: normalizedCodes,
      channel: form.channel,
      favorite: form.favorite ?? false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-2xl border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>{initial ? "Kombination bearbeiten" : "Neue Kombination"}</CardTitle>
          <CardDescription>Ziffernbündel mit Beschreibung und Favoritenstatus anlegen.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Titel</label>
                <Input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="z. B. PRP Standard"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Abrechnungspfad</label>
                <select
                  value={form.channel}
                  onChange={(event) => updateField("channel", event.target.value as BillingChannel)}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  <option value="privat">Privat nach GOÄ</option>
                  <option value="bg">BG / D-Arzt</option>
                  <option value="kv">KV / GKV</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Beschreibung</label>
              <Textarea
                value={form.beschreibung}
                onChange={(event) => updateField("beschreibung", event.target.value)}
                placeholder="Workflow oder Hinweis für die Nutzung"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Enthaltene Ziffern</label>
              <Textarea
                value={codesInput}
                onChange={(event) => setCodesInput(event.target.value)}
                placeholder="3306, 842, 302"
                rows={3}
              />
              <p className="mt-1 text-[11px] text-muted-foreground/70">Kommagetrennt oder je Zeile eine Ziffer.</p>
            </div>
            <div className="flex justify-end">
              <Switch
                checked={Boolean(form.favorite)}
                onCheckedChange={(checked) => updateField("favorite", checked)}
                label="Als Favorit markieren"
              />
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              {initial ? "Änderungen speichern" : "Kombination anlegen"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
