import http from "node:http";
import { MongoClient, ObjectId } from "mongodb";

const PORT = Number(process.env.DB_UI_PORT ?? 8081);
const URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/smart-parking";
const DB_NAME =
  process.env.DB_NAME ??
  (new URL(URI).pathname.replace(/^\//, "") || "smart-parking");

const client = new MongoClient(URI);
await client.connect();
const db = client.db(DB_NAME);

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body, null, 2));
}

function html(res, body) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

function serialize(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (v instanceof ObjectId) return v.toString();
      if (v instanceof Date) return v.toISOString();
      return v;
    }),
  );
}

function reviveDocument(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Document must be a JSON object");
  }

  const doc = structuredClone(input);
  if (doc._id != null) {
    if (!ObjectId.isValid(String(doc._id))) {
      throw new Error("Invalid _id");
    }
    doc._id = new ObjectId(String(doc._id));
  }

  for (const key of ["createdAt", "updatedAt", "startDate", "endDate", "entryTime", "exitTime", "recordedAt", "lastSeenAt"]) {
    if (typeof doc[key] === "string" && !Number.isNaN(Date.parse(doc[key]))) {
      doc[key] = new Date(doc[key]);
    }
  }

  return doc;
}

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ParkEase DB · ${DB_NAME}</title>
  <style>
    :root {
      --bg: #f3f5fa; --card: #fff; --navy: #0b2e59; --blue: #005daa;
      --red: #891635; --muted: #627d98; --border: #e2e7f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: Inter, system-ui, sans-serif; color: var(--navy); min-height: 100vh;
      background:
        radial-gradient(900px 400px at 10% -10%, rgba(0,93,170,.12), transparent 55%),
        radial-gradient(700px 320px at 90% 0%, rgba(137,22,53,.08), transparent 50%),
        var(--bg);
    }
    header {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 18px 24px; border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,.85); position: sticky; top: 0; z-index: 5;
    }
    h1 { margin: 0; font-size: 20px; } h1 span { color: var(--red); }
    .meta { color: var(--muted); font-size: 13px; }
    main { display: grid; grid-template-columns: 240px 1fr; gap: 16px; padding: 20px; max-width: 1400px; margin: 0 auto; }
    aside, section {
      background: var(--card); border: 1px solid var(--border); border-radius: 16px;
      box-shadow: 0 4px 20px rgba(11,46,89,.04);
    }
    aside { padding: 14px; height: fit-content; position: sticky; top: 84px; }
    aside h2 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); }
    .col {
      display: block; width: 100%; text-align: left; border: 0; background: transparent;
      padding: 10px 12px; border-radius: 10px; cursor: pointer; color: var(--navy); font-weight: 600; font-size: 14px;
    }
    .col:hover { background: #eef2f8; }
    .col.active { background: var(--blue); color: #fff; }
    section { padding: 18px; min-height: 70vh; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .toolbar h2 { margin: 0; font-size: 18px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    button.btn {
      border: 1px solid var(--border); background: #fff; color: var(--navy);
      border-radius: 10px; padding: 8px 12px; font-weight: 600; cursor: pointer; font-size: 13px;
    }
    button.btn.primary { background: var(--blue); border-color: var(--blue); color: #fff; }
    button.btn.danger { background: #fff; border-color: #fecaca; color: var(--red); }
    .docs { display: grid; gap: 12px; }
    .doc {
      border: 1px solid var(--border); border-radius: 14px; background: #fbfcfe; overflow: hidden;
    }
    .doc-head {
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
      padding: 10px 12px; background: #eef2f8; border-bottom: 1px solid var(--border);
    }
    .doc-id { font-size: 12px; color: var(--muted); word-break: break-all; }
    .doc pre {
      margin: 0; padding: 12px; font-size: 12.5px; line-height: 1.5; overflow: auto; max-height: 280px;
    }
    .empty { color: var(--muted); padding: 24px 0; }
    .toast {
      position: fixed; right: 18px; bottom: 18px; background: var(--navy); color: #fff;
      padding: 10px 14px; border-radius: 10px; font-size: 13px; display: none; z-index: 40;
    }
    .toast.show { display: block; }
    .toast.error { background: var(--red); }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(11,46,89,.45); display: none;
      align-items: center; justify-content: center; padding: 20px; z-index: 30;
    }
    .modal-backdrop.open { display: flex; }
    .modal {
      width: min(760px, 100%); background: #fff; border-radius: 16px; border: 1px solid var(--border);
      box-shadow: 0 20px 50px rgba(11,46,89,.25); overflow: hidden;
    }
    .modal header {
      position: static; background: #fff; padding: 14px 16px;
    }
    .modal .body { padding: 0 16px 16px; }
    textarea {
      width: 100%; min-height: 360px; border: 1px solid var(--border); border-radius: 12px;
      padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px;
      line-height: 1.5; color: var(--navy); resize: vertical;
    }
    .modal .foot { display: flex; justify-content: flex-end; gap: 8px; padding: 0 16px 16px; }
    @media (max-width: 800px) {
      main { grid-template-columns: 1fr; }
      aside { position: static; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1><span>VN</span>▸UK · ParkEase DB</h1>
      <div class="meta">Database: <strong>${DB_NAME}</strong> · editable</div>
    </div>
    <div class="meta" id="status">Loading…</div>
  </header>
  <main>
    <aside>
      <h2>Collections</h2>
      <div id="collections"></div>
    </aside>
    <section>
      <div class="toolbar">
        <h2 id="title">Select a collection</h2>
        <div class="actions">
          <button class="btn" id="refresh">Refresh</button>
          <button class="btn primary" id="add" disabled>+ Add document</button>
        </div>
      </div>
      <div id="content" class="empty">Choose a collection on the left.</div>
    </section>
  </main>

  <div class="modal-backdrop" id="modal">
    <div class="modal">
      <header>
        <h1 id="modalTitle" style="font-size:16px">Edit document</h1>
        <button class="btn" id="closeModal">Close</button>
      </header>
      <div class="body">
        <textarea id="editor" spellcheck="false"></textarea>
      </div>
      <div class="foot">
        <button class="btn danger" id="deleteBtn" style="margin-right:auto;display:none">Delete</button>
        <button class="btn" id="cancelBtn">Cancel</button>
        <button class="btn primary" id="saveBtn">Save</button>
      </div>
    </div>
  </div>
  <div class="toast" id="toast"></div>

  <script>
    let current = null;
    let mode = 'edit'; // edit | create
    let editingId = null;
    const colsEl = document.getElementById('collections');
    const contentEl = document.getElementById('content');
    const titleEl = document.getElementById('title');
    const statusEl = document.getElementById('status');
    const addBtn = document.getElementById('add');
    const modal = document.getElementById('modal');
    const editor = document.getElementById('editor');
    const modalTitle = document.getElementById('modalTitle');
    const deleteBtn = document.getElementById('deleteBtn');
    const toast = document.getElementById('toast');

    function showToast(message, isError) {
      toast.textContent = message;
      toast.className = 'toast show' + (isError ? ' error' : '');
      setTimeout(() => { toast.className = 'toast'; }, 2200);
    }

    function escapeHtml(str) {
      return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    }

    async function api(path, options) {
      const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    }

    async function loadCollections() {
      const data = await api('/api/collections');
      colsEl.innerHTML = '';
      data.collections.forEach((name) => {
        const btn = document.createElement('button');
        btn.className = 'col' + (current === name ? ' active' : '');
        btn.textContent = name + ' (' + data.counts[name] + ')';
        btn.onclick = () => loadCollection(name);
        colsEl.appendChild(btn);
      });
      statusEl.textContent = data.collections.length + ' collections';
    }

    async function loadCollection(name) {
      current = name;
      titleEl.textContent = name;
      addBtn.disabled = false;
      contentEl.className = 'empty';
      contentEl.textContent = 'Loading…';
      await loadCollections();
      const data = await api('/api/collections/' + encodeURIComponent(name));
      if (!data.documents.length) {
        contentEl.className = 'empty';
        contentEl.textContent = 'No documents. Click “+ Add document”.';
        return;
      }
      contentEl.className = 'docs';
      contentEl.innerHTML = data.documents.map((doc) => {
        const id = doc._id;
        const pretty = escapeHtml(JSON.stringify(doc, null, 2));
        return '<article class="doc">' +
          '<div class="doc-head"><span class="doc-id">_id: ' + escapeHtml(String(id)) + '</span>' +
          '<div class="actions">' +
          '<button class="btn" data-edit="' + escapeHtml(String(id)) + '">Edit</button>' +
          '<button class="btn danger" data-del="' + escapeHtml(String(id)) + '">Delete</button>' +
          '</div></div><pre>' + pretty + '</pre></article>';
      }).join('');

      contentEl.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.onclick = () => {
          const doc = data.documents.find((d) => String(d._id) === btn.dataset.edit);
          openEdit(doc);
        };
      });
      contentEl.querySelectorAll('[data-del]').forEach((btn) => {
        btn.onclick = () => removeDoc(btn.dataset.del);
      });
    }

    function openEdit(doc) {
      mode = 'edit';
      editingId = String(doc._id);
      modalTitle.textContent = 'Edit document';
      deleteBtn.style.display = 'inline-flex';
      editor.value = JSON.stringify(doc, null, 2);
      modal.classList.add('open');
    }

    function openCreate() {
      mode = 'create';
      editingId = null;
      modalTitle.textContent = 'Add document';
      deleteBtn.style.display = 'none';
      editor.value = JSON.stringify({ name: '', }, null, 2);
      modal.classList.add('open');
    }

    function closeModal() {
      modal.classList.remove('open');
    }

    async function saveDoc() {
      try {
        const parsed = JSON.parse(editor.value);
        if (mode === 'create') {
          await api('/api/collections/' + encodeURIComponent(current), {
            method: 'POST',
            body: JSON.stringify({ document: parsed }),
          });
          showToast('Document created');
        } else {
          await api('/api/collections/' + encodeURIComponent(current) + '/' + encodeURIComponent(editingId), {
            method: 'PUT',
            body: JSON.stringify({ document: parsed }),
          });
          showToast('Document saved');
        }
        closeModal();
        await loadCollection(current);
      } catch (err) {
        showToast(err.message || 'Save failed', true);
      }
    }

    async function removeDoc(id) {
      if (!confirm('Delete this document?')) return;
      try {
        await api('/api/collections/' + encodeURIComponent(current) + '/' + encodeURIComponent(id), {
          method: 'DELETE',
        });
        showToast('Document deleted');
        closeModal();
        await loadCollection(current);
      } catch (err) {
        showToast(err.message || 'Delete failed', true);
      }
    }

    document.getElementById('refresh').onclick = () => current ? loadCollection(current) : loadCollections();
    addBtn.onclick = openCreate;
    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('cancelBtn').onclick = closeModal;
    document.getElementById('saveBtn').onclick = saveDoc;
    deleteBtn.onclick = () => editingId && removeDoc(editingId);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    loadCollections();
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const method = req.method ?? "GET";

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    if (url.pathname === "/" && method === "GET") {
      return html(res, page);
    }

    if (url.pathname === "/api/collections" && method === "GET") {
      const collections = (await db.listCollections().toArray())
        .map((c) => c.name)
        .sort();
      const counts = {};
      for (const name of collections) {
        counts[name] = await db.collection(name).countDocuments();
      }
      return json(res, 200, { database: DB_NAME, collections, counts });
    }

    const listMatch = url.pathname.match(/^\/api\/collections\/([^/]+)$/);
    if (listMatch) {
      const name = decodeURIComponent(listMatch[1]);

      if (method === "GET") {
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
        const documents = await db
          .collection(name)
          .find({})
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();
        return json(res, 200, {
          collection: name,
          count: documents.length,
          documents: serialize(documents),
        });
      }

      if (method === "POST") {
        const body = await readBody(req);
        const doc = reviveDocument(body.document ?? body);
        if (!doc._id) {
          delete doc._id;
        }
        const result = await db.collection(name).insertOne(doc);
        const created = await db.collection(name).findOne({ _id: result.insertedId });
        return json(res, 201, { document: serialize(created) });
      }
    }

    const docMatch = url.pathname.match(/^\/api\/collections\/([^/]+)\/([^/]+)$/);
    if (docMatch) {
      const name = decodeURIComponent(docMatch[1]);
      const id = decodeURIComponent(docMatch[2]);
      if (!ObjectId.isValid(id)) {
        return json(res, 400, { error: "VALIDATION_ERROR", message: "Invalid document id" });
      }
      const objectId = new ObjectId(id);

      if (method === "PUT") {
        const body = await readBody(req);
        const doc = reviveDocument(body.document ?? body);
        delete doc._id;
        const result = await db.collection(name).findOneAndUpdate(
          { _id: objectId },
          { $set: doc },
          { returnDocument: "after" },
        );
        if (!result) {
          return json(res, 404, { error: "NOT_FOUND", message: "Document not found" });
        }
        return json(res, 200, { document: serialize(result) });
      }

      if (method === "DELETE") {
        const result = await db.collection(name).deleteOne({ _id: objectId });
        if (result.deletedCount === 0) {
          return json(res, 404, { error: "NOT_FOUND", message: "Document not found" });
        }
        return json(res, 200, { success: true });
      }
    }

    json(res, 404, { error: "NOT_FOUND", message: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.includes("JSON") || message.includes("Invalid") ? 400 : 500;
    json(res, status, {
      error: status === 400 ? "VALIDATION_ERROR" : "INTERNAL_ERROR",
      message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`DB UI ready → http://localhost:${PORT}`);
  console.log(`Database: ${DB_NAME} (edit / add / delete enabled)`);
});

process.on("SIGINT", async () => {
  await client.close();
  process.exit(0);
});
