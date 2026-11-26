// Builds the Android App Bundle (.aab) that goes to Google Play: stages the game into www/, syncs it
// into android/, runs Gradle's bundleRelease, then says which version came out and whether it is signed.
// Run: npm run android:bundle. docs/google-play.md has the one-time key setup.
import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const android = join(root, 'android');
const windows = process.platform === 'win32';

function run(command, cwd) {
  const done = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (done.status !== 0) {
    console.error(`\n"${command}" failed, so there is no new bundle.`);
    process.exit(done.status || 1);
  }
}

run('npm run android', root);
run(`${windows ? '.\\gradlew.bat' : './gradlew'} bundleRelease`, android);

const bundle = join(android, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const gradle = await readFile(join(android, 'app', 'build.gradle'), 'utf8');
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1];
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const megabytes = ((await stat(bundle)).size / 1e6).toFixed(1);
// A signed bundle carries a signature block (META-INF/<alias>.RSA or .EC). File names sit in the zip
// as plain text, so looking for one is enough to tell.
const signed = /META-INF\/[\w.-]+\.(RSA|EC|DSA)/.test((await readFile(bundle)).toString('latin1'));

console.log(`\nBundle: ${bundle}`);
console.log(`Version ${versionName} (versionCode ${versionCode}), ${megabytes} MB.`);
if (signed) {
  console.log('Signed. Google Play takes each versionCode once: raise it in android/app/build.gradle before the next upload.');
} else {
  console.log('NOT signed: Google Play will refuse this file. Set up the upload key first (docs/google-play.md).');
  process.exitCode = 2;
}
