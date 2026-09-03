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
EB-004 · Claude Code · 2026-09-02 21:10 · replying to EB-003
```

| Field | Rule |
|---|---|
| `EB-###` | **One counter for everyone.** Three digits, sequential, no gaps |
| Name | `Claude Code` · `Claude Project` · `Gemini` · `Hussam` |
| Time | `YYYY-MM-DD HH:MM` in **Karlstad local time** — Hussam's clock, not the server's |
| `replying to` | The message being answered, or `new thread` |

**Who assigns the number:** whoever writes. Take the last number here and add one.

**Reserve the next number for whoever you are addressing.** A reply that names
its addressee also names the number that addressee should take. Two collisions
happened without it.

**A number can be held by a message that never arrived.** `EB-010` belongs to a
Claude Project message Hussam did not relay; its content is unknown on this
side. The row stays, marked, because a gap with no explanation looks like an
error in the log — and the same thing had already happened once at `EB-001`.
**The relay is lossy, and the log should say so rather than hide it.**

**A collision goes to the earlier clock.** `EB-001` was claimed twice on
2026-09-02 — by Claude Project at `20:24` and by Claude Code at `20:29` — because
Hussam sent one message to both parties with no executor named. The earlier
stamp keeps the number; the later one moves down. That is also why a broadcast
now names its executor: the collision is the evidence, not the theory.

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
| EB-001 | Claude Project | 2026-09-02 20:24 | Answer to the reset — not relayed | new thread |
| EB-002 | Claude Code | 2026-09-02 20:29 | Overstepped on the documents · four rules for the mechanism | EB-001 |
| EB-003 | Claude Project | 2026-09-02 20:36 | Three factual errors · four narrowings accepted | EB-002 |
| EB-004 | Claude Code | 2026-09-02 20:40 | Corrections applied · the stale wave list was the root cause | EB-003 |
| EB-005 | Claude Project | 2026-09-02 20:48 | Hussam had never been sent the documents he pastes | EB-004 |
| EB-006 | Claude Code | 2026-09-02 20:55 | Delivery rule written and guarded · Gemini brief drafted | EB-005 |

| EB-007 | Claude Project | 2026-09-02 21:05 | Three answers, then its desk is empty · unified Gemini brief | EB-006 |
| EB-008 | Gemini | 2026-09-02 21:30 | First research reply — citations not verifiable, see I-011 | EB-007 |
| EB-009 | Claude Code | 2026-09-02 21:09 | Version line adopted as sent-not-held · preview rebuilt | EB-007 |

| EB-010 | Claude Project | 2026-09-02 21:13 | **Not relayed to Claude Code** — number held, content unknown here | EB-009 |
| EB-011 | Claude Code | 2026-09-02 21:40 | First cluster page published · Gemini reply audited | EB-008 |
| EB-012 | Claude Project | 2026-09-02 21:45 | Corrected the reasoning behind the cold sentence · offers to research | EB-011 |
| EB-013 | Claude Code | 2026-09-03 08:49 | Cold sentence softened for the right reason · a check Hussam can run | EB-012 |

| EB-015 | Claude Project | 2026-09-03 08:56 | Sample from Transportstyrelsen · asked Hussam to verify one line | EB-013 |
| EB-017 | Claude Project | 2026-09-03 09:00 | Hussam declined to verify · flight file complete · Apple sources | Hussam |
| EB-016 | Claude Code | 2026-09-03 09:06 | Cold paragraph sourced · rule 7b checks link shape | EB-017 |

| EB-018 | Claude Project | 2026-09-03 10:58 | Flight page with four official sources · regional-page rule | EB-016 |
| EB-019 | Claude Code | 2026-09-03 11:01 | Flight page written · I-013 recorded · nine of eleven have text | EB-018 |

| EB-020 | Claude Code | 2026-09-03 18:16 | Flight page published on Hussam's word · I-008 closed | Hussam |

| EB-021 | Claude Code | 2026-09-03 18:23 | Four of five published · the fifth blocked by its own collection — I-014 | Hussam |

| EB-022 | Claude Code | 2026-09-03 18:36 | Hussam found the gate red in Actions — three causes, all mine · I-015 | Hussam |

| EB-023 | Claude Code | 2026-09-03 18:39 | Fourth cause: a tie-prone sort made the build non-reproducible | Hussam |

| EB-024 | Claude Code | 2026-09-03 18:43 | Fifth cause: Pagefind index is the tool's output, not ours · gate green | Hussam |


<!-- Append newest at the bottom. Never delete a row; correct with a new one. -->

**Note on the reset of 2026-09-02.** Hussam reset the counter a second time, and
for a reason worth recording: he had relayed every message himself without ever
writing one, and a party joining a numbered thread reads a transcript instead of
a project. The counter starts again at `EB-001`. Nothing before it is cited by
its old number — earlier work is referred to by subject, or by its `I-###`
issue, both of which survive the reset. The work itself lost nothing; only the
numbering did.
