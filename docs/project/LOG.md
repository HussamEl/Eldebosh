# ELDEBOSH.COM — MESSAGE LOG

> **Version:** `v1.0` · 2026-08-31 · canonical copy: `docs/project/` in the repository
>
> Three parties reply in three separate conversations and Hussam relays between
> them. Without one shared counter, nobody — least of all Hussam — knows where
> the thread ended.

---

## Format

Every reply opens with a single line, read before anything else:

```
EB-014 · Claude Code · 2026-09-01 09:15 · replying to EB-013
```

| Field | Rule |
|---|---|
| `EB-###` | **One counter for everyone.** Three digits, sequential, no gaps |
| Name | `Claude Code` · `Claude Project` · `Gemini` · `Hussam` |
| Time | `YYYY-MM-DD HH:MM` in **Karlstad local time** — Hussam's clock, not the server's |
| `replying to` | The message being answered, or `new thread` |

**Who assigns the number:** whoever writes. Take the last number here and add one.

**Read the clock; do not estimate it.** A party on UTC converts first
(`Europe/Stockholm`: `UTC+2` summer, `UTC+1` winter). An approximate timestamp
corrupts the log.

**Who records:** Claude Code, being the only party that pushes. Others number
their own messages, Hussam relays them, and they are recorded here on the next
push.

**On collision:** the earlier timestamp keeps the number, the other takes the
next. This log settles it.

---

## Who starts what

Ownership by kind of work, not a fixed rotation — a fixed rotation wastes turns
when a party has nothing to say.

| Kind of work | Starts | Reviews |
|---|---|---|
| Code · build · checks · deployment · identity | **Claude Code** | Claude Project |
| Content · SEO · product decisions · legal | **Claude Project** | Claude Code |
| External research · second opinion · verification | **Gemini** | Whoever is concerned |
| Anything costing money, time or touching privacy | **Hussam** | — |

**Whoever opens a thread closes it.**

---

## The log

| # | From | Time (Karlstad) | Subject | Replying to |
|---|---|---|---|---|
| EB-001 | Claude Project | 2026-09-01 17:23 | Legal pages published while empty · battery cluster 2/11 · one editorial collision | new thread |
| EB-002 | Claude Code | 2026-09-01 17:35 | Verified the four legal pages and the privacy facts · pinned the CMS version | EB-001 |
| EB-003 | Claude Project | 2026-09-01 17:43 | Schema root cause · the four legal texts delivered | EB-002 |
| EB-004 | Claude Code | 2026-09-01 17:50 | pages sat outside the validator · rules scoped · schema left to Hussam | EB-003 |
| EB-005 | Claude Project | 2026-09-01 17:56 | Test cases for rule 6 · Amazon: two obligations · first cluster page | EB-004 |
| EB-006 | Claude Code | 2026-09-01 18:03 | Rule 6 rebuilt with 13 test cases · travel page written · I-008 recorded | EB-005 |

| EB-007 | Claude Project | 2026-09-01 18:07 | Templated experience text in the product data · winter page | EB-006 |
| EB-008 | Claude Code | 2026-09-01 18:15 | Guard for duplicate experience text · thermometer icon · every generator on Karlstad time | EB-007 |


<!-- Append newest at the bottom. Never delete a row; correct with a new one. -->

**Note on the reset.** Numbers used in chat before this table existed carry no
authority — the counter starts here, at `EB-001`. Anything referenced by an
older number is re-cited by subject, never by its old number.
