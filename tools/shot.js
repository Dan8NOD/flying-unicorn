// Render the game offscreen and save a PNG (macOS only, no installs):
//   osascript -l JavaScript tools/shot.js out.png "<js to run in the page>" [seconds to wait]
// The JS runs after the page loads, e.g. "mode='solo'; start(4,true)". Used to check art without a browser.
ObjC.import('Cocoa'); ObjC.import('WebKit');
function run(argv) {
  const out = argv[0], js = argv[1] || '', wait = +(argv[2] || 2);
  const cwd = $.NSFileManager.defaultManager.currentDirectoryPath.js;
  const app = $.NSApplication.sharedApplication;
  const cfg = $.WKWebViewConfiguration.alloc.init;
  cfg.preferences.setValueForKey($(true), 'allowFileAccessFromFileURLs');   // lets local images be read back from the canvas
  cfg.setValueForKey($(true), 'allowUniversalAccessFromFileURLs');
  const wv = $.WKWebView.alloc.initWithFrameConfiguration($.NSMakeRect(0, 0, 960, 540), cfg);
  const win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer($.NSMakeRect(-3000, 0, 960, 540), 0, $.NSBackingStoreBuffered, false);
  win.contentView = wv; win.orderFrontRegardless;
  const url = $.NSURL.fileURLWithPath(cwd + '/index.html');
  wv.loadFileURLAllowingReadAccessToURL(url, $.NSURL.fileURLWithPath(cwd));
  const spin = s => { const until = $.NSDate.dateWithTimeIntervalSinceNow(s); while (until.timeIntervalSinceNow > 0) $.NSRunLoop.currentRunLoop.runModeBeforeDate($.NSDefaultRunLoopMode, $.NSDate.dateWithTimeIntervalSinceNow(0.05)); };
  spin(1.5);
  wv.evaluateJavaScriptCompletionHandler('typeof loadAllArt === "function" && loadAllArt()', () => {}); spin(2);   // screenshots may show any chapter
  // Run the caller's setup, step the game by hand (offscreen views don't get animation frames), draw, export the canvas.
  const code = '(function(){ ' + js + '; draw(); return (window.__shot || document.getElementById("c")).toDataURL("image/png"); })()';
  let data = null, err = '';
  wv.evaluateJavaScriptCompletionHandler(code, (r, e) => { if (e && !e.isNil()) err = e.userInfo.js ? JSON.stringify(ObjC.deepUnwrap(e.userInfo)).slice(0, 400) : e.localizedDescription.js; else data = ObjC.unwrap(r); });
  spin(wait);
  let out2 = null;   // async helpers can leave base64 file data in window.__out (e.g. a WAV)
  wv.evaluateJavaScriptCompletionHandler('window.__out || ""', (r, e) => { out2 = r && !r.isNil() ? ObjC.unwrap(r) : ''; }); spin(.5);
  if (out2) { $.NSData.alloc.initWithBase64EncodedStringOptions(out2, 0).writeToFileAtomically(out, true); return 'saved ' + out; }
  if (err) return 'JS error: ' + err;
  if (wv.title.js && wv.title.js !== 'Pink Unicorn') return 'title: ' + wv.title.js;
  if (!data) return 'no image';
  const d = $.NSData.alloc.initWithBase64EncodedStringOptions(data.split(',')[1], 0);
  const saved = d.writeToFileAtomically(out, true);
  return saved ? 'saved ' + out : 'snapshot failed';
}
