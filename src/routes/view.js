import { prisma } from '../lib/prisma.js'
import { now } from '../utils/time.js'
import escapeHTML from 'escape-html'

export function viewRoutes(app) {
  app.get("/p/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const currentTime = now(req);

      const paste = await prisma.paste.findUnique({ where: { id } })
      if (!paste) {
        return res.status(404).send(errorPage("Paste not found"))
      }

      if (paste.expiresAt && currentTime >= paste.expiresAt) {
        return res.status(404).send(errorPage("paste has expired"))
      }

      if (paste.maxViews !== null && paste.viewCount >= paste.maxViews) {
        return res.status(404).send(errorPage("Paste view limit exceeded"))
      }

      const updatedPaste = await prisma.paste.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      let remainingViews = null;
      if (updatedPaste.maxViews !== null) {
        remainingViews = updatedPaste.maxViews - updatedPaste.viewCount;
      }

      res.send(pastePage(updatedPaste.content, remainingViews, updatedPaste.expiresAt))


    } catch (error) {

      console.error('Error viewing paste:', error)
      res.status(500).send(errorPage("Internal server error"))

    }
  })
}


function pastePage(content, remainingViews, expiresAt) {
  const escapedContent = escapeHTML(content);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paste - Pastebin Lite</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; padding: 20px; color: #e0e0e0; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 20px; color: #4ecca3; }
    .meta { display: flex; gap: 20px; margin-bottom: 15px; font-size: 0.9rem; color: #aaa; }
    .content { background: #0f0f1a; border-radius: 10px; padding: 20px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Fira Code', 'Consolas', monospace; line-height: 1.6; border: 1px solid #4ecca3; }
    a { color: #4ecca3; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: block; text-align: center; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📋 Pastebin Lite</h1>
    <div class="meta">
      ${remainingViews !== null ? `<span>Views remaining: ${remainingViews}</span>` : ""}
      ${expiresAt ? `<span>Expires: ${new Date(expiresAt).toLocaleString()}</span>` : ""}
    </div>
    <pre class="content">${escapedContent}</pre>
    <a class="back" href="/">← Create new paste</a>
  </div>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Pastebin Lite</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #e0e0e0; }
    .error { text-align: center; }
    h1 { color: #ff6b6b; margin-bottom: 15px; }
    a { color: #4ecca3; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="error">
    <h1>404</h1>
    <p>${escapeHTML(message)}</p>
    <p style="margin-top: 20px;"><a href="/">← Create new paste</a></p>
  </div>
</body>
</html>`;
}