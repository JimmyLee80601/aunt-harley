# TABLET SETUP — Aunt Harley on Trystan's Revvl 5G

Dual-target: the Dell gets the WinUI 3 app, the tablet gets this full local experience.
Same persona, same Squishies, different brain size — a kid's tablet can't carry the 7B model,
so she gets a small Qwen 2.5 Vision 3B brain that lives right on the tablet. Still 100% local, still no cloud.

## What you need

- Trystan's Android tablet (T-Mobile Revvl 5G class, Android 10/11)
- ~2.5GB free storage (1.8GB model + 70MB llama.cpp + the app folder)
- WiFi for the ONE-TIME model download (~1.8GB)
- After setup: works fully offline forever

Honest hardware note: if the tablet has 4GB RAM, use the smaller 1.5B model instead
(same steps, file: Qwen2.5-1.5B-Instruct-Q4_K_M.gguf, ~1GB).
Check RAM first: Settings > About tablet. Tell me what it says and I'll confirm the right pick.

## Step 1 — Get the app files onto the tablet

Easiest: on the tablet browser open
  https://github.com/JimmyLee80601/aunt-harley
tap Code > Download ZIP. Unzip to Downloads so you have:
  Downloads/aunt-harley/  (contains tablet/, assets/, docs/)

Or copy the same folder over USB from the Dell / the bench. Same thing.

## Step 2 — Install Termux (from F-Droid, NOT Play Store)

Termux was removed from the Play Store years ago. F-Droid version only:

1. On the tablet browser: f-droid.org  > download F-Droid APK > install it (allow unknown sources when asked)
2. In F-Droid, search "Termux" > install
3. Open Termux once, let it finish its first-time setup

Then grant storage access:
  termux-setup-storage
(accept the permission prompt — this lets Termux read the Downloads folder)

## Step 3 — Install the brain runtime (llama.cpp for Android)

In Termux:

  pkg update && pkg upgrade -y
  pkg install -y curl python
  mkdir -p ~/llama
  cd ~/llama
  curl -L -o llama-android.tar.gz \
    https://github.com/ggml-org/llama.cpp/releases/download/b10830/llama-b10830-bin-android-arm64.tar.gz
  tar -xzf llama-android.tar.gz
  ls  (you should see llama-server among the binaries)
  chmod +x llama-server

## Step 4 — Download her brain (the model, ~1.8GB)

In Termux:

  mkdir -p ~/storage/downloads/models
  cd ~/storage/downloads/models
  curl -L -O \
    https://huggingface.co/unsloth/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf

Grab a drink. This is the big one and it only happens once.
Verify it got the whole file (should be about 1.8GB, same as above).

## Step 5 — One-tap startup

The app folder ships with a starter script:

  cd ~/storage/downloads/aunt-harley/tablet
  bash start_aunt_harley.sh

It launches the brain on port 1234 and the chat page on port 8080.
First boot loads the model into memory — takes 10-30 seconds on a tablet.

## Step 6 — Open her chat and add her to the home screen

1. In the tablet browser (Chrome): go to  http://127.0.0.1:8080/tablet/
2. Chrome menu > "Add to Home screen" > name her "Aunt Harley"
   (works because she's an installable PWA — full screen, looks like a real app)
3. Tap the new home-screen icon anytime. She's yours, offline, forever.

## Step 7 — After every tablet restart

Termux doesn't auto-start on most Androids. Just:
1. Open Termux
2. Run:
     cd ~/storage/downloads/aunt-harley/tablet && bash start_aunt_harley.sh
3. Tap the Aunt Harley home-screen icon

That's it. No accounts, no internet needed, nothing phones home.

## Troubleshooting

- "brain is napping" in the app: Termux isn't running / script wasn't run. Do Step 7.
- Model won't download / dies: free space check (Settings > Storage), try again on WiFi.
- Slow replies: normal-ish on tablet CPUs. 3B Q4 does a few tokens/sec. Kid-pace is fine.
- App shows blank white: open http://127.0.0.1:8080/tablet/ again in Chrome; the home-screen
  shortcut points at the local page, which only exists while Termux is up.

## Nice-to-have: auto-start on boot

Install "Termux:Boot" from F-Droid, then in Termux:

  mkdir -p ~/.termux/boot
  echo 'cd ~/storage/downloads/aunt-harley/tablet && bash start_aunt_harley.sh' > ~/.termux/boot/start_aunt_harley.sh
  chmod +x ~/.termux/boot/start_aunt_harley.sh

She'll wake herself up whenever the tablet boots. Optional — ask dad before installing apps is the house rule for Trystan, so this one's a dad job.