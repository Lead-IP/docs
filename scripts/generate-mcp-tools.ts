/**
 * Generates mcp-server/tools.mdx from the LeadLex MCP server.
 *
 * Source of truth for WHICH tools exist: services/mcp-server/tools.manifest.json
 * Source for the one-line summaries: the tool registration calls in
 * services/mcp-server/src/mcp/tools/*.ts (first sentence of each description).
 *
 * Usage:
 *   bun run scripts/generate-mcp-tools.ts [path/to/services/mcp-server]
 *
 * The path defaults to the app repo checkout next to this repo.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_SERVER_DIR =
  "/Users/winston/code/lead-ip/lovable-temp-old/services/mcp-server";
const serverDir = resolve(process.argv[2] ?? DEFAULT_SERVER_DIR);
const outFile = resolve(import.meta.dir, "..", "mcp-server", "tools.mdx");

type Group = { title: string; blurb?: string; match: (name: string) => boolean };

const named = (...names: string[]) => (n: string) => names.includes(n);

// Order matters: the first matching group wins.
const GROUPS: Group[] = [
  {
    title: "Capture",
    blurb: "One call that creates several linked records.",
    match: named("upsert_crm_bundle"),
  },
  {
    title: "Contacts",
    match: (n) =>
      /^(search|get|create|update|upsert)_contact$/.test(n) ||
      ["search_contacts", "bulk_create_contacts", "import_contacts_from_file", "get_import_job"].includes(n),
  },
  {
    title: "Companies",
    match: (n) => /^(search_companies|get_company|create_company|update_company)$/.test(n),
  },
  {
    title: "Deals",
    match: (n) => /^(search_deals|get_deal|create_deal|update_deal|move_deal_stage|list_pipelines)$/.test(n),
  },
  {
    title: "Tasks",
    match: named("search_tasks", "create_task", "update_task", "complete_task"),
  },
  {
    title: "Meetings and calendar",
    match: named("search_meetings", "create_meeting", "update_meeting", "find_free_slot"),
  },
  {
    title: "Notes",
    match: named("search_notes", "create_note", "update_note"),
  },
  {
    title: "Tags and lists",
    match: named(
      "list_tags",
      "add_contact_tags",
      "remove_contact_tags",
      "list_contact_lists",
      "create_contact_list",
      "update_contact_list",
      "delete_contact_list",
      "add_contacts_to_list",
      "remove_contacts_from_list",
    ),
  },
  {
    title: "Delete and archive",
    blurb: "These tools require an explicit confirmation flag in the call.",
    match: named("delete_task", "delete_note", "delete_meeting", "delete_deal", "delete_contact", "delete_company"),
  },
  {
    title: "Prospecting",
    match: named("find_prospects", "reveal_prospect_emails", "save_prospects"),
  },
  {
    title: "IP register lookups",
    match: named("get_ip_profile", "ip_moves"),
  },
  {
    title: "Email",
    match: named("search_emails", "get_email", "get_email_thread", "list_recent_emails", "draft_email_reply"),
  },
  {
    title: "Campaigns",
    match: named(
      "search_campaigns",
      "get_campaign",
      "create_campaign",
      "update_campaign",
      "delete_campaign",
      "add_contacts_to_campaign",
      "start_campaign",
      "pause_campaign",
      "unenroll_contact",
      "get_campaign_stats",
      "list_campaign_templates",
      "get_campaign_template",
      "list_sending_accounts",
      "set_campaign_sending_account",
    ),
  },
  {
    title: "Campaign steps and attachments",
    match: (n) =>
      /campaign_step|step_attachment|step_override|upload_url|uploaded_file/.test(n) ||
      n === "request_upload_url",
  },
  {
    title: "Events and conferences",
    match: (n) => /_event_|^create_event_follow_ups$/.test(n) || n.endsWith("_event_pipeline_summary"),
  },
  {
    title: "LinkedIn",
    blurb: "These tools act on the signed-in user's own LinkedIn account.",
    match: (n) => /linkedin/.test(n),
  },
  {
    title: "Reports",
    match: (n) => n.startsWith("report_") || n === "list_recent_activity",
  },
  {
    title: "Memory and Lexi",
    match: named("remember_fact", "recall_facts", "lexi_chat"),
  },
];

// Tools whose source refuses API-key auth ("requires user-scoped auth (OAuth)"
// or a missing-user guard). Verified in src/mcp/tools/{campaigns,campaignAccounts,lexi,linkedin}.ts.
const OAUTH_ONLY = new Set([
  "create_campaign",
  "list_sending_accounts",
  "set_campaign_sending_account",
  "lexi_chat",
  "linkedin_status",
  "request_linkedin_connection",
  "send_linkedin_message",
  "list_linkedin_conversations",
  "set_linkedin_do_not_contact",
  "set_linkedin_settings",
]);

// Descriptions in the source use template literals with constants, which the
// parser below cannot evaluate. These summaries restate the confirmed text.
const SUMMARY_OVERRIDES: Record<string, string> = {
  find_prospects:
    "Source new B2B prospects, people not yet in the workspace, using structured filters such as job titles, company domains, departments, seniorities and industries.",
  bulk_create_contacts:
    "Create many contacts in one call, with a per-row result. Existing contacts with the same email are updated instead of duplicated by default.",
  import_contacts_from_file:
    "Import a CSV or XLSX file of contacts. The file is parsed server-side, common column headers are mapped automatically, and the run is recorded as an import job.",
  reveal_prospect_emails:
    "Reveal verified email addresses for prospects returned by find_prospects. Spends one credit per email found, refunded when none exists. Use it only after you have confirmed who you want.",
};

function readManifest(): string[] {
  const raw = JSON.parse(readFileSync(join(serverDir, "tools.manifest.json"), "utf8")) as {
    tools: string[];
  };
  if (!Array.isArray(raw.tools)) throw new Error("tools.manifest.json has no tools array");
  return raw.tools;
}

/** Reads `"a" + "b" + ...` string literals starting at index i; returns the joined value. */
function readStringConcat(src: string, start: number): string | null {
  let i = start;
  let out = "";
  let found = false;
  for (;;) {
    while (/\s/.test(src[i] ?? "")) i++;
    const q = src[i];
    if (q !== '"' && q !== "'" && q !== "`") break;
    let j = i + 1;
    let lit = "";
    while (j < src.length && src[j] !== q) {
      if (src[j] === "\\") {
        const next = src[j + 1];
        lit += next === "n" ? " " : next === "t" ? " " : next;
        j += 2;
        continue;
      }
      if (q === "`" && src[j] === "$" && src[j + 1] === "{") return null;
      lit += src[j];
      j++;
    }
    out += lit;
    found = true;
    i = j + 1;
    while (/\s/.test(src[i] ?? "")) i++;
    if (src[i] === "+") {
      i++;
      continue;
    }
    break;
  }
  return found ? out : null;
}

