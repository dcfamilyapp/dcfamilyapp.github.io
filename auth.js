/* ══════════════════════════════════════════════════════════════
   DC Family — acesso
   Password verdadeira, verificada no Apps Script (Code.gs).
   Uma vez introduzida, o utilizador e a password ficam guardados
   neste dispositivo e a entrada é automática — até se fazer
   logout (Auth.logout()).
   ══════════════════════════════════════════════════════════════ */
const Auth = (() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbxCEdk9deh7WMmT0e66PfQ79-496AEGlfb7L9jHJEEy9XciqzXrvHyh9D5CS_KXB5bMrQ/exec";
  const PIN_KEY  = 'dm_pin';
  const USER_KEY = 'dm_user';

  const b64e = s => btoa(unescape(encodeURIComponent(s)));
  const b64d = s => decodeURIComponent(escape(atob(s)));

  function getStoredPin(){ const v = localStorage.getItem(PIN_KEY); return v ? b64d(v) : null; }
  function setStoredPin(pin){ localStorage.setItem(PIN_KEY, b64e(pin)); }
  function getStoredUser(){ return localStorage.getItem(USER_KEY); }
  function forget(){ localStorage.removeItem(PIN_KEY); localStorage.removeItem(USER_KEY); }

  function logout(){
    forget();
    location.href = './index.html';
  }

  async function verifyPinWithServer(pin, claimedUser){
    try {
      const url = API_URL + '?action=checkpin&pin=' + encodeURIComponent(pin) +
        (claimedUser ? '&claimedUser=' + encodeURIComponent(claimedUser) : '');
      const r = await fetch(url);
      const d = await r.json();
      if (d.ok && d.user) localStorage.setItem(USER_KEY, d.user);
      return d;
    } catch(e){ return { ok:false, error:'Sem ligação à rede.' }; }
  }

  function lockScreenHTML(){
    return `
    <style>
      #dm-lock input{width:100%;box-sizing:border-box;font-size:15px;padding:13px 14px;border-radius:12px;border:1px solid rgba(210,161,58,0.22);background:#0E1219;color:#F2F4F7;font-family:'DM Mono',monospace;transition:border-color .2s,box-shadow .2s}
      #dm-lock input:focus{outline:none;border-color:#D2A13A;box-shadow:0 0 0 3px rgba(210,161,58,0.18),0 0 18px -4px rgba(210,161,58,0.5)}
      #dm-lock .dm-lbl{color:#D2A13A;font-size:10.5px;text-transform:uppercase;letter-spacing:.18em;margin-bottom:8px;font-weight:600}
      #dm-lock .dm-card{position:relative;overflow:hidden;background:radial-gradient(120% 90% at 100% 0%,rgba(210,161,58,0.12),transparent 60%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)),#0E1219;border:1px solid rgba(210,161,58,0.28);border-radius:20px;padding:26px 22px 24px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),0 0 36px -12px rgba(210,161,58,0.45),0 20px 40px -20px #000}
      #dm-lock .dm-card::before{content:'';position:absolute;left:0;right:0;top:0;height:2px;background:#D2A13A;box-shadow:0 0 12px #D2A13A}
      #dm-lock .dm-go:active{transform:scale(.98)}
    </style>
    <div id="dm-lock" style="position:fixed;inset:0;background:#0A0D12;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:'DM Sans',sans-serif">
      <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 40% at 50% 30%,rgba(210,161,58,0.10),transparent 70%)"></div>
      <img src="logo.png" alt="DC Family logo" style="width:260px;height:auto;margin-bottom:26px;position:relative">

      <div class="dm-card" style="width:100%;max-width:300px;position:relative">
        <div class="dm-lbl">Utilizador</div>
        <input id="dm-lock-user" type="text" autocomplete="off" autocapitalize="words" style="margin-bottom:18px">

        <div class="dm-lbl">Password</div>
        <input id="dm-lock-pin" type="password" autocomplete="off" style="margin-bottom:22px">

        <button id="dm-lock-submit" class="dm-go" title="Entrar" aria-label="Entrar" style="width:100%;height:46px;border:none;border-radius:12px;background:linear-gradient(135deg,#F4D27A,#D2A13A);color:#1a1305;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 0 22px -6px rgba(210,161,58,0.7)">
          Entrar
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div id="dm-lock-error" style="color:#FF6B5E;font-size:12.5px;margin-top:14px;min-height:16px;text-align:center;position:relative"></div>

      <button onclick="window.location.href='./demo.html'" style="position:relative;margin-top:20px;background:none;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#5C6576;font-size:12px;font-weight:500;padding:9px 20px;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.02em">
        Ver demonstração →
      </button>
    </div>`;
  }

  function showPasswordScreen(onUnlock){
    document.body.insertAdjacentHTML('beforeend', lockScreenHTML());
    const box       = document.getElementById('dm-lock');
    const userInput = document.getElementById('dm-lock-user');
    const input     = document.getElementById('dm-lock-pin');
    const submit    = document.getElementById('dm-lock-submit');
    const err       = document.getElementById('dm-lock-error');

    const stored = getStoredUser();
    if (stored) userInput.value = stored;
    setTimeout(() => (stored ? input : userInput).focus(), 50);

    async function trySubmit(){
      const name = userInput.value.trim();
      if (!name) { err.textContent = 'Escreve o teu nome.'; userInput.focus(); return; }
      const pin = input.value.trim();
      if (!pin) { err.textContent = 'Introduz a password.'; return; }
      submit.disabled = true; submit.style.opacity = '0.5';
      const res = await verifyPinWithServer(pin, name);
      submit.disabled = false; submit.style.opacity = '1';
      if (!res.ok) {
        err.textContent = res.error || 'Password incorreta.';
        input.value=''; input.focus();
        return;
      }
      setStoredPin(pin);
      box.remove();
      onUnlock(pin);
    }
    submit.onclick = trySubmit;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') trySubmit(); });
    userInput.addEventListener('keydown', e => { if (e.key === 'Enter') input.focus(); });
  }

  // Chamar isto no topo de cada página: Auth.protect(pin => { ...mostra a página... })
  // Se o dispositivo já tem utilizador+password guardados, entra logo,
  // sem perguntar nada — só volta a pedir depois de um logout.
  async function protect(onUnlock){
    const storedPin = getStoredPin();
    if (storedPin) { onUnlock(storedPin); return; }
    showPasswordScreen(onUnlock);
  }

  return { protect, forget, logout, getStoredPin, getStoredUser, API_URL };
})();
