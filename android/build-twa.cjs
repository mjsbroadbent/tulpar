// Generates the Android (Trusted Web Activity) project for the Tulpar web app with Bubblewrap's library.
// Run by .github/workflows/android.yml; it then builds, aligns and signs the APK with the runner's Android SDK.
// Usage: node android/build-twa.cjs <outDir> <versionCode>
const core = require('@bubblewrap/core');

function fail(e) {
  // annotations show in the run summary even when logs can't be opened
  const msg = String((e && e.stack) || e).split('\n').slice(0, 6).join(' | ');
  console.log(`::error title=TWA generation failed::${msg}`);
  process.exit(1);
}

(async () => {
  const [outDir = 'twa', versionCode = '1'] = process.argv.slice(2);
  const { TwaManifest, TwaGenerator, ConsoleLog } = core;
  console.log('bubblewrap core exports:', Object.keys(core).join(', '));
  const log = ConsoleLog ? new ConsoleLog('twa') : console;

  const manifest = await TwaManifest.fromWebManifest('https://tulparapp.com/app/manifest.webmanifest');
  manifest.packageId = 'com.tulparapp.app';
  manifest.host = 'tulparapp.com';
  manifest.startUrl = '/app/';
  manifest.name = 'Tulpar';
  manifest.launcherName = 'Tulpar';
  manifest.display = 'standalone';
  manifest.orientation = 'portrait';
  manifest.enableNotifications = false;
  manifest.fallbackType = 'customtabs';
  manifest.appVersionCode = Number(versionCode);
  manifest.appVersionName = `1.${versionCode}`;
  manifest.signingKey = { path: '../tulpar-release.jks', alias: 'tulpar' };
  const v = manifest.validate ? manifest.validate() : null;
  if (v) throw new Error(`twa-manifest invalid: ${v}`);

  await new TwaGenerator().createTwaProject(outDir, manifest, log, () => {});
  await manifest.saveToFile(`${outDir}/twa-manifest.json`);
  console.log(`TWA project written to ${outDir} (versionCode ${versionCode})`);
})().catch(fail);
