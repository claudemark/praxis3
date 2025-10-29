import type { GoaBreakdownLine, GoaBreakdownTemplateLine, IgelPriceListEntry } from "@/data/igel";

const DEFAULT_FACTOR = "2,3";
const MATERIAL_FACTOR = "—";
const FALLBACK_CODE = "analog";

const GOA_CODE_LABELS: Record<string, string> = {
  "1": "Ärztliche Beratung (kurz)",
  "3": "Ärztliche Beratung (eingehend)",
  "5": "Symptombezogene Untersuchung",
  "200": "Chirotherapie / Manualmedizin",
  "250": "Blutentnahme",
  "255": "Injektion subkutan / intramuskulär",
  "302": "Infiltration / Injektion (orthopädisch)",
  "3306": "Injektion intraartikulär",
  "493": "Physikalische Therapie",
  analog: "Individuelle Gesundheitsleistung",
};

const roundToCents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeFactor = (factor?: string | null) => {
  if (!factor) return DEFAULT_FACTOR;
  const trimmed = factor.trim();
  if (!trimmed.length) return DEFAULT_FACTOR;
  return trimmed.replace(".", ",");
};

const resolveTemplateLines = (template: GoaBreakdownTemplateLine[], quantity: number, totalAmount: number): GoaBreakdownLine[] => {
  if (!template.length) {
    return [];
  }
  const scaled = template.map((line) => ({
    step: line.step.trim() || GOA_CODE_LABELS[line.code] || GOA_CODE_LABELS[FALLBACK_CODE],
    code: line.code.trim() || FALLBACK_CODE,
    factor: line.kind === "material" ? MATERIAL_FACTOR : normalizeFactor(line.factor),
    unit: line.unit?.trim() ?? "",
    amount: roundToCents(line.amount * quantity),
    kind: line.kind ?? (line.code === "§10 GOÄ" ? "material" : "service"),
  }));

  const currentSum = scaled.reduce((sum, line) => sum + line.amount, 0);
  const delta = roundToCents(totalAmount - currentSum);
  if (Math.abs(delta) >= 0.01 && scaled.length) {
    const last = scaled[scaled.length - 1];
    scaled[scaled.length - 1] = {
      ...last,
      amount: roundToCents(Math.max(0, last.amount + delta)),
    };
  }
  return scaled.map(({ kind: _kind, ...rest }) => rest);
};

const buildDefaultBreakdown = (service: IgelPriceListEntry, quantity: number, totalAmount: number): GoaBreakdownLine[] => {
  const codes = service.goaCodes?.length ? service.goaCodes : [FALLBACK_CODE];
  const hasMaterials = Boolean(service.materials?.length);
  let available = totalAmount;
  let materialAmount = 0;

  if (hasMaterials) {
    const suggested = roundToCents(Math.min(totalAmount * 0.35, Math.max(0, 40 * quantity)));
    materialAmount = Math.min(suggested, roundToCents(available * 0.6));
    available = roundToCents(Math.max(0, available - materialAmount));
  }

  const lines: GoaBreakdownLine[] = [];
  let remaining = available;

  codes.forEach((code, index) => {
    const isLast = index === codes.length - 1;
    const divisor = codes.length - index;
    const share = isLast ? remaining : roundToCents(remaining / divisor);
    remaining = roundToCents(Math.max(0, remaining - share));
    const normalizedCode = code.trim() || FALLBACK_CODE;
    lines.push({
      step: GOA_CODE_LABELS[normalizedCode] ?? GOA_CODE_LABELS[FALLBACK_CODE],
      code: normalizedCode,
      factor: DEFAULT_FACTOR,
      amount: share,
      unit: "1x",
    });
  });

  if (materialAmount > 0) {
    lines.push({
      step: "Materialkosten (§10 GOÄ)",
      code: "§10 GOÄ",
      factor: MATERIAL_FACTOR,
      amount: materialAmount,
      unit: "Pauschal",
    });
  }

  const sum = lines.reduce((acc, entry) => acc + entry.amount, 0);
  const diff = roundToCents(totalAmount - sum);
  if (Math.abs(diff) >= 0.01 && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = {
      ...last,
      amount: roundToCents(Math.max(0, last.amount + diff)),
    };
  }

  return lines;
};

export function computeGoaBreakdown(service: IgelPriceListEntry | null, quantity: number): GoaBreakdownLine[] {
  if (!service) {
    return [];
  }
  const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.max(1, Math.round(quantity)) : 1;
  const totalAmount = roundToCents(service.price * normalizedQuantity);
  if (totalAmount <= 0) {
    return [];
  }
  if (service.goaBreakdown?.length) {
    return resolveTemplateLines(service.goaBreakdown, normalizedQuantity, totalAmount);
  }
  return buildDefaultBreakdown(service, normalizedQuantity, totalAmount);
}
