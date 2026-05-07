# Hughey LLC Design System

## Color Tokens

### Primary Colors
- `--ink`: #09131F (Dark background, footer, contrast text)
- `--navy`: #0F2040 (Primary brand color, headings, buttons)
- `--mid`: #1B3360 (Mid-tone navy, hover states)
- `--steel`: #243A66 (Secondary steel tone)
- `--gold`: #C8973A (Primary accent, CTAs, highlights)
- `--glt`: #DDA94E (Gold lighter for hover states)
- `--gdim`: #9A7030 (Gold dimmed)
- `--gcm`: #F5E8CC (Gold cream background)

### Secondary Colors
- `--page`: #FAFAF5 (Light background, sections)
- `--warm`: #F4EDE0 (Warm light background)
- `--cream`: #EDE2CC (Cream tone)
- `--white`: #FFFFFF (White)

### Text & Border Colors
- `--text`: #111827 (Primary text color)
- `--sub`: #4A5568 (Secondary text, lighter emphasis)
- `--dim`: #8896A5 (Dimmed/disabled text)
- `--bdr`: #E2D8C8 (Border color)
- `--ok`: #1A9E6B (Success green)

## Typography

### Font Families
- `--man`: 'Manrope', sans-serif (Primary sans-serif for body and UI)
- `--bas`: 'Libre Baskerville', serif (Italic serif for emphasis, pullquotes)
- `--bar`: 'Barlow Condensed', sans-serif (Bold condensed for headings, numbers)
- `--sig`: 'Dancing Script', cursive (Logo signature style)

### Font Weights Used
- Manrope: 300, 400, 500, 600, 700, 800
- Libre Baskerville: 400 (italic only)
- Barlow Condensed: 700, 800
- Dancing Script: 600

## Spacing & Layout

### Container
- Max width: 1160px
- Horizontal padding: 52px
- Applied via `.w` class (max-width: 1160px; margin: 0 auto; padding: 0 52px;)

### Spacing Scale
- 4px (section borders)
- 5px (accent dots, decorative elements)
- 9px (icon/text gaps)
- 10px (list item spacing)
- 12px (label margins, eyebrow margins)
- 14px (standard gap, padding)
- 18px (section spacing)
- 22px (text margins)
- 24px (transform/vertical rhythm)
- 28px (section gaps, button gaps)
- 30px (nav gaps)
- 32px (footer, padding blocks, icon sizing)
- 36px (section headers)
- 40px (service row padding)
- 44px (card padding)
- 48px (proof card padding, large sections)
- 52px (major section padding, horizontal gutters)
- 56px (large padding blocks)
- 60px (problem row padding)
- 64px (section header padding)
- 72px (footer, footer logo height, about section padding)
- 80px (about section, audit section padding)
- 96px (major section padding - proof, insights, stats, final CTA)

## Animation & Transitions

### Reveal Animations
- `.rx` (reveal up): opacity 0 → 1, translateY(24px) → 0
  - Timing: 0.8s ease
  - Easing: cubic-bezier(.16,1,.3,1)
- `.rxl` (reveal from left): opacity 0 → 1, translateX(-24px) → 0
  - Timing: 0.8s ease
  - Easing: cubic-bezier(.16,1,.3,1)
- `.rxr` (reveal from right): opacity 0 → 1, translateX(24px) → 0
  - Timing: 0.8s ease
  - Easing: cubic-bezier(.16,1,.3,1)

### Animation Delays
- `.d1`: transition-delay: 0.1s
- `.d2`: transition-delay: 0.2s
- `.d3`: transition-delay: 0.3s

### Scroll Pulse Animation (h-scroll-line)
- Name: spulse
- Duration: 2.4s
- Direction: infinite
- Easing: ease-in-out
- Opacity: 0.4 → 1 → 0.4

### Badge Animation (h-badge)
- Name: badgeIn
- Duration: 1s
- Delay: 0.8s
- Easing: cubic-bezier(.16,1,.3,1)
- Transform: rotate(-15deg) scale(0.8) → rotate(0) scale(1)
- Opacity: 0 → 1

