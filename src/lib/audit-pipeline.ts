import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";
import pdfParse from "pdf-parse";
import puppeteer from "puppeteer";
import {
  type ComplianceFramework,
  frameworkStorageSegment,
} from "@/lib/compliance-framework";
import { getSupabaseServerClient } from "@/lib/supabase";
import { ensureBucketExists } from "@/lib/supabase-buckets";
import { type PipelineStage, writePipelineStatus } from "@/lib/pipeline-status";

const RAW_BUCKET = "compliance-raw-docs";
const FINAL_BUCKET = "compliance-final-reports";
const REPORT_LINK_EXPIRY_SECONDS = 60 * 60 * 24;

const GEMINI_GENERATE_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Node/fetch connectivity to generativelanguage.googleapis.com (VPN, firewall, IPv6, flaky Wi‑Fi). */
function isTransientGeminiError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|socket|network|UND_ERR_/i.test(
    msg,
  );
}

function parseGeminiTimeoutMs(): number {
  const raw = process.env.GEMINI_REQUEST_TIMEOUT_MS?.trim();
  if (raw && /^\d+$/.test(raw)) {
    return Math.min(Math.max(parseInt(raw, 10), 30_000), 600_000);
  }
  return 180_000;
}

function augmentGeminiNetworkError(message: string): string {
  if (!/fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(message)) return message;
  return `${message} — Check outbound HTTPS to generativelanguage.googleapis.com (firewall, corporate proxy, VPN), verify GEMINI_API_KEY, and on Windows try: set NODE_OPTIONS=--dns-result-order=ipv4first. Optional: GEMINI_REQUEST_TIMEOUT_MS (ms, default 180000).`;
}

type GeminiModel = ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

async function geminiGenerateContentWithRetries(model: GeminiModel, text: string) {
  let last: unknown;
  for (let attempt = 0; attempt < GEMINI_GENERATE_ATTEMPTS; attempt++) {
    try {
      return await model.generateContent(text);
    } catch (e) {
      last = e;
      if (attempt === GEMINI_GENERATE_ATTEMPTS - 1 || !isTransientGeminiError(e)) {
        throw e;
      }
      await sleep(600 * (attempt + 1));
    }
  }
  throw last;
}
const MARKDOWN_BASE_CSS = `
  :root {
    color-scheme: light;
  }

  body {
    font-family: "Segoe UI", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    line-height: 1.6;
    font-size: 14px;
    padding: 32px 40px;
  }

  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4 {
    color: #0b1324;
    margin: 1.4em 0 0.6em;
    font-weight: 700;
  }

  .markdown-body h1 { font-size: 26px; }
  .markdown-body h2 { font-size: 20px; }
  .markdown-body h3 { font-size: 16px; }

  .markdown-body p {
    margin: 0 0 0.85em;
  }

  .markdown-body ul,
  .markdown-body ol {
    padding-left: 20px;
    margin: 0 0 1em;
  }

  .markdown-body pre {
    background: #0b1220;
    color: #e2e8f0;
    padding: 12px 14px;
    border-radius: 10px;
    overflow-x: auto;
    font-size: 12px;
  }

  .markdown-body code {
    font-family: "JetBrains Mono", "SF Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 12px;
  }

  .markdown-body pre code {
    background: transparent;
    padding: 0;
  }

  .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  }

  .markdown-body table th,
  .markdown-body table td {
    border: 1px solid #e2e8f0;
    padding: 8px 10px;
    text-align: left;
  }

  .markdown-body blockquote {
    border-left: 4px solid #cbd5f5;
    margin: 0 0 1em;
    padding: 8px 14px;
    color: #475569;
    background: #f8fafc;
    border-radius: 8px;
  }
`;

