# eldebosh.com

A Swedish content site that takes a reader from an everyday problem ("my phone
dies before evening") to a practical solution and then to a suitable product.
Income: Amazon affiliate links only. Market: Sweden. Languages: Swedish
(content), English (interface). The owner owns and photographs the products
himself and shows them at his market stall in Karlstad; the site's rules
exist to keep that honest.

Static site: Astro 5 · Sveltia CMS at `/admin/` · Pagefind search · GitHub
Actions builds and verifies every push to `main` and publishes to the `deploy`
branch, which Hostinger pulls.

```
npm ci
npm run dev        # http://localhost:4321/sv/
npm run verify     # every check — must pass before any push
```

## Documentation

| Read | For |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is built and why: pipeline, content model, URLs, design system |
| [docs/RULES.md](docs/RULES.md) | The binding rules — honesty, Amazon, photos, design — and what enforces each |
| [docs/CONTENT.md](docs/CONTENT.md) | Adding products, photos and pages; how to write for the site |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Commands, checks, publishing, the admin panel, hosting, repairs |
| [docs/project/STATE.md](docs/project/STATE.md) | Generated status: what exists and what is missing (`npm run state`) |
| [docs/project/TASKS.md](docs/project/TASKS.md) | Current tasks (Arabic) |
| [docs/project/HANDOVER.md](docs/project/HANDOVER.md) | The owner's guide (Arabic) |
| [docs/project/INSTRUCTIONS.md](docs/project/INSTRUCTIONS.md) | How the owner, Claude Code and Claude Project work together (Arabic) |
| [CLAUDE.md](CLAUDE.md) | Instructions for an AI agent working in this repository |
| [CHANGELOG.md](CHANGELOG.md) | Changes per delivery |

Owner-facing documents are in Arabic because the owner reads Arabic; code,
comments and technical documentation are in English. The repository is the
project's only memory — if something is not written here, it is not known.
