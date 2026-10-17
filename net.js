// Two-device play with no server: a direct WebRTC connection set up by swapping two short codes (once per session).
// Host = runs the game. Guest = sees the game and steers the mermaid. game.js holds the game side (`net`, netSnap, applySnap...).
const RTC_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let pcOffer = null;

const enc = d => btoa(JSON.stringify(d));
const dec = s => JSON.parse(atob(s.replace(/\s+/g, '')));
function waitIce(pc) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const f = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', f); res(); } };
    pc.addEventListener('icegatheringstatechange', f);
    setTimeout(res, 4000);   // good enough: LAN candidates arrive immediately
  });
}
function netReset() {
  try { if (pcOffer) pcOffer.close(); } catch (e) {}
  pcOffer = null; net.open = false; net.role = null; net.remoteTy = null; net.remoteTx = null;
  net.send = net.sendR = () => {};
}
function setupChannel(dc, pc) {
  // 'u' = fast & lossy (game snapshots, steering); 'r' = reliable (taps and pause)
  if (dc.label === 'u') net.send = s => { if (dc.readyState === 'open' && dc.bufferedAmount < 65536) dc.send(s); };
  else net.sendR = s => { if (dc.readyState === 'open') dc.send(s); };
  dc.onmessage = e => {
    let m; try { m = JSON.parse(e.data); } catch (err) { return; }
    if (net.role === 'guest') { if (m.st) applySnap(m); return; }
    if (m.y != null) net.remoteTy = Math.max(30, Math.min(H - 30, +m.y || 0));
    if (m.x != null) net.remoteTx = +m.x || 0;
    if (m.p === 3) dash(p2);
    if (m.p === 1) press();
    if (m.p === 2 && state === 'play') paused = !paused;
  };
  dc.onclose = () => { if (pc === pcOffer && net.open) { netLost(); lobbyStatus(''); } };
  dc.onopen = () => {
    if (net.open) return;
    if (!(pc.__u && pc.__r && pc.__u.readyState === 'open' && pc.__r.readyState === 'open')) return;   // wait for both channels
    net.open = true; hideLobby(); net.ntk = 0;
    if (net.role === 'host') { mode = 'host'; start(0); }
    else { mode = 'guest'; players = [uni, p2]; state = 'title'; trans = null; }
  };
  pc['__' + dc.label] = dc;
  if (dc.readyState === 'open') dc.onopen();   // channels received by the guest may already be open
}
async function hostCreate() {
  netReset(); net.role = 'host';
  const pc = pcOffer = new RTCPeerConnection(RTC_CFG);
  setupChannel(pc.createDataChannel('u', { ordered: false, maxRetransmits: 0 }), pc);
  setupChannel(pc.createDataChannel('r'), pc);
  await pc.setLocalDescription(await pc.createOffer()); await waitIce(pc);
  return enc(pc.localDescription);
}
async function hostAccept(code) { await pcOffer.setRemoteDescription(dec(code)); }
async function guestJoin(code) {
  netReset(); net.role = 'guest';
  const pc = pcOffer = new RTCPeerConnection(RTC_CFG);
  pc.ondatachannel = e => setupChannel(e.channel, pc);
  await pc.setRemoteDescription(dec(code));
  await pc.setLocalDescription(await pc.createAnswer()); await waitIce(pc);
  return enc(pc.localDescription);
}

// ---- lobby screen (plain HTML on top of the canvas) ----
let lobbyEl;
const $ = id => document.getElementById(id);
function lobbyStatus(s) { if ($('lb-status')) $('lb-status').textContent = s; }
function hideLobby() { if (lobbyEl) lobbyEl.style.display = 'none'; }
function copyText(id) {
  const el = $(id); el.select();
  try { navigator.clipboard.writeText(el.value).catch(() => document.execCommand('copy')); } catch (e) { document.execCommand('copy'); }
  lobbyStatus('Copied!');
}
function showLobby() {
  if (typeof RTCPeerConnection === 'undefined') { lobbyMsg = 'This browser cannot do online play'; lobbyT = 200; return; }
  if (!lobbyEl) {
    lobbyEl = document.createElement('div');
    lobbyEl.style.cssText = 'position:fixed;inset:0;z-index:9;background:#2a0f3df2;color:#fff;font:18px/1.4 "Trebuchet MS",sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center;overflow:auto';
    lobbyEl.innerHTML = `<style>#lobby button{font:inherit;font-weight:bold;padding:10px 20px;margin:4px;border:0;border-radius:12px;background:#ff5fc4;color:#fff}#lobby textarea{width:min(92vw,560px);height:70px;font-size:12px;border-radius:8px;border:0;padding:6px}#lobby .box{display:none;flex-direction:column;align-items:center;gap:6px}</style>
      <h2 style="margin:0">Play together on two devices</h2>
      <p style="margin:0;max-width:560px">Open the game on both devices (same Wi-Fi works best). Swap two codes once, by message or copy and paste.</p>
      <div><button id="lb-host">I'm hosting (player 1, unicorn)</button><button id="lb-join">I'm joining (player 2, mermaid)</button></div>
      <div class="box" id="lb-hostbox"><b>1. Send this code to your friend</b><textarea id="lb-offer" readonly></textarea><button id="lb-copy1">Copy</button>
        <b>2. Paste their reply code here</b><textarea id="lb-reply"></textarea><button id="lb-go">Connect</button></div>
      <div class="box" id="lb-joinbox"><b>1. Paste the host's code</b><textarea id="lb-code"></textarea><button id="lb-make">Make my reply code</button>
        <b>2. Send this reply to the host</b><textarea id="lb-answer" readonly></textarea><button id="lb-copy2">Copy</button></div>
      <div id="lb-status" style="min-height:1.4em;color:#fff36b"></div>
      <button id="lb-close" style="background:#7a1a63">Back</button>`;
    lobbyEl.id = 'lobby'; document.body.appendChild(lobbyEl);
    const box = n => { $('lb-hostbox').style.display = n === 'h' ? 'flex' : 'none'; $('lb-joinbox').style.display = n === 'j' ? 'flex' : 'none'; };
    const run = async (fn, msg) => { lobbyStatus(msg); try { await fn(); } catch (e) { lobbyStatus('Something went wrong: ' + (e && e.message || e)); } };
    $('lb-host').onclick = () => { box('h'); run(async () => { $('lb-offer').value = ''; $('lb-offer').value = await hostCreate(); lobbyStatus('Send the code, then paste the reply below.'); }, 'Making your code...'); };
    $('lb-join').onclick = () => { box('j'); netReset(); lobbyStatus(''); };
    $('lb-copy1').onclick = () => copyText('lb-offer');
    $('lb-copy2').onclick = () => copyText('lb-answer');
    $('lb-go').onclick = () => run(async () => { await hostAccept($('lb-reply').value); lobbyStatus('Connecting...'); }, 'Connecting...');
    $('lb-make').onclick = () => run(async () => { $('lb-answer').value = await guestJoin($('lb-code').value); lobbyStatus('Send the reply to the host. You will connect automatically.'); }, 'Making your reply...');
    $('lb-close').onclick = () => { if (!net.open) netReset(); hideLobby(); };
  }
  lobbyEl.style.display = 'flex'; lobbyStatus('');
}