const renderMarkdownToPdf = async (markdown: string) => {
  const htmlBody = marked.parse(markdown, {
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false,
  }) as string;

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${MARKDOWN_BASE_CSS}</style>
      </head>
      <body>
        <article class="markdown-body">${htmlBody}</article>
      </body>
    </html>`;

  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "28mm",
        right: "24mm",
        bottom: "28mm",
        left: "22mm",
      },
    });
    await page.close();
    return buffer;
  } finally {
    await browser.close();
  }
};

type RunAuditParams = {
  filePath: string;
  userEmail: string;
  jobId?: string;
  ownerKey: string;
  framework: ComplianceFramework;
};

type RunAuditResult = {
  ok: boolean;
  reportFilePath?: string;
  reportUrl?: string;
  error?: string;
};

function systemPromptForFramework(framework: ComplianceFramework): string {
  if (framework === "dpdp") {
    return [
      "You are a senior privacy and data protection advisor focused on India's Digital Personal Data Protection Act, 2023 (DPDP).",
      "Assume the uploaded text may be policies, RoPA excerpts, DPIA drafts, vendor agreements, or notices.",
      "Return a clean, well-formatted Markdown report with these sections:",
      "1) Executive Summary (DPDP posture in plain language)",
      "2) Critical Gaps (mapped to DPDP themes: lawful processing, notice, consent, purpose limitation, data retention, security safeguards, data principal rights, children's data, cross-border transfers, Significant Data Fiduciary duties where relevant, grievance redressal)",
      "3) Remediation Plan (prioritized, actionable)",
      "Be concise, factual, and do not include any preamble or extra sections.",
    ].join(" ");
  }
  return [
    "You are a strict SOC 2 auditor.",
    "Return a clean, well-formatted Markdown report with these sections:",
    "1) Executive Summary",
    "2) Critical Gaps",
    "3) Remediation Plan",
    "Be concise, factual, and do not include any preamble or extra sections.",
  ].join(" ");
}

export async function runAuditPipeline({
  filePath,
  userEmail,
  jobId,
  ownerKey,
  framework,
}: RunAuditParams): Promise<RunAuditResult> {
  const resolvedJobId = jobId ?? randomUUID();
  const baseStatus = {
    jobId: resolvedJobId,
    ownerKey,
    filePath,
    email: userEmail,
    framework,
  };

  const updateStatus = async (
    stage: PipelineStage,
    progress: number,
    extra?: Partial<Parameters<typeof writePipelineStatus>[0]>
  ) => {
    try {
      await writePipelineStatus({
        ...baseStatus,
        stage,
        progress,
        updatedAt: new Date().toISOString(),
        ...extra,
      });
    } catch (statusError) {
      console.warn("Failed to update pipeline status", statusError);
    }
  };

  try {
    await updateStatus("scanning", 12);
    const supabase = getSupabaseServerClient();
    try {
      await ensureBucketExists(RAW_BUCKET);
      await ensureBucketExists(FINAL_BUCKET);
    } catch (e) {
      console.warn(
        "Pipeline: ensureBucketExists(raw/final) failed — continuing if buckets already exist",
        e,
      );
    }

    const { data, error } = await supabase.storage
      .from(RAW_BUCKET)
      .download(filePath);

    if (error || !data) {
      throw new Error(`Failed to download source PDF: ${error?.message || "No data"}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);

    await updateStatus("ocr", 32);
    const parsed = await pdfParse(sourceBuffer);
    const extractedText = parsed.text?.trim() ?? "";
    if (!extractedText) {
      throw new Error("OCR pipeline returned empty text.");
    }

    await updateStatus("llm", 58);
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY.");
    }

    const systemPrompt = systemPromptForFramework(framework);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const geminiModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
    const requestOptions = { timeout: parseGeminiTimeoutMs() };
    const model = genAI.getGenerativeModel(
      {
        model: geminiModel,
        systemInstruction: systemPrompt,
      },
      requestOptions,
    );

    const result = await geminiGenerateContentWithRetries(model, extractedText);
    const content = result.response.text().trim();
    if (!content) {
      throw new Error("LLM returned empty content.");
    }

    await updateStatus("report", 76);
    const reportBuffer = await renderMarkdownToPdf(content);

    await updateStatus("upload", 88);
    const baseName = path.posix.parse(filePath).name || "report";
    const timestamp = Date.now();
    const seg = frameworkStorageSegment(framework);
    const reportFilePath = `reports/${ownerKey}/${seg}/${baseName}-${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(FINAL_BUCKET)
      .upload(reportFilePath, reportBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(FINAL_BUCKET)
      .createSignedUrl(reportFilePath, REPORT_LINK_EXPIRY_SECONDS);

    if (signedError || !signed?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedError?.message || "No URL"}`);
    }

    const reportUrl = signed.signedUrl;

    await updateStatus("email", 94, { reportFilePath, reportUrl });

    await updateStatus("complete", 100, { reportFilePath, reportUrl });

    return { ok: true, reportFilePath, reportUrl };
  } catch (error) {
    console.error("Audit pipeline failed", error);
    let message = error instanceof Error ? error.message : "Unknown error";
    message = augmentGeminiNetworkError(message);
    await updateStatus("error", 100, { error: message });
    return { ok: false, error: message };
  }
}