### Ambient Light Animations
- `.h-glow1`: 20s ease-in-out infinite alternate, translate(-50px, 40px) scale(1.12)
- `.h-glow2`: 16s ease-in-out infinite alternate, translate(40px, -30px) scale(1.08)

### Service Row Left Border Animation
- Transform origin: bottom
- Normal: scaleY(0)
- Hover: scaleY(1)
- Transition: 0.35s cubic-bezier(.16,1,.3,1)

### Insights Card Top Border Animation
- Transform origin: left
- Normal: scaleX(0)
- Hover: scaleX(1)
- Transition: 0.38s cubic-bezier(.16,1,.3,1)

## Navigation

### Positioning & Size
- Position: fixed
- Inset: 0 0 auto (top/left/right)
- Height: 70px
- Padding: 0 52px
- Z-index: 600

### Display
- Display: flex
- Align items: center
- Justify content: space-between

### Scrolled State (.scrolled)
- Background: rgba(9,19,31,.96)
- Border-bottom color: rgba(200,151,58,.15)
- Box-shadow: 0 2px 32px rgba(0,0,0,.25)
- Backdrop-filter: blur(16px)
- Transitions: background 0.4s, border-color 0.4s, box-shadow 0.4s

### Navigation Links (.nav-r a)
- Font-size: 13px
- Font-weight: 500
- Color: rgba(255,255,255,.5)
- Letter-spacing: 0.02em
- Gap between items: 30px
- Hover: color changes to rgba(255,255,255,.9)

## Button Variants

### Primary Button (.btn-primary)
- Display: inline-flex
- Gap: 9px
- Background: var(--gold)
- Color: var(--ink)
- Font: Manrope, 800, 13px
- Letter-spacing: 0.07em
- Text-transform: uppercase
- Padding: 16px 34px
- Border: none
- Border-radius: 2px
- Box-shadow: 0 4px 28px rgba(200,151,58,.42)
- Transition: background 0.25s, transform 0.2s
- Hover: 
  - Background: var(--glt)
  - Transform: translateY(-1px)
  - Box-shadow: 0 6px 36px rgba(200,151,58,.52)

### Ghost Button (.btn-ghost)
- Display: inline-flex
- Gap: 9px
- Background: rgba(255,255,255,.07)
- Color: rgba(255,255,255,.7)
- Font: Manrope, 600, 13px
- Letter-spacing: 0.07em
- Text-transform: uppercase
- Padding: 16px 28px
- Border-radius: 2px
- Border: 1px solid rgba(255,255,255,.14)
- Transition: all 0.22s
- Hover:
  - Background: rgba(255,255,255,.13)
  - Color: var(--white)

### Navy Button (.btn-navy)
- Display: inline-flex
- Gap: 9px
- Background: var(--navy)
- Color: var(--white)
- Font: Manrope, 700, 13px
- Letter-spacing: 0.07em
- Text-transform: uppercase
- Padding: 14px 28px
- Border-radius: 2px
- Border: none
- Transition: background 0.2s
- Hover: background changes to var(--mid)

### Ink Button (.btn-ink)
- Display: inline-flex
- Gap: 10px
- Background: var(--ink)
- Color: var(--gcm)
- Font: Manrope, 800, 13px
- Letter-spacing: 0.08em
- Text-transform: uppercase
- Padding: 16px 36px
- Border-radius: 2px
- Border: none
- Transition: background 0.2s, gap 0.2s
- Hover:
  - Background: var(--navy)
  - Gap: 14px

### Navigation Button (.nav-btn)
- Font: Manrope, 700, 12px
- Letter-spacing: 0.08em
- Text-transform: uppercase
- Border: 1px solid var(--gold)
- Color: var(--gold)
- Padding: 9px 22px
- Border-radius: 2px
- Transition: all 0.22s
- Hover:
  - Background: var(--gold)
  - Color: var(--ink)

## Page Sections (Top to Bottom)

### 1. Navigation
- Class: `nav`
- Height: 70px
- Fixed positioning
- Contains logo and nav links
- Scrolled state triggers at Y > 40px

