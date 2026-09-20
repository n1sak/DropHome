/** The two tiny public pages: a shared file, and the mailbox drop page. */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const size = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

const shell = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { --ink:#232a3d; --paper:#f3f6fa; --panel:#fff; --accent:#2b50d6; --lamp:#ffd36b; --dim:#5a647c; }
  @media (prefers-color-scheme: dark) { :root { --ink:#c9d2ea; --paper:#141a2c; --panel:#1c2338; --accent:#8ea7ff; --dim:#9ca7c2; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px 16px; background:var(--paper); color:var(--ink); font:15px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { width:min(520px,100%); background:var(--panel); border:1.5px solid var(--ink); border-radius:18px 20px 17px 21px / 20px 17px 21px 18px; box-shadow:5px 6px 0 rgba(35,42,61,.25); padding:28px; }
  h1 { margin:0 0 4px; font-size:24px; line-height:1.2; text-wrap:balance; overflow-wrap:anywhere; }
  p { margin:0 0 16px; color:var(--dim); }
  img { display:block; max-width:100%; border-radius:10px; border:1.5px solid var(--ink); margin:0 0 18px; }
  a.btn, button { display:inline-block; font:600 15px system-ui, sans-serif; color:#fff; background:var(--accent); border:1.5px solid var(--ink); border-radius:12px; padding:10px 18px; text-decoration:none; cursor:pointer; box-shadow:2px 2px 0 var(--ink); }
  label { display:block; font-weight:600; margin:14px 0 6px; }
  input[type=text], input[type=file] { width:100%; font:inherit; color:inherit; padding:9px 10px; border:1.5px solid var(--ink); border-radius:10px; background:transparent; }
  .mark { display:inline-block; font-weight:700; background:var(--lamp); color:#4a3800; border-radius:20px; padding:3px 10px; font-size:12px; letter-spacing:.06em; text-transform:uppercase; margin-bottom:14px; }
  #status { margin-top:14px; min-height:1.5em; }
</style></head><body><main>${body}</main></body></html>`;

export function sharePage(file) {
  if (!file) return shell('Nothing here', `<span class="mark">DropHome</span><h1>This link is not active</h1><p>The owner stopped sharing this file, or the link is wrong.</p>`);
  const url = `/share/${encodeURIComponent(file.token)}/file`;
  return shell(
    file.name,
    `<span class="mark">Shared from ${esc(file.house ?? 'a DropHome house')}</span>
     <h1>${esc(file.name)}</h1><p>${size(file.size)}</p>
     ${file.kind === 'image' ? `<img src="${url}" alt="${esc(file.name)}">` : ''}
     <a class="btn" href="${url}?download=1">Download</a>`,
  );
}

export function dropPage(info) {
  if (!info) return shell('Nothing here', `<span class="mark">DropHome</span><h1>This mailbox link is not active</h1><p>Ask the owner for a new one.</p>`);
  return shell(
    `Send files to ${info.house}`,
    `<span class="mark">Mailbox</span>
     <h1>Send files to ${esc(info.house)}</h1>
     <p>They land in the mailbox out front. The owner decides where they go from there.</p>
     <form id="f">
       <label for="from">Your name</label><input id="from" name="from" type="text" maxlength="40" autocomplete="name">
       <label for="files">Files</label><input id="files" name="files" type="file" multiple required>
       <p style="margin-top:18px"><button type="submit">Put them in the mailbox</button></p>
     </form>
     <p id="status" role="status"></p>
     <script>
       const f = document.getElementById('f'), s = document.getElementById('status');
       f.addEventListener('submit', async (e) => {
         e.preventDefault();
         s.textContent = 'Sending...';
         try {
           const r = await fetch(location.pathname, { method: 'POST', body: new FormData(f) });
           const b = await r.json();
           s.textContent = r.ok ? 'Delivered: ' + b.added.join(', ') : (b.error || 'That did not work. Try again.');
           if (r.ok) f.reset();
         } catch { s.textContent = 'Could not reach the house. Check your connection and try again.'; }
       });
     </script>`,
  );
}
