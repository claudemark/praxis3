const AI_BASE_URL = import.meta.env.VITE_MEDASSIST_AI_URL?.trim() ?? "";
const AI_API_KEY = import.meta.env.VITE_MEDASSIST_AI_KEY?.trim() ?? "";
const AI_SUMMARY_PATH =
  import.meta.env.VITE_MEDASSIST_AI_SUMMARY_PATH?.trim() ?? "/v1/medassist/summarize";

export const medAssistAiConfig = {
  baseUrl: AI_BASE_URL,
  apiKey: AI_API_KEY,
  summaryPath: AI_SUMMARY_PATH,
};

export const isMedAssistAiConfigured = Boolean(AI_BASE_URL && AI_API_KEY);

export class MedAssistAiNotConfiguredError extends Error {
  constructor() {
    super(
      "MedAssist AI service is not configured. Please set VITE_MEDASSIST_AI_URL and VITE_MEDASSIST_AI_KEY.",
    );
    this.name = "MedAssistAiNotConfiguredError";
  }
}

export class MedAssistAiRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "MedAssistAiRequestError";
    this.status = status;
  }
}

export interface MedAssistAiSummarySegment {
  id?: string;
  label: string;
  content: string;
  risk?: "unsicher" | "hinweis";
  suggestions?: string[];
}

export interface MedAssistAiSuggestion {
  id?: string;
  type: "icd" | "goa" | "hinweis";
  code?: string;
  title: string;
  confidence?: number;
  description?: string;
}

export interface MedAssistAiSummaryResult {
  transcript: string;
  durationSeconds?: number;
  segments: MedAssistAiSummarySegment[];
  suggestions?: MedAssistAiSuggestion[];
}

export interface SummarizeRecordingParams {
  audio: Blob;
  autoFormatting: boolean;
  locale?: string;
  prompt?: string;
  patientContext?: Record<string, unknown>;
}

export async function summarizeRecording(
  params: SummarizeRecordingParams,
): Promise<MedAssistAiSummaryResult> {
  if (!isMedAssistAiConfigured) {
    throw new MedAssistAiNotConfiguredError();
  }

  const endpoint = buildEndpointUrl(medAssistAiConfig.baseUrl, medAssistAiConfig.summaryPath);
  const formData = new FormData();
  formData.append("audio", params.audio, `medassist-recording-${Date.now()}.webm`);
  formData.append("auto_formatting", params.autoFormatting ? "true" : "false");
  if (params.locale) {
    formData.append("locale", params.locale);
  }
  if (params.prompt) {
    formData.append("prompt", params.prompt);
  }
  if (params.patientContext) {
    formData.append("patient_context", JSON.stringify(params.patientContext));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${medAssistAiConfig.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await readErrorBody(response);
    throw new MedAssistAiRequestError(
      `MedAssist AI request failed (${response.status}): ${detail}`,
      response.status,
    );
  }

  const payload = (await response.json()) as Partial<MedAssistAiSummaryResult> | null;
  if (!payload || !payload.transcript || !Array.isArray(payload.segments)) {
    throw new MedAssistAiRequestError("MedAssist AI response missing transcript or segments.");
  }

  return normalizeSummaryResult(payload);
}

function buildEndpointUrl(baseUrl: string, path: string) {
  try {
    return new URL(path, ensureTrailingSlash(baseUrl)).toString();
  } catch {
    return `${ensureTrailingSlash(baseUrl)}${path.replace(/^\//, "")}`;
  }
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

async function readErrorBody(response: Response) {
  try {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (typeof data === "string") {
        return data;
      }
      return JSON.stringify(data);
    }
    return await response.text();
  } catch {
    return "Unknown error";
  }
}

function normalizeSummaryResult(result: Partial<MedAssistAiSummaryResult>): MedAssistAiSummaryResult {
  const segments = (result.segments ?? [])
    .filter((segment): segment is MedAssistAiSummarySegment => Boolean(segment?.label && segment?.content))
    .map((segment) => ({
      id: segment.id,
      label: segment.label,
      content: segment.content,
      risk: segment.risk,
      suggestions: Array.isArray(segment.suggestions) ? segment.suggestions : undefined,
    }));

  const suggestions = Array.isArray(result.suggestions)
    ? result.suggestions
        .filter((suggestion): suggestion is MedAssistAiSuggestion => Boolean(suggestion?.title && suggestion?.type))
        .map((suggestion) => ({
          id: suggestion.id,
          type: suggestion.type,
          code: suggestion.code,
          title: suggestion.title,
          confidence: typeof suggestion.confidence === "number" ? clampConfidence(suggestion.confidence) : undefined,
          description: suggestion.description,
        }))
    : undefined;

  return {
    transcript: result.transcript ?? "",
    durationSeconds: typeof result.durationSeconds === "number" ? Math.max(result.durationSeconds, 0) : undefined,
    segments,
    suggestions,
  };
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) {
    return undefined;
  }
  return Math.min(1, Math.max(0, value));
}