### 2. Hero Section
- Class: `hero`
- Min-height: 100vh
- Background: var(--ink)
- Padding-top: 70px (nav height)
- Position: relative, overflow: hidden
- Contains:
  - `.h-glow1` & `.h-glow2` (ambient light animations)
  - `.h-badge` (20 years badge)
  - `.h-slides` (slide container with 4 slides)
  - `.h-bottom` (CTA buttons and meta)
  - `.h-nav` (slide indicator dots)
  - `.h-scroll-hint` (scroll indicator)
- Grain overlay: fractal noise SVG filter at 0.07 opacity
- Slide rotation: 4400ms interval

### 3. Trust Bar
- Class: `trust`
- Background: var(--white)
- Border-bottom: 1px solid var(--bdr)
- Padding: 22px 0
- Layout: flex row, centered, wrapped
- Contains 5 items with gold pips

### 4. Problems Section
- Class: `problems`
- Background: var(--white)
- Contains:
  - `.problems-hd` (section header with padding 96px 52px 64px)
  - `.prob-rows` (border-top: 1px solid var(--bdr))
  - 3x `.prob-row` (grid 2 columns, alternating layout)
    - `.pq` (problem quote side): padding 60px 64px, italic serif text
    - `.pa` (problem answer side): padding 60px 64px, flex column
  - Even rows have `.pq` and `.pa` reversed with order property

### 5. Services Section
- Class: `services`
- Background: var(--navy)
- Padding: 96px 0 0
- Position: relative, overflow: hidden
- Grid pattern background (36px 36px, rgba(255,255,255,.03))
- Contains:
  - `.svc-hd` (header section)
  - `.svc-rows` (container for 4 service rows)
  - 4x `.svc-row` (grid: 88px 1fr 52px columns)
    - `.svc-n` (number: font 72px, Barlow Condensed 800)
    - `.svc-body` (content: padding 40px 52px 40px 0)
    - `.svc-arr` (arrow icon)

### 6. Proof/Testimonials Section
- Class: `proof`
- Background: var(--warm)
- Padding: 96px 0
- Contains:
  - Header (sec-ey + sec-h2)
  - `.proof-g` (2-column grid, gap 20px)
  - 2x `.proof-c` (white cards with border: 1px solid var(--bdr))
    - Padding: 48px 44px
    - Quote mark overlay (::before, Dancing Script, 160px)
    - 5-star rating
    - Italic serif quote
    - Gold horizontal bar
    - Name and role

### 7. Stats Band
- Class: `stats-band`
- Background: var(--gold)
- Padding: 0
- Contains:
  - `.stats-g` (grid 4 columns)
  - 4x `.stat-b` (centered, padding 52px 36px)
    - `.stat-n` (number: Barlow Condensed 800, 60px)
    - `.stat-l` (label: 13px, weight 600)

### 8. About Section
- Class: `about`
- Display: grid
- Grid: 440px 1fr columns
- Contains:
  - `.about-l` (left: ink background, 80px padding, flex column justify-end, min-height 640px)
    - Contains decorative geometry and credentials
  - `.about-r` (right: page background, 80px padding, flex column justify-center)
    - Pullquote (italic serif, 18-26px, 3px left gold border)
    - Body text and credentials list

### 9. Audit Section
- Class: `audit`
- Background: var(--white)
- Borders: 1px solid var(--bdr) top and bottom
- Grid: 1fr 1fr columns, min-height 500px
- Contains:
  - `.audit-l` (left: 80px padding, border-right)
    - Section header and description
  - `.audit-r` (right: page background, 80px padding)
    - Progress bars (3 `.a-pd` items)
    - Question text (`.a-q`)
    - Answer options (2x `.a-o` buttons)
    - Result display (`.a-result` hidden until answered)

### 10. Insights Section
- Class: `insights`
- Background: var(--white)
- Padding: 96px 0
- Contains:
  - `.ins-hd` (flex between, 48px margin-bottom)
  - `.ins-g` (grid: 1.5fr 1fr 1fr columns)
  - 3x `.ins-c` (cards with padding 44px 38px)
    - First card has `.lead` class (larger title: 22px vs 18px)
    - Border-right: 1px solid var(--bdr)
    - Gold top border animation on hover (2px height)
    - Tag, title, excerpt, read link

