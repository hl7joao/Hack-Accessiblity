# Candidate ideas — scored

Two research passes: underserved gaps (evidence-led) and hackathon dynamics
(what wins, what gets mocked). Scored against docs/decision-framework.md, 1-5.

## Shortlist

| # | Idea | Demand | Underserved | Newly possible | Tractable | Demos | Survives | Total |
|---|---|---|---|---|---|---|---|---|
| 1 | Consumer-side PDF liberation | 5 | 5 | 5 | 4 | 5 | 4 | **28** |
| 2 | Screen-reader fix for AI chat UIs | 4 | 5 | 5 | 5 | 4 | 5 | **28** |
| 3 | Non-visual access to node editors | 4 | 5 | 3 | 4 | 5 | 4 | **25** |
| 4 | Form error recovery (cognitive) | 4 | 5 | 4 | 4 | 4 | 4 | **25** |
| 5 | Sensory agent (user-side, NOT overlay) | 4 | 3 | 3 | 5 | 4 | 4 | **23** |
| 6 | Tactile graphics software half | 4 | 5 | 3 | 3 | 4 | 3 | **22** |
| 7 | AAC vocabulary personalization | 5 | 4 | 4 | 3 | 3 | 4 | **23** |

## Detail on the top three

### 1. Consumer-side PDF liberation
85.6% of screen reader users say PDFs cause significant problems — the highest of
any content type, and RISING (75.1% in 2019). 55% hit inaccessible bank statements,
51% insurance/benefits statements. Not optional documents.

Why it's unsolved: the entire commercial market sells to the *publisher*
($5-60/page remediation). Nobody sells to the recipient, who has no budget and no
leverage over their bank. Economics are structurally backwards.

Why now: WebGPU hit Baseline Jan 2026. Local inference means a bank statement never
leaves the device — which is precisely why no SaaS could ever solve this.
The privacy constraint IS the product.

Demo: "Here is my actual bank statement. Here is what my screen reader says."

### 2. Screen-reader accessibility of AI chat interfaces
Documented failures: streaming tokens shift content so the SR buffer desyncs;
loading states are visual-only (silence = can't tell slow from broken); focus jumps
to top after sending. 60.1% of SR users already use AI daily — heavy users served
by hostile interfaces.

Why it's unsolved: streaming text is a genuinely open ARIA live-region problem.
No settled pattern exists. Vendors ship visual-first and move too fast to retrofit.

Ships as an npm package + extension that fixes real chat UIs live. Artifact
outlives the demo. Hook: "the AI industry has this bug."

### 3. Non-visual access to node editors
A blind user on n8n: "impossible to use with screen readers... an accessibility
nightmare." Generalizes to Figma, Miro, Zapier, Scratch, Unreal Blueprints.
These are increasingly THE interface to professional work, categorically closed.
Career-defining impact per person. Almost zero hackathon competition.

## Ruled out

- **AI cane** — 100+ smart canes exist, none replaced the white cane. Vibration is
  lower-bandwidth than the tactile/acoustic probe it replaces. Doubles weight,
  ruins balance, dead-battery failure in a safety-critical aid.
- **Better TTS** — commoditized. Users prefer Eloquence-class voices for high-speed
  intelligibility; "more human-sounding" is a downgrade on the axis they care about.
- **Accessibility overlay** — FTC fined accessiBe $1M; 22.6% of H1-2025 lawsuits hit
  sites that HAD overlays. Radioactive.
- **Alt-text generator** — 60.1% of SR users already do this themselves.
- **Sign language gloves/CV** — canonical disability dongle.

## The variable that decides it

Every source converged: winners had a disabled person as decision-maker, not test
subject. MIT ATHack weights "co-designer collaboration" equally with technical
innovation. Both famous survivors (MS Eye Control, Seeing AI) were led or
commissioned by the disabled person whose problem it was.
