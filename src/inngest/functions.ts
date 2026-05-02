import { Buffer } from "node:buffer";
import path from "node:path";

import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { mdToPdf } from "md-to-pdf";
import { Resend } from "resend";

import { getSupabaseServerClient } from "@/lib/supabase";
import { inngest } from "./client";

const RAW_BUCKET = "compliance-raw-docs";
const FINAL_BUCKET = "compliance-final-reports";
const REPORT_LINK_EXPIRY_SECONDS = 60 * 60 * 24;

export const auditProcess = inngest.createFunction(
  { id: "audit-process" },
  { event: "audit.process" },
  async ({ event, step }) => {
    const { filePath, userEmail } = event.data;

    try {
      const supabase = getSupabaseServerClient();

      const extractedText = await step.run("extract-text", async () => {
        const { data, error } = await supabase.storage
          .from(RAW_BUCKET)
          .download(filePath);

        if (error || !data) {
          throw new Error(
            `Failed to download source PDF: ${error?.message || "No data"}`
          );
        }

        const arrayBuffer = await data.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);
        const parsed = await pdfParse(pdfBuffer);

        return parsed.text;
      });

      const markdownReport = await step.run("generate-markdown", async () => {
        const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
        if (!cerebrasApiKey) {
          throw new Error("Missing CEREBRAS_API_KEY.");
        }

        const openai = new OpenAI({
          apiKey: cerebrasApiKey,
          baseURL: "https://api.cerebras.ai/v1",
        });

        const systemPrompt = [
          "You are a strict SOC 2 auditor.",
          "Return a clean, well-formatted Markdown report with these sections:",
          "1) Executive Summary",
          "2) Critical Gaps",
          "3) Remediation Plan",
          "Be concise, factual, and do not include any preamble or extra sections.",
        ].join(" ");

        const completion = await openai.chat.completions.create({
          model: "llama3.1-70b",
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: extractedText },
          ],
        });

        const content = completion.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error("LLM returned empty content.");
        }

        return content;
      });

      const reportBuffer = await step.run("markdown-to-pdf", async () => {
        const result = await mdToPdf({ content: markdownReport });
        if (!result?.content) {
          throw new Error("Failed to generate PDF from Markdown.");
        }

        return result.content;
      });

      const reportFilePath = await step.run("upload-report", async () => {
        const baseName = path.posix.parse(filePath).name || "report";
        const timestamp = Date.now();
        const outputPath = `reports/${baseName}-${timestamp}.pdf`;

        const pdfBody = Buffer.isBuffer(reportBuffer)
          ? reportBuffer
          : Buffer.from(
              (reportBuffer as { data?: number[] }).data ?? [],
            );

        const { error } = await supabase.storage
          .from(FINAL_BUCKET)
          .upload(outputPath, pdfBody, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (error) {
          throw new Error(`Failed to upload report: ${error.message}`);
        }

        return outputPath;
      });

      const reportUrl = await step.run("create-report-url", async () => {
        const { data, error } = await supabase.storage
          .from(FINAL_BUCKET)
          .createSignedUrl(reportFilePath, REPORT_LINK_EXPIRY_SECONDS);

        if (error || !data?.signedUrl) {
          throw new Error(
            `Failed to create signed URL: ${error?.message || "No URL"}`
          );
        }

        return data.signedUrl;
      });

      await step.run("send-email", async () => {
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
      });

      return { ok: true, reportFilePath, reportUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { ok: false, error: message, filePath, userEmail };
    }
  }
);
