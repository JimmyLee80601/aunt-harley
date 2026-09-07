# SIGNING GUIDE — Aunt Harley MSIX

No half-assing. A kid should never see "Unknown publisher" or a SmartScreen scare. This is the honest menu of how we get there, in order of effort.

## The hard truth first

There is no magic free way to get a fully trusted cert that makes Windows and Microsoft Defender SmartScreen happy everywhere. Options below, cheapest to best.

## Option 1 — Self-signed cert (FREE, works locally, NOT SmartScreen-clean)

Good for: installing on OUR family machines with zero warnings AFTER we trust the cert once.

How (on the Dell, as georg, admin PowerShell):

1. Create a code-signing cert:
```
New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=JimmyLeeFamily" `
  -CertStoreLocation Cert:\CurrentUser\My -NotAfter (Get-Date).AddYears(5)
```
Note the thumbprint, then export it to a PFX:
```
$pwd = ConvertTo-SecureString -String "CHOOSE A STRONG PASSWORD" -Force -AsPlainText
Export-PfxCertificate -Cert Cert:\CurrentUser\My\<THUMBPRINT> -FilePath C:\HarleysPlace\cert\jimmylee-family.pfx -Password $pwd
```
2. Trust it on the target machine (Trystan's profile): import the PFX into
   - Current User > Trusted Root Certification Authorities, and
   - Current User > Trusted Publishers
   Right-click PFX → Install Certificate → Local Machine → pick both stores. Requires admin once.
3. Sign the MSIX (after building):
```
SignTool sign /f C:\HarleysPlace\cert\jimmylee-family.pfx ^
  /p "CHOOSE A STRONG PASSWORD" /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 ^
  "path\to\AuntHarley_0.1.0_x64.msix"
```
4. After that, on OUR machines: no warning, installs clean.
5. On OTHER machines: still unknown publisher. Acceptable for family-only.

Verdict for Trystan-at-home on the family Dell: this is enough. It's honest, free, signed, and clean once we trust the cert once. This is the "do it now" path.

## Option 2 — OV / EV code-signing cert (PAID, ~$200-400/yr, real SmartScreen reputation growth)

For: making the app actually reputable to the world. Requires a registered business or (for EV) quite a lot of paperwork, plus dongle for EV.
Actually doable for a serious family project. If/when Trystan's t-shirt empire funds it, this is the upgrade.

## Option 3 — Microsoft Store submission (BEST for Smart App Control + trust)

For: the absolute cleanest install experience and SAC compatibility. $19 one-time developer account (personal, not business).
- Package the MSIX, upload to Partner Center, Microsoft signs it with the Store cert.
- Install via Store app or via the Store's own sideload links — zero SmartScreen, zero warnings, updates handled.
- SAC (if enabled) treats Store-signed apps as trusted.

This is the "Walmart" level. Long-term goal. The app must be genuinely kid-appropriate (it is) and pass review.

## Smart App Control (SAC) — read this or lose hours

- Dell had SAC issues before (blocked apps; registry fix applied earlier).
- SAC = Windows 11 feature that blocks anything not catalog-signed or Store-signed.
- Self-signed WILL be blocked by SAC, even after trusting the cert in root stores. SAC is not the same as SmartScreen trust store.
- Choices if SAC is ON:
  a. Turn SAC OFF on the family Dell (Settings > Privacy & Security > Windows Security > App & browser control > Smart App Control > Off). ACCEPTABLE for a home machine if everyone knows not to install random stuff — but it reduces protection, and SAC can't be turned back on without a reinstall.
  b. Ship via Microsoft Store so SAC is happy (Option 3).

Decision for the family Dell: whatever we choose for cert, ALSO confirm SAC's state before installing. If Trystan's profile inherits SAC ON and self-signed, it will block Aunt Harley. Check it first.

## Signing checklist (final)

- [ ] Decide Option 1 (now) vs Option 3 (goal)
- [ ] Cert created + PFX exported + password stored safely (HarleysPlace)
- [ ] PFX trusted in Root + Trusted Publishers on Trystan's machine
- [ ] SignTool runs clean on the final MSIX
- [ ] SAC state known; if ON, plan is Store, not self-signed
- [ ] Release attached to GitHub with a timestamped signature

Signed, sealed, delivered — a kid gets an installer with zero scary screens.