### 11. Final CTA Section
- Class: `fin-cta`
- Background: var(--gold)
- Padding: 96px 0
- Position: relative, overflow: hidden
- Grid pattern background (52px 52px, rgba(9,19,31,.05))
- Contains:
  - 2x `.fin-word` (large watermark text, 420px, Barlow Condensed 800, rgba(9,19,31,.04))
    - `.fw1` (top left)
    - `.fw2` (bottom right)
  - `.fin-inner` (max-width 660px, centered, relative z-index 2)
    - Eyebrow with decorative lines
    - Heading (32-58px, clamp responsive)
    - Subheading
    - `.btn-ink` button
    - Fine print with phone link

### 12. Footer
- Tag: `footer`
- Background: var(--ink)
- Padding: 72px 0 40px
- Contains:
  - `.ft-top` (grid: 2fr 1fr 1fr 1fr, gap 52px, border-bottom)
    - Logo block
    - 3x footer columns
  - `.ft-bot` (flex between, space-between)
    - Copyright text
    - Social links (LinkedIn, Facebook)

## Section Headers

All section headers use this consistent pattern:
- `.sec-ey` (eyebrow)
  - Font: 11px, weight 700
  - Letter-spacing: 0.18em
  - Text-transform: uppercase
  - Color: var(--gold)
  - Display: flex, gap 9px
  - ::before element: 18px wide, 2px tall, gold background
  - Margin-bottom: 12px

- `.sec-h2` (heading)
  - Font-weight: 800
  - Font-size: clamp(28px, 3.2vw, 46px)
  - Color: var(--navy)
  - Letter-spacing: -0.04em
  - Line-height: 1.1
  - Can contain `<em>` tags (Libre Baskerville italic, var(--mid) color)

## Logo Treatment

### Logo Signature (.logo-sig)
- Font: Dancing Script, 600, 26px
- Letter-spacing: 0.01em
- Line-height: 1
- Color: var(--white)
- Display: flex, align-items baseline, gap 3px
- Contains:
  - Main text: "Hughey"
  - `.logo-llc` child: Manrope 600, 11px, uppercase, letter-spacing 0.12em, rgba(255,255,255,.5)
- Dark variant (.dark): navy color, rgba(15,32,64,.4) for LLC text

## Responsive Behavior

### Clamp Typography
- Eyebrows: clamp(11px, 1.2vw, 14px)
- Hero headlines: clamp(42px, 5.8vw, 80px)
- Hero subtext: clamp(14px, 1.4vw, 17px)
- Section headings: clamp(28px, 3.2vw, 46px)
- Service titles: clamp(17px, 2vw, 24px)
- About section: clamp(18px, 2.1vw, 26px)
- Final CTA: clamp(32px, 4.5vw, 58px)

### Responsive Hiding
- List layout switches to single column below 640px breakpoint
- Mobile adjusts grid layouts as needed

## Specific Component Details

### Hero Slides (.h-slide)
- Position: absolute
- Width: 100%
- Opacity: 0 → 1 on `.on` state
- Transition: opacity 0.7s ease

### Hero Eyebrow (.h-eyebrow)
- Font: Manrope 600
- Size: clamp(11px, 1.2vw, 14px)
- Letter-spacing: 0.2em
- Color: rgba(255,255,255,.35)
- Margin-bottom: 18px

### Hero Highlight (.h-hl)
- Font: Manrope 800
- Size: clamp(42px, 5.8vw, 80px)
- Line-height: 1.06
- Letter-spacing: -0.045em
- Color: var(--white)
- Contains `<em>` tags: Libre Baskerville italic, var(--glt), -0.025em letter-spacing

### Hero Subtext (.h-sub)
- Font-size: clamp(14px, 1.4vw, 17px)
- Font-weight: 400
- Color: rgba(255,255,255,.42)
- Margin-top: 18px
- Line-height: 1.6

