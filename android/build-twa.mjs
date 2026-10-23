// Generates the Android (Trusted Web Activity) project for the Tulpar web app with Bubblewrap's library.
// Run by .github/workflows/android.yml; it then builds, aligns and signs the APK with the runner's Android SDK.
// Usage: node android/build-twa.mjs <outDir> <versionCode>
import { TwaManifest, TwaGenerator, ConsoleLog } from '@bubblewrap/core';

const [outDir = 'twa', versionCode = '1'] = process.argv.slice(2);
const log = new ConsoleLog('twa');

const manifest = await TwaManifest.fromWebManifest('https://tulparapp.com/app/manifest.webmanifest');
manifest.packageId = 'com.tulparapp.app';
manifest.host = 'tulparapp.com';
manifest.startUrl = '/app/';
manifest.name = 'Tulpar';
manifest.launcherName = 'Tulpar';
manifest.themeColor = manifest.themeColor ?? '#00728c';
manifest.navigationColor = '#054a60';
manifest.backgroundColor = manifest.backgroundColor ?? '#eaf5f6';
manifest.display = 'standalone';
manifest.orientation = 'portrait';
manifest.enableNotifications = false;
manifest.fallbackType = 'customtabs';
manifest.appVersionCode = Number(versionCode);
manifest.appVersionName = `1.${versionCode}`;
manifest.signingKey = { path: '../tulpar-release.jks', alias: 'tulpar' };

await new TwaGenerator().createTwaProject(outDir, manifest, log, () => {});
await manifest.saveToFile(`${outDir}/twa-manifest.json`);
log.info(`TWA project written to ${outDir} (versionCode ${versionCode})`);
