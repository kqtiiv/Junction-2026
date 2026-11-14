# SPEC: Spendtacles, "Two shoppers"

GOAL: A judge watches two people stand at the same shelf with the same price. One is still scrolling a banking app when the other has already decided and planned it. The judge ends the film thinking "asking in the aisle beats checking afterwards", and that every number the coach said was real and checked.

OUTPUT: HyperFrames, 1920 × 1080, 30 fps, 16:9.

TIME: 120 s × 30 = 3600 frames (range 110–120 s). The music sets the clock. The bed is about 96 BPM, so 18.75 frames per beat and 75 frames per bar. Cuts and landings fall on bar lines once the track is chosen; the times below are pre-music and get snapped to beats later.

## LOOK

### Two sides, then one

**Left: "the old way".**
- Footage graded −35% saturation and −8% exposure, with a cool 6500 K white.
- The ground behind the UI is #E9E9EE.
- Nothing on this side is ever accent-coloured.

**Right: "Spendtacles".**
- Warm shop-light footage, with real saturation.
- The app UI is light iOS:
  - ground #FFFFFF;
  - cards #F2F2F7 with a 36 px radius;
  - ink #000000, secondary ink #6C6C70.

### The split
- A 6 px #FFFFFF seam at x = 960.
- The seam closes by pushing the left pane out of frame. Never a crossfade.

### Type
- **Display: Inter 900.**
  - Captions are 64 px with tracking −2%.
  - Titles are 180 px with tracking −4%.
- **UI: Inter 700/400, at 1.8× the app's own size.**
  - Card title 44 px.
  - Big number 150 px at weight 900.
  - Rows 40 px.
  - Chips 30 px.
- **The no-bank question:** at most one line of 64 px on screen at a time.

### Accent and chips
- **The one accent is iOS blue #0A84FF.** It appears only on:
  - the Confirm button;
  - the ticking number while it ticks;
  - the end-card call to action.
- **Evidence chips** use the app's own colours. Each chip is text on a 14% tint of its colour, with a pill radius, because that is how the app draws them.

  | Chip | Text colour | Tint |
  |---|---|---|
  | estimate | #FF9500 | #FFF0DD |
  | fact / calculated | #34C759 | #DDF5E3 |
  | read by camera | #AF52DE | #F3E3FA |