### Slide Dots (.h-dot)
- Width: 28px, height: 2px
- Background: rgba(255,255,255,.18)
- On state: background var(--gold), width 44px
- Transition: background 0.3s, width 0.3s

### Problem Question (.pq-text)
- Font: Libre Baskerville italic
- Font-size: clamp(16px, 1.9vw, 23px)
- Color: var(--navy)
- Line-height: 1.55
- Max-width: 360px

### Problem Number (.pq-num)
- Font: Barlow Condensed 800, 200px
- Color: var(--bdr)
- Position: absolute, bottom -30px, right -15px
- Letter-spacing: -0.06em
- Transition: color 0.35s on row hover

### Service Number (.svc-n)
- Font: Barlow Condensed 800, 72px
- Color: rgba(255,255,255,.06)
- Line-height: 1
- Letter-spacing: -0.04em
- Padding: 40px 0
- Hover: color rgba(200,151,58,.18)

### Service Title (.svc-t)
- Font-weight: 800
- Font-size: clamp(17px, 2vw, 24px)
- Color: var(--white)
- Letter-spacing: -0.03em
- Margin-bottom: 8px

### Service Description (.svc-d)
- Font-size: 14px
- Color: rgba(255,255,255,.45)
- Line-height: 1.75
- Max-width: 600px

### Proof Stars (.proof-stars)
- Color: var(--gold)
- Font-size: 15px
- Letter-spacing: 2px
- Margin-bottom: 20px

### About Name (.ab-name)
- Font: Barlow Condensed 800, 72px
- Color: var(--white)
- Letter-spacing: -0.04em
- Line-height: 0.95
- Margin-bottom: 6px

### About Pullquote (.ab-pull)
- Font: Libre Baskerville italic
- Font-size: clamp(18px, 2.1vw, 26px)
- Color: var(--navy)
- Line-height: 1.55
- Border-left: 3px solid var(--gold)
- Padding-left: 22px
- Margin-bottom: 24px

### Insights Title (.ins-t)
- Font-weight: 800
- Font-size: 18px
- Color: var(--navy)
- Letter-spacing: -0.03em
- Line-height: 1.3
- Margin-bottom: 12px
- Lead variant: 22px

### Final CTA Heading (.fin-h2)
- Font-weight: 800
- Font-size: clamp(32px, 4.5vw, 58px)
- Color: var(--ink)
- Letter-spacing: -0.05em
- Line-height: 1.08
- Margin-bottom: 18px
- Contains `<em>`: Libre Baskerville italic, -0.02em letter-spacing

### Audit Progress Bar (.a-pd)
- Height: 3px
- Background: var(--bdr)
- Border-radius: 2px
- Lit state: background var(--gold)
- Transition: background 0.4s

### Audit Question (.a-q)
- Font-weight: 700
- Font-size: clamp(16px, 1.9vw, 21px)
- Color: var(--navy)
- Letter-spacing: -0.03em
- Line-height: 1.4
- Min-height: 58px
- Margin-bottom: 28px
- Transition: opacity 0.2s

### Audit Result (.a-result)
- Display: none (flex column when .show)

### Audit Score (.a-big-score)
- Font: Barlow Condensed 800, 96px
- Letter-spacing: -0.06em
- Line-height: 1
- Color: var(--gold)
- Margin-bottom: 6px

## Summary of Key Design Principles

1. **Color System**: Navy and ink backgrounds with gold accents; warm cream for secondary backgrounds
2. **Typography**: Manrope for body/UI, Libre Baskerville for italic emphasis, Barlow Condensed for bold headings/numbers
3. **Spacing**: Consistent 52px horizontal gutters; vertical rhythm with 24px base unit
4. **Animations**: Subtle entrance reveals (0.8s), smooth state transitions (0.2-0.4s), never overwhelming
5. **Contrast**: High contrast text on dark backgrounds; careful use of transparency for disabled/secondary states
6. **Grid System**: 1160px max-width container with consistent column-based layouts
7. **Interactive States**: Hover states with color shifts, subtle transforms, maintained accessibility
