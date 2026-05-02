import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";
import pdfParse from "pdf-parse";
import puppeteer from "puppeteer";
import { Resend } from "resend";

import { getSupabaseServerClient } from "@/lib/supabase";
import { ensureBucketExists } from "@/lib/supabase-buckets";
import { type PipelineStage, writePipelineStatus } from "@/lib/pipeline-status";

const RAW_BUCKET = "compliance-raw-docs";
const FINAL_BUCKET = "compliance-final-reports";
const REPORT_LINK_EXPIRY_SECONDS = 60 * 60 * 24;
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
};

type RunAuditResult = {
  ok: boolean;
  reportFilePath?: string;
  reportUrl?: string;
  error?: string;
};

export async function runAuditPipeline({
  filePath,
  userEmail,
  jobId,
}: RunAuditParams): Promise<RunAuditResult> {
  const resolvedJobId = jobId ?? randomUUID();
  const baseStatus = {
    jobId: resolvedJobId,
    filePath,
    email: userEmail,
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
    await ensureBucketExists(RAW_BUCKET);
    await ensureBucketExists(FINAL_BUCKET);

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
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY.");
    }

    const systemPrompt = [
      "You are a strict SOC 2 auditor.",
      "Return a clean, well-formatted Markdown report with these sections:",
      "1) Executive Summary",
      "2) Critical Gaps",
      "3) Remediation Plan",
      "Be concise, factual, and do not include any preamble or extra sections.",
    ].join(" ");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({
      model: geminiModel,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(extractedText);
    const content = result.response.text().trim();
    if (!content) {
      throw new Error("LLM returned empty content.");
    }

    await updateStatus("report", 76);
    const reportBuffer = await renderMarkdownToPdf(content);

    await updateStatus("upload", 88);
    const baseName = path.posix.parse(filePath).name || "report";
    const timestamp = Date.now();
    const reportFilePath = `reports/${baseName}-${timestamp}.pdf`;

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
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendApiKey || !resendFromEmail) {
      throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
    }

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFromEmail,
      to: userEmail,
      subject: "Your SOC 2 Gap Analysis Report",
      html: `
        <p>Your SOC 2 gap analysis report is ready.</p>
        <p><a href="${reportUrl}">Download the report</a></p>
      `,
    });

    await updateStatus("complete", 100, { reportFilePath, reportUrl });

    return { ok: true, reportFilePath, reportUrl };
  } catch (error) {
    console.error("Audit pipeline failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateStatus("error", 100, { error: message });
    return { ok: false, error: message };
  }
}