function loadDescriptions(): Map<string, string> {
  const dir = join(serverDir, "src", "mcp", "tools");
  const map = new Map<string, string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const src = readFileSync(join(dir, file), "utf8");
    const re = /\.(?:tool|registerTool)\(\s*["']([a-z0-9_]+)["']\s*,/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const desc = readStringConcat(src, re.lastIndex);
      if (desc && !map.has(m[1]!)) map.set(m[1]!, desc);
    }
  }
  return map;
}

/** Cuts a long sentence at the last clause boundary before 200 characters. */
function clip(sentence: string): string {
  const head = sentence.slice(0, 200);
  const cut = Math.max(head.lastIndexOf(", "), head.lastIndexOf("; "), head.lastIndexOf(": "));
  return `${(cut > 60 ? head.slice(0, cut) : head.slice(0, head.lastIndexOf(" "))).trimEnd()}.`;
}

function summarise(desc: string | undefined): string {
  if (!desc) return "";
  const clean = desc.replace(/\s+/g, " ").trim();
  const firstSentence = clean.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? clean;
  const text = firstSentence.length > 200 ? clip(firstSentence) : firstSentence;
  return text
    .replace(/\b(ONE|NOT|ONLY|NEVER|DRAFT|SENDING|YOUR|OR|NEW)\b/g, (w) => w.toLowerCase())
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

function main() {
  const tools = [...readManifest()].sort();
  const descriptions = loadDescriptions();

  const assigned = new Map<string, string[]>();
  const ungrouped: string[] = [];
  for (const tool of tools) {
    const group = GROUPS.find((g) => g.match(tool));
    if (!group) {
      ungrouped.push(tool);
      continue;
    }
    assigned.set(group.title, [...(assigned.get(group.title) ?? []), tool]);
  }
  if (ungrouped.length > 0) {
    throw new Error(`Tools missing from GROUPS in generate-mcp-tools.ts: ${ungrouped.join(", ")}`);
  }

  const lines: string[] = [
    "---",
    'title: "Tools"',
    `description: "All ${tools.length} tools the LeadLex MCP server exposes, grouped by domain."`,
    "---",
    "",
    "{/* Generated by scripts/generate-mcp-tools.ts from tools.manifest.json. Do not edit by hand. */}",
    "",
    `The LeadLex MCP server exposes **${tools.length} tools**. Your AI assistant picks the right one from your request, so you rarely name a tool yourself. This page is the reference for what exists.`,
    "",
    "<Note>",
    "Tools marked **OAuth only** act on behalf of a signed-in user and refuse a workspace API key. Connect with OAuth to use them. See [Authentication](/mcp-server/authentication).",
    "</Note>",
    "",
  ];

  for (const group of GROUPS) {
    const names = assigned.get(group.title);
    if (!names) continue;
    lines.push(`## ${group.title}`, "");
    if (group.blurb) lines.push(group.blurb, "");
    lines.push("| Tool | What it does |", "| --- | --- |");
    for (const name of names) {
      const summary = summarise(SUMMARY_OVERRIDES[name] ?? descriptions.get(name));
      const badge = OAUTH_ONLY.has(name) ? " **OAuth only.**" : "";
      lines.push(`| \`${name}\` | ${summary}${badge} |`);
    }
    lines.push("");
  }

  writeFileSync(outFile, `${lines.join("\n")}`);
  const missing = tools.filter((t) => !descriptions.get(t) && !SUMMARY_OVERRIDES[t]);
  console.log(`Wrote ${outFile} with ${tools.length} tools.`);
  if (missing.length) console.log(`No description found for: ${missing.join(", ")}`);
}

main();
