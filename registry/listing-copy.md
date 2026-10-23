# LeadLex MCP: listing copy (draft, not submitted)

Facts used below come from the MCP server code and the docs in this repo. Items in [NEEDS: ...] must be filled before submitting.

## Shared facts

- Name: LeadLex
- Endpoint: `https://mcp.leadlex.com/mcp` (streamable HTTP, remote, nothing to install)
- Auth: OAuth 2.1 with dynamic client registration, or `X-API-Key: wbk_...`
- Scale: 99 tools, 5 resources, 6 prompts (tool count from `tools.manifest.json`)
- Docs: https://docs.leadlex.com/mcp-server/overview
- Website: https://www.leadlex.com/developers/mcp [NEEDS: confirm this page is live]
- Support: support@leadlex.com
- Category: CRM, productivity, legal, sales
- Privacy policy: https://www.leadlex.com/privacy
- Terms: https://www.leadlex.com/terms
- Logo: use `logo/dark.svg` for light backgrounds, `logo/light.svg` for dark backgrounds

## Short description (under 100 characters)

CRM for European law firms: contacts, matters, tasks, email and prospecting through MCP.

## Medium description (about 300 characters)

LeadLex is a CRM built for law firms and IP practices. This remote MCP server lets Claude, ChatGPT or Cursor search contacts, create deals, log meetings and notes, draft campaigns, read synced email and look up patent register activity, all inside your own LeadLex workspace. Sign in with OAuth or a workspace API key.

## Long description

LeadLex is a CRM built for law firms and IP practices. The LeadLex MCP server connects your AI assistant to your workspace.

What you can do:

- Capture a meeting in one request: company, contact, meeting, note, deal and follow-up task are created and linked together.
- Search and update contacts, companies, deals, tasks, meetings and notes.
- Import contacts from pasted rows or a CSV or XLSX file.
- Source new prospects, then reveal emails and save them as contacts once you confirm who you want.
- Draft email campaigns and manage their steps. Sending needs your explicit instruction and a workspace setting.
- Read synced email and run pipeline, activity and response-time reports.
- Look up patent portfolio activity for companies linked to the IP register.

Every call runs inside the workspace of the account that signed in. Delete tools require an explicit confirmation flag.

Setup guides for Claude, ChatGPT, Cursor and other clients: https://docs.leadlex.com/mcp-server/overview

## Example prompts

1. "Just met with Alex Tan at Banana Legal, trademark pilot, follow up next week."
2. "Which deals have gone quiet in the last six weeks?"
3. "Find 20 patent attorneys in pharma and show me who they are."
4. "Did Anna reply to my pitch?"
5. "Create a follow-up campaign called Q3-Roche and add the Roche prospects."

## Registry: registry.modelcontextprotocol.io

- File: `registry/server.json`
- Publish with `mcp-publisher` (see https://github.com/modelcontextprotocol/registry).
- The name `com.leadlex/mcp` uses a domain namespace, so the registry asks you to prove you own `leadlex.com` (DNS TXT record or an HTTP file). [NEEDS: someone with DNS access for leadlex.com]
- Check the `$schema` date against the registry's current schema before publishing.

## Smithery

- Add the server by URL: `https://mcp.leadlex.com/mcp`.
- Use the short and long descriptions above, the logo and the example prompts.
- [NEEDS: whether Smithery can scan a server that requires OAuth, or whether a public test workspace is needed]

## PulseMCP

- Submit the server through the PulseMCP submit form with name, URL, description and the docs link. Once it is in the official registry, PulseMCP may pick it up automatically.
- Use the medium description.

## Glama

- Glama indexes from GitHub repositories. [NEEDS: decision on a public `Lead-IP/leadlex-mcp` repo with README and config only, no server code]
- If you create it, put the long description and the connect snippets from `mcp-server/connect-other.mdx` in the README.

## mcp.so

- Submit with name, URL, description, category and the docs link.
- Use the medium description. [NEEDS: public GitHub URL if the form requires one]

## Anthropic connector directory

- Remote server URL: `https://mcp.leadlex.com/mcp`
- Auth: OAuth 2.1 with dynamic client registration and PKCE (`S256`), scopes `read`, `write`, `lexi`.
- Tools: 99. [NEEDS: tool titles and read-only or destructive annotations on each tool, which the directory review asks for. Confirm they are set in the server code]
- Provide: description, logo, example prompts above, privacy policy, terms, support email, docs link.
- [NEEDS: a test account with sample data for the reviewers, created by the LeadLex team]
- [NEEDS: confirm current submission requirements in Anthropic's directory documentation]