### Dark cards
- The dark cards (#0B0B0C ground) are used only for the reveal (shot 06) and the end card (shot 14).
- On those cards, type fills at least 55% of the frame width.

### Depth
- UI cards cast one shadow: 0 24 px 60 px at rgba(0,0,0,0.12).
- Footage gets no added grain, glow or vignette.

## OBJECTS

| Object | How it appears |
|---|---|
| **The shelf tag** | The real demo label, LANGATTOMAT KUULOKKEET 79,90 €: a red header band and black price on white. It is the bridge between the footage and the UI, and "79,90 €" is the one piece of data that travels through the film. |
| **The phone** | Only its screen content, rebuilt from the real app (no device frame). In the left-hand footage it is the shopper's own phone, filmed. |
| **The glasses** | Real Ray-Ban Meta in your footage only. Never drawn. |
| **The confirm sheet** | Rebuilt with its exact labels: "Add “Langattomat kuulokkeet” to this week's planned spending?", "Price (read from the label) 79,90 €", "Safe to spend this week 90,16 € → 10,26 €", "You can undo this later.", "Not now" and "Confirm". |
| **The answer** | The real sentence: “If that price is 79.90, it fits, but it would leave about 10 euros until Sunday. Want me to plan it in?” |

## MOTION

### Eases by role

| Role | Ease |
|---|---|
| enter | `expo.out` |
| move / camera | `power3.inOut` |
| exit | `power2.in` |
| the split collapse | `power4.inOut` over 24 frames |
| type-on captions | one word per 4 frames, no fade |

### Durations
- A UI card arrives in 14 frames with a 2.0× → 1.0× scale push and no slide.
- A chip pops in 8 frames, 0.85 → 1.0.
- The number tick runs 90,16 → 10,26 in 36 frames, stepping on every frame with a stepped ease. It settles in blue, then turns to black after 30 frames.
- Staggers are 6 frames. Secondary moves start 4 frames after the hero move.

### Hard rules
- The left pane churns, with a fast scroll and a cut every 18 frames.
- The right pane holds still while its UI acts.

## SHOTS

| # | Time (frames) | Hero move | What the viewer reads | Sound | Handoff |
|---|---|---|---|---|---|
| 01 | 0–6 s (0–180) | Hard split, both panes live from frame 0. | "Same shelf. Same 79,90 €." across the seam (0.4–3.0 s). | Room tone. The bed enters on bar 1. | – |
| 02 | 6–14 s | **Left (L):** unlock → bank app → account list, a cut every 18 frames. **Right (R):** the glasses look at the tag (F1). | **R:** "does this fit my week?" types on under the tag (6.5–9.5 s). | **L:** phone UI clicks. **R:** silence under the bed. | – |
| 03 | 14–22 s | **L:** scrolling a transaction list (placeholder footage). **R:** the answer, as captions with a waveform. | **R:** the real sentence in two lines, (14.4–17.4 s) and (17.6–21.4 s). | **L:** clicks build. | – |
| 04 | 22–30 s | **R:** F2, a thumb taps Confirm and "Done." lands. **L:** still scrolling. | **R:** "Done. You can undo it on your phone." (24.0–27.0 s). **L:** "still checking…" (27.0–29.5 s). | Click on the tap. **L** clatter peaks. | – |
| 05 | 30–33 s | The seam pushes left and the left pane leaves frame (24 frames). | – | **L** goes silent on the push. Whoosh. | The right pane fills the frame. |
| 06 | 33–39 s | Reveal: a dark card with "Spendtacles" at 180 px, wiped in from the left edge. | "Spendtacles" (33.4–36 s). "Ask while you're still at the shelf" (36–38.8 s). | Bed lifts a bar. | The tag on the right pane becomes shot 07. |
| 07 | 39–49 s | **Look.** The tag at 1.8×. "79,90 €" lifts off the tag, and the purple "read by camera" chip pops. | "It reads the label" (39.5–42 s). "79,90 € · read by camera" (42–48 s). | Pop on the chip. | – |
| 08 | 49–61 s | **Ask + hear.** Glasses footage behind, with the sentence typed on in big type, word by word. | "If that price is 79.90, it fits…" (49.5–54 s). "…but it would leave about 10 euros until Sunday." (54–58.5 s). | Soft key ticks. | "about 10 euros" turns into the card number. |
| 09 | 61–71 s | **Check.** The answer card: "Does it fit this week?", 10,26 € and the estimate chip. | "Does it fit this week? 10,26 €" (61.5–65 s). "Every number checked against the calculation" (65–70 s). | Pop on the chip. | – |
| 10 | 71–79 s | **Tap.** The confirm sheet slides up and the cursor-thumb taps Confirm. | The sheet's rows (71.5–76 s). Confirm is tapped (77 s). | Click on Confirm. | – |
| 11 | 79–90 s | **Payoff.** 90,16 € ticks to 10,26 € at 220 px, then "Done. You can undo it on your phone." | The tick (79.5–81 s), the result holds (81–85 s), then "Done…" (85–89 s). | Riser into impact on the settle (once in the film). | – |
| 12 | 90–104 s | **No bank connected?** The phone asks: "How much do you want to spend until Sunday?" → "about a hundred" → "Got it: 100 euros until Sunday. If the label's right, that leaves about 20." | Four lines, one at a time, at 3.0–3.5 s each. | Key ticks. | – |
| 13 | 104–112 s | **Trust.** One line per beat, each on its real chip or label. | "Every number is checked" → "The photo is deleted" → "You say yes first" → "It never moves money" (2 s each). | Pop per chip. | – |
| 14 | 112–120 s | **End card.** F3, the glasses come off. "Spendtacles" wipes in at 25% of the frame width, then the call to action. | "Spendtacles" (113–120 s). "Look. Ask. Decide." (115.5–120 s). | Bed resolves on a bar line, with a 1.5 s fade. | – |

## BANNED
- A dark void with small UI floating in it.
- Glow, particles, mesh or purple gradients, glass cards.
- A phone device mockup. A tilted 3D phone.
- Three cards in a row. A title over a dimmed screenshot. The logo docked in a corner.
- Every element fading and sliding up. Captions that move while being read.
- A drawn banking-app UI, or any real bank's name, logo or colours on the left side. The left side is your own footage only (screen blurred), or a labelled placeholder.
- "Introducing", "seamless", "effortless", "unlock", "in seconds".
- Numbers that are not in the real app run.

## QA

| Frame | Must show |
|---|---|
| 1.5 s | Both panes and the caption across the seam. |
| 10 s | The left pane mid-churn, and the right pane's tag with the question. |
| 31 s | The seam mid-push, with both panes intact. |
| 44 s | "79,90 €" lifted off the tag, and the purple chip. |
| 80.2 s | The tick mid-way, in blue. |
| 86 s | 10,26 € settled in black, and "Done…". |
| 96 s | One no-bank line, nothing else. |
| 117 s | The wordmark and the call to action, both centred and settled. |
