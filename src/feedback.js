(() => {
  const BUTTON_ID = 'crxFeedbackButton';
  const DIALOG_ID = 'crxFeedbackDialog';
  const MAX_MESSAGE_LENGTH = 1500;
  const COOLDOWN_MS = 30_000;
  let lastSentAt = 0;

  const endpoint = () => String(
    window.__CRX_FEEDBACK_ENDPOINT__ ||
    document.querySelector('meta[name="crx-feedback-endpoint"]')?.content ||
    ''
  ).trim();

  const escapeText = value => String(value ?? '').trim();

  function currentContext() {
    const heading = document.querySelector('main h1, main h2')?.textContent?.trim() || document.title;
    return {
      page: location.href,
      view: heading,
      version: String(window.__CRX_SITE_VERSION || 'unknown'),
    };
  }

  function ensureUi() {
    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.className = 'feedback-fab';
    button.type = 'button';
    button.textContent = 'Report issue / Feedback';
    button.setAttribute('aria-haspopup', 'dialog');

    const dialog = document.createElement('dialog');
    dialog.id = DIALOG_ID;
    dialog.className = 'feedback-dialog';
    dialog.innerHTML = `
      <form method="dialog" class="feedback-card" novalidate>
        <div class="feedback-head">
          <div>
            <span class="feedback-kicker">CARD RNG EXPANSION</span>
            <h2>Report issue / Feedback</h2>
          </div>
          <button class="feedback-close" type="button" aria-label="Close feedback form">×</button>
        </div>
        <label class="feedback-field">
          <span>Type</span>
          <select name="category">
            <option value="Incorrect data">Incorrect data</option>
            <option value="Does not work">Does not work</option>
            <option value="Battle bug">Battle calculation bug</option>
            <option value="Site bug">Site / UI bug</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label class="feedback-field">
          <span>Message</span>
          <textarea name="message" maxlength="${MAX_MESSAGE_LENGTH}" rows="7" placeholder="Tell me what is wrong or what should be changed…" required></textarea>
          <small><b data-feedback-count>0</b> / ${MAX_MESSAGE_LENGTH}</small>
        </label>
        <div class="feedback-status" role="status" aria-live="polite"></div>
        <div class="feedback-actions">
          <button type="button" class="feedback-cancel">Cancel</button>
          <button type="submit" class="feedback-submit">Send feedback</button>
        </div>
      </form>
    `;

    document.body.append(button, dialog);

    const form = dialog.querySelector('form');
    const message = form.elements.message;
    const status = dialog.querySelector('.feedback-status');
    const submit = dialog.querySelector('.feedback-submit');
    const count = dialog.querySelector('[data-feedback-count]');

    const close = () => {
      if (dialog.open) dialog.close();
      status.textContent = '';
    };

    button.addEventListener('click', () => {
      status.textContent = '';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      message.focus();
    });

    dialog.querySelector('.feedback-close').addEventListener('click', close);
    dialog.querySelector('.feedback-cancel').addEventListener('click', close);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) close();
    });

    message.addEventListener('input', () => {
      count.textContent = String(message.value.length);
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const target = endpoint();
      const text = escapeText(message.value);
      if (!text) {
        status.textContent = 'Write a message first.';
        message.focus();
        return;
      }
      if (!target) {
        status.textContent = 'Feedback delivery is not configured yet.';
        return;
      }

      const now = Date.now();
      const remaining = COOLDOWN_MS - (now - lastSentAt);
      if (remaining > 0) {
        status.textContent = `Please wait ${Math.ceil(remaining / 1000)}s before sending again.`;
        return;
      }

      submit.disabled = true;
      status.textContent = 'Sending…';
      try {
        const payload = {
          category: escapeText(form.elements.category.value),
          message: text.slice(0, MAX_MESSAGE_LENGTH),
          ...currentContext(),
        };
        const response = await fetch(target, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        lastSentAt = Date.now();
        message.value = '';
        count.textContent = '0';
        status.textContent = 'Sent. Thanks for the report.';
        window.setTimeout(close, 900);
      } catch (error) {
        console.error('[feedback] send failed', error);
        status.textContent = 'Could not send feedback. Try again later.';
      } finally {
        submit.disabled = false;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUi, { once: true });
  else ensureUi();
})();
