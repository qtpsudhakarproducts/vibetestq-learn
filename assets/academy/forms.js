/*
 * VibeTestQ — one reliable submit handler for the Google Apps Script forms
 * (demo / contact request, interview evaluation, mentorship application).
 *
 *   VTQForms.init({
 *     form: '#contactForm',                    the <form>
 *     endpoint: 'https://script.google.com/macros/s/…/exec',
 *     token: 'vibe_secure_…',                  sent as vibe_token (as before)
 *     extra: { form_type: 'mentor_application' },
 *     readReply: true,                         false => the script's reply cannot be read (no-cors)
 *     fallbackEmail: 'services@vibetestq.com',
 *     subject: 'Private demo request',
 *     messages: { success: '…' }
 *   });
 *
 * What it guarantees:
 *  - "success" is only shown when the server confirms it (or, for no-cors forms, when the
 *    request was sent — and the wording says "sent", not "recorded");
 *  - on any failure the visitor keeps what they typed, sees why, and gets a ready-made
 *    email so the lead is never lost;
 *  - no double submits, a 20 s timeout, an accessible status message.
 */
(function () {
  'use strict';
  if (window.VTQForms) return;

  var COLORS = { info: '#64748b', ok: '#059669', err: '#dc2626' };
  var TIMEOUT_MS = 20000;

  function init(cfg) {
    var form = document.querySelector(cfg.form);
    if (!form) return;
    var status = form.querySelector('#formStatus') || document.getElementById('formStatus');
    var btn = form.querySelector('[type=submit]');
    var btnHtml = btn ? btn.innerHTML : '';
    var msgs = Object.assign({
      sending: 'Sending your request…',
      success: 'Thank you! Your request has been received. We will contact you soon.',
      sentUnconfirmed: 'Thank you! Your request has been sent. If you do not hear from us within 2 working days, please email us.',
      timeout: 'This is taking longer than expected, so we stopped waiting. Your details are still in the form — please try again.',
      unconfirmed: 'We could not confirm that your request was received.',
    }, cfg.messages || {});
    var busy = false, lastOkKey = '', lastOkAt = 0;

    if (status) { status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); }

    function say(kind, text, html) {
      if (!status) return;
      status.style.display = 'block';
      status.style.color = COLORS[kind];
      if (html) status.innerHTML = html; else status.textContent = text;
    }
    function setBusy(on, label) {
      busy = on;
      if (!btn) return;
      btn.disabled = on;
      if (on) btn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ' + (label || 'Sending…');
      else btn.innerHTML = btnHtml;
    }
    function mailtoHref() {
      var lines = [];
      new FormData(form).forEach(function (v, k) {
        if (k === 'honeypot' || !String(v).trim()) return;
        lines.push(k + ': ' + String(v).trim());
      });
      var body = lines.join('\n');
      if (body.length > 1500) body = body.slice(0, 1500) + '…';
      return 'mailto:' + cfg.fallbackEmail + '?subject=' + encodeURIComponent(cfg.subject || 'Website request') + '&body=' + encodeURIComponent(body);
    }
    function failure(reason) {
      // keep what they typed; explain; give them a way that cannot fail
      var safe = String(reason).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
      say('err', '', safe + ' <a href="' + mailtoHref() + '" style="color:inherit;font-weight:700;text-decoration:underline">Email this request to ' + cfg.fallbackEmail + '</a>, or try again.');
      setBusy(false);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }

      // spam trap: a hidden field a person never fills in
      var hp = form.querySelector('[name=honeypot]');
      if (hp && hp.value) { say('ok', msgs.success); form.reset(); return; }

      var data = new FormData(form);
      var key = Array.from(data.entries()).filter(function (p) { return p[0] !== 'honeypot'; }).map(function (p) { return p[1]; }).join('|');
      if (key === lastOkKey && Date.now() - lastOkAt < 60000) { say('ok', 'We already have this request — thank you.'); return; }

      data.append('vibe_token', cfg.token);
      Object.keys(cfg.extra || {}).forEach(function (k) { data.append(k, cfg.extra[k]); });

      setBusy(true, msgs.sending);
      say('info', msgs.sending);

      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
      var opts = { method: 'POST', body: data, redirect: 'follow' };
      if (!cfg.readReply) opts.mode = 'no-cors';
      if (ctrl) opts.signal = ctrl.signal;

      fetch(cfg.endpoint, opts).then(function (res) {
        if (timer) clearTimeout(timer);
        if (!cfg.readReply) return { result: 'sent' }; // opaque reply: we only know it left the browser
        if (!res.ok) throw new Error('The server answered with an error (' + res.status + ').');
        return res.text().then(function (t) {
          var json = null;
          try { json = JSON.parse(t); } catch (err) { /* not JSON */ }
          if (!json) throw new Error(msgs.unconfirmed);
          return json;
        });
      }).then(function (reply) {
        if (reply.result === 'success' || reply.result === 'sent') {
          lastOkKey = key; lastOkAt = Date.now();
          say('ok', reply.result === 'sent' ? msgs.sentUnconfirmed : msgs.success);
          form.reset();
          if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Sent'; }
          setTimeout(function () { setBusy(false); }, 5000);
          busy = false;
        } else {
          throw new Error(reply.error ? 'The server reported: ' + reply.error : msgs.unconfirmed);
        }
      }).catch(function (err) {
        if (timer) clearTimeout(timer);
        console.error('Form submission error:', err);
        if (err && err.name === 'AbortError') return failure(msgs.timeout);
        if (err instanceof TypeError) return failure(msgs.unconfirmed + ' Please check your connection.');
        failure(err && err.message ? err.message : msgs.unconfirmed);
      });
    });
  }

  window.VTQForms = { init: init };
})();
