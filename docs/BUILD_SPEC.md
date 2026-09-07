# BUILD SPEC — Aunt Harley (dual-target: WinUI 3 on Dell + PWA on tablet)

Canonical engineering spec. Version 1.1. Owner: Harley Hive (Dell = build station, Bench = design/QA).

## 1. Product Identity

- Product: Aunt Harley — AI step-aunt companion for Trystan
- Target user: A kid (under 13). Two homes:
  1. Dell workstation — Trystan's own Windows profile → native WinUI 3 app (this doc, most of section 2)
  2. Revvl 5G-class Android tablet → installable PWA + small on-device brain (see docs/TABLET.md)
- Same personality, same brand, same 100%-local promise on BOTH targets. No cloud on either.
- Personality: sweet, patient, playful, encouraging. 100% clean. Zero adult content.
- Brand: The Squishies (Squish Toast, Strawb, Avocadon't, Boba) — ORIGINAL characters, no IP risk
- Distribution: Dell = signed MSIX installer + GitHub Releases + GitHub Pages site. Tablet = PWA add-to-home-screen, no store needed.

### 1.1 Dual-target matrix

| | Dell (WinUI 3) | Tablet (PWA) |
|---|---|---|
| UI | WinUI 3 desktop app | Installable PWA, full-screen |
| Brain | EVE Qwen2.5-VL-7B on port 1234 | Qwen2.5-VL-3B Q4_K_M on port 1234 (1.8GB) |
| Setup | MSIX install once | Termux + llama.cpp + start script (docs/TABLET.md) |
| Offline | Yes | Yes |
| Persona | AUNT_HARLEY_PERSONA.md (packaged asset) | Baked into tablet/chat.js |
| Image chat | Future (vision OK on EVE) | Works now (📷 button, 1024px downscale) |
| Code lives | src/ (WinUI 3, from Dell) | tablet/ (done) |

## 2. The "From Walmart" Standard

To install without scary warnings:

Required:
- MSIX package (not raw EXE)
- Signed with a trusted code-signing certificate (see Signing Guide)
- Versioned releases with release notes
- Publisher identity matching the cert
- Install via Microsoft Store OR sideload with trusted cert, OR
- Full Smart App Control (SAC) compatibility = candidates need to be catalog-signed / Store-validated. SAC is picky; treat "store submission" as the gold path.

Smart App Control note: SAC blocks unsigned and self-signed candidates. If SAC is ON, the only reliable paths are (a) Microsoft Store submission, or (b) turn SAC off / switch to S-mode-free standard Defender mode on that machine. Do not fight SAC with self-signed certs — it will lose.

## 3. Architecture

WinUI 3 (Windows App SDK) desktop app:

```
AuntHarley.sln
├─ AuntHarley/                     (WinUI 3 project, net8.0-windows10.0.19041.0)
│   ├─ App.xaml / App.xaml.cs
│   ├─ MainWindow.xaml             (shell: left rail + chat pane + Squishies art)
│   ├─ Controls/
│   │   ├─ ChatBubble.xaml         (incoming/outgoing bubbles)
│   │   └─ TypingIndicator.xaml
│   ├─ ViewModels/
│   │   ├─ ChatViewModel.cs        (ObservableCollection<Message>, SendAsync)
│   │   └─ SettingsViewModel.cs
│   ├─ Services/
│   │   ├─ LlmClient.cs            (HTTP → local OpenAI-compatible endpoint)
│   │   ├─ PersonaProvider.cs      (loads AUNT_HARLEY_PERSONA.md)
│   │   └─ BrainStatusService.cs   (health checks port 1234)
│   ├─ Data/
│   │   └─ Message.cs
│   ├─ Assets/                     (icons already generated — see repo assets/icons)
│   └─ Package.appxmanifest
└─ AuntHarley.Package/             (MSIX packaging project)
```

## 4. Local Model Wiring

- Endpoint: `http://127.0.0.1:1234/v1`
- The brain = EVE server (llama-server) already scheduled on the Dell as `HarleyEveServer`
- Model string (OpenAI API): full GGUF path of EVE Qwen2.5-VL-7B
- App must NOT bundle the model (~4.7GB). App detects brain at startup:
  - If port 1234 answers `/v1/models` → chat enabled
  - If not → friendly "ask your dad to wake the brain" screen with the Task Scheduler hint
- Persona injected as the system prompt on every new conversation. File: AUNT_HARLEY_PERSONA.md (build it into Assets/ as content).

## 5. Key Screens

1. Splash → health check (brain on/off)
2. Chat (main): warm greeting, message list, text input, Enter to send
3. Settings: model endpoint override, persona picker (default AUNT HARLEY), font size, clear chat
4. About: version, licenses, The Squishies credit block

Design language: soft purple/pink pastels (site palette), rounded corners, friendly big text, no jargon anywhere. Aim for "an app a kid opens and instantly feels safe."

## 6. Packaging

- MSIX, x64 (Dell is x64 Xeon)
- App icon set: ALL sizes already generated in repo `assets/icons/`:
  StoreLogo 50, Square30x30, Square44x44, Square71x71, Square150x150, Square310x310, Wide310x150, LargeTile — PNG ready.
- Package identity: `FamilyName=AuntHarley`, `Publisher=CN=JimmyLeeFamily` (align with whatever cert you get — see Signing Guide)
- Release pipeline: build → sign MSIX → attach to GitHub Release with notes
- Versioning: semver, start 0.1.0

## 7. Acceptance Criteria (done = all green)

- [ ] App installs on Trystan's profile without any unsigned warning
- [ ] Chat works against 127.0.0.1:1234 when brain is up
- [ ] App starts on Dell (Xeon, Windows 11) without crashing or admin prompt
- [ ] "Brain offline" state is friendly, not scary
- [ ] All 4 Squishies appear somewhere in the UI (brand!)
- [ ] Full build reproducible from repo on Dell

## 8. Repo Layout (this repo)

```
assets/
  icons/      ← all MSIX logo sizes (DONE)
  mascots/    ← Squishies PNG (DONE)
  pwa/        ← PWA icons + manifest (DONE)
tablet/       ← Trystan's tablet app (DONE): index.html, style.css, chat.js, start_aunt_harley.sh
site/
  index.html  ← GitHub Pages landing (DONE — now at repo root for Pages)
  style.css   ← (DONE)
docs/
  BUILD_SPEC.md   ← this file
  SIGNING.md      ← signing guide
  TABLET.md       ← tablet setup guide
src/
  (WinUI3 code lands here from the Dell)
```