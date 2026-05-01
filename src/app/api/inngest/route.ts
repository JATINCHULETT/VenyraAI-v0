import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { auditProcess } from "@/inngest/functions";

export const runtime = "nodejs";

export const { GET, POST } = serve({
  client: inngest,
  functions: [auditProcess],
});
