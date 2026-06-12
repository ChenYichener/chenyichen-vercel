import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.resolve(process.argv[2] || "");
const docsDir = path.join(sourceDir, "docs");
const outDir = path.join(rootDir, "sites", "english-level-up-tips");
const remoteAssetsDir = path.join(outDir, "assets", "remote");
const tmpDir = path.join(rootDir, ".tmp");
const tmpMarkdown = path.join(tmpDir, "english-guide.md");
const tmpHtml = path.join(tmpDir, "english-guide-fragment.html");

if (!sourceDir || !existsSync(docsDir)) {
  throw new Error("Usage: node scripts/build-english-guide.mjs /path/to/English-level-up-tips");
}

const files = [
  "docs/SUMMARY.md",
  "docs/README.md",
  "docs/threads/part-1/1-understanding.md",
  "docs/threads/part-1/2-vocabulary.md",
  "docs/threads/part-1/3-listening.md",
  "docs/threads/part-1/4-reading.md",
  "docs/threads/part-1/5-speaking.md",
  "docs/threads/part-1/6-writing.md",
  "docs/threads/part-1/7-ai.md",
  "docs/threads/part-2/x-misc.md",
  "docs/threads/part-2/my-story.md",
  "docs/threads/part-4/week-1.md",
  "docs/threads/word-list/Common.md",
  "docs/threads/word-list/Go.md",
  "docs/threads/word-list/Java.md",
  "docs/threads/word-list/JavaScript.md",
  "docs/threads/word-list/PHP.md",
  "docs/threads/word-list/Prompt.md",
  "docs/threads/word-list/Python.md",
  "docs/threads/word-list/Rust.md",
  "docs/threads/word-list/Swift.md",
  "docs/threads/word-list/VibeCoding.md",
  "docs/en/SUMMARY.md",
  "docs/en/README.md",
  "docs/en/threads/part-1/1-understanding.md",
  "docs/en/threads/part-1/2-vocabulary.md",
  "docs/en/threads/part-1/3-listening.md",
  "docs/en/threads/part-1/4-reading.md",
  "docs/en/threads/part-1/5-speaking.md",
  "docs/en/threads/part-1/6-writing.md",
  "docs/en/threads/part-1/7-ai.md",
  "docs/en/threads/part-2/x-misc.md",
  "docs/en/threads/part-4/my-story.md",
  "docs/en/threads/part-4/week-1.md",
];

const discovered = execFileSync("find", [docsDir, "-type", "f", "-name", "*.md"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((file) => path.relative(sourceDir, file));

for (const file of discovered.sort()) {
  if (!files.includes(file)) {
    files.push(file);
  }
}

const sectionIds = new Map(
  files.map((file, index) => [path.normalize(path.join(sourceDir, file)), `source-${String(index + 1).padStart(2, "0")}`]),
);

const navItems = [];
const remoteImageCache = new Map();

const encodeAssetPath = (assetPath) =>
  assetPath
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/");

const downloadCandidates = (url) => {
  const candidates = [url];
  const thumbMatch = url.match(
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/(.+?)\/[^/]+$/,
  );

  if (thumbMatch) {
    candidates.push(`https://upload.wikimedia.org/wikipedia/commons/${thumbMatch[1]}`);
  }

  return candidates;
};

const localizeRemoteImage = (url) => {
  if (remoteImageCache.has(url)) {
    return remoteImageCache.get(url);
  }

  mkdirSync(remoteAssetsDir, { recursive: true });

  for (const candidate of downloadCandidates(url)) {
    try {
      const parsed = new URL(candidate);
      const ext = path.extname(parsed.pathname).slice(0, 12) || ".img";
      const hash = createHash("sha1").update(candidate).digest("hex").slice(0, 12);
      const outputName = `${hash}${ext}`;
      const outputPath = path.join(remoteAssetsDir, outputName);

      if (!existsSync(outputPath)) {
        execFileSync(
          "curl",
          [
            "-L",
            "--fail",
            "--max-time",
            "20",
            "-A",
            "Mozilla/5.0",
            "-e",
            "https://github.com/",
            "-o",
            outputPath,
            candidate,
          ],
          { stdio: "ignore" },
        );
      }

      const localPath = `assets/remote/${encodeURIComponent(outputName)}`;
      remoteImageCache.set(url, localPath);
      return localPath;
    } catch {
      // Keep trying fallback candidates; preserve the original URL if all fail.
    }
  }

  remoteImageCache.set(url, url);
  return url;
};

const rewriteImageUrl = (url, fileDir) => {
  if (/^https?:/i.test(url)) {
    return localizeRemoteImage(url);
  }

  return rewriteUrl(url, fileDir);
};

const rewriteUrl = (url, fileDir) => {
  if (url.startsWith("assets/")) {
    return url;
  }

  if (url.startsWith("#/")) {
    if (url === "#/" || url === "#") {
      const sectionId = sectionIds.get(path.normalize(path.join(sourceDir, "docs/README.md")));
      return sectionId ? `#${sectionId}` : url;
    }

    if (url === "#/en/" || url === "#/en") {
      const sectionId = sectionIds.get(path.normalize(path.join(sourceDir, "docs/en/README.md")));
      return sectionId ? `#${sectionId}` : url;
    }

    const withoutHashRoute = url.slice(2);
    const resolved = path.normalize(path.resolve(docsDir, withoutHashRoute));
    const sectionId = sectionIds.get(resolved);
    return sectionId ? `#${sectionId}` : url;
  }

  if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) {
    return url;
  }

  const [rawPath, hash = ""] = url.split("#");
  const decoded = decodeURIComponent(rawPath);
  const resolved = path.normalize(path.resolve(fileDir, decoded));

  if (rawPath.endsWith(".md")) {
    const sectionId = sectionIds.get(resolved);
    return sectionId ? `#${sectionId}` : url;
  }

  const relativeToDocs = path.relative(docsDir, resolved);
  if (!relativeToDocs.startsWith("..")) {
    return `${encodeAssetPath(relativeToDocs)}${hash ? `#${hash}` : ""}`;
  }

  return url;
};

const preprocessMarkdown = (markdown, file) => {
  const fileDir = path.dirname(path.join(sourceDir, file));
  return markdown
    .replace(/\[(!\[[^\]]*?\]\([^)]+\))\]\(([^)]+)\)/g, (match, image, url) => {
      const rewrittenImage = image.replace(
        /(!\[[^\]]*?\]\()([^)]+)(\))/g,
        (imageMatch, imagePrefix, imageUrl, imageSuffix) =>
          `${imagePrefix}${rewriteImageUrl(imageUrl.trim(), fileDir)}${imageSuffix}`,
      );
      return `[${rewrittenImage}](${rewriteUrl(url.trim(), fileDir)})`;
    })
    .replace(/(!?\[[^\]]*?\]\()([^)]+)(\))/g, (match, prefix, url, suffix) => {
      if (/^<.*>$/.test(url)) {
        return match;
      }
      const nextUrl = prefix.startsWith("![")
        ? rewriteImageUrl(url.trim(), fileDir)
        : rewriteUrl(url.trim(), fileDir);
      return `${prefix}${nextUrl}${suffix}`;
    })
    .replace(/src="([^"]+)"/g, (match, url) => `src="${rewriteImageUrl(url, fileDir)}"`);
};

const getTitle = (markdown, file) => {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (title) {
    return title.replace(/[`*_]/g, "");
  }
  return file.split("/").at(-1).replace(/\.md$/, "");
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

cpSync(path.join(docsDir, "assets"), path.join(outDir, "assets"), { recursive: true });

let combined = "";

for (const [index, file] of files.entries()) {
  const absolute = path.join(sourceDir, file);
  if (!existsSync(absolute)) {
    continue;
  }

  const raw = readFileSync(absolute, "utf8").replace(/^\uFEFF/, "");
  const title = getTitle(raw, file);
  const id = sectionIds.get(path.normalize(absolute)) || `source-${String(index + 1).padStart(2, "0")}`;
  navItems.push({ id, title, file });

  combined += `\n\n<section class="source-section" id="${id}">\n\n`;
  combined += `<span class="source-path">${file}</span>\n\n`;
  combined += preprocessMarkdown(raw, file);
  combined += "\n\n</section>\n\n";
}

writeFileSync(tmpMarkdown, combined);

execFileSync("pandoc", ["-f", "gfm", "-t", "html", "--wrap=none", tmpMarkdown, "-o", tmpHtml], {
  stdio: "inherit",
});

const contentHtml = readFileSync(tmpHtml, "utf8");
const navHtml = navItems
  .map(
    (item) =>
      `<a href="#${item.id}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.file)}</span></a>`,
  )
  .join("\n");

const fullHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>English Level Up Tips | ChenYichen Lab</title>
    <meta name="description" content="A modern single-page reading edition of English-level-up-tips.">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/assets/site.css">
  </head>
  <body class="guide-page">
    <div class="reader-progress" aria-hidden="true"><span data-reader-progress></span></div>
    <header class="site-header">
      <a class="brand" href="/">
        <span class="brand-mark">CY</span>
        <span>ChenYichen Lab</span>
      </a>
      <nav class="top-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="#source-02">Guide</a>
        <a href="#source-23">English</a>
      </nav>
    </header>
    <main class="guide-layout">
      <aside class="reader-toc" aria-label="Table of contents">
        <h2>Reading path</h2>
        ${navHtml}
      </aside>
      <div class="guide-shell">
        <section class="guide-hero">
          <p class="section-label">English Level Up Tips</p>
          <h1>一份可以按节奏读完的英语学习指南。</h1>
          <p>
            本页把 byoungd/English-level-up-tips 中的 Markdown 内容合并成一个可滚动的现代长阅读页面，
            保留中文主线、英文版本、单词表、图片和来源链接，方便直接分享给想系统学习英语的人。
          </p>
          <div class="guide-meta">
            <span>Single-page edition</span>
            <span>Chinese + English</span>
            <span>Mobile ready</span>
            <span>CC BY-NC 4.0 source</span>
          </div>
        </section>
        <article class="content-card">
          <div class="source-note">
            内容来源于
            <a href="https://github.com/byoungd/English-level-up-tips">byoungd/English-level-up-tips</a>
            ，原项目声明采用 Creative Commons Attribution-NonCommercial 4.0 International License。此页面仅做排版整理与静态阅读体验优化，保留原始章节、图片与来源路径。
          </div>
          <div class="markdown-body">
            ${contentHtml}
          </div>
        </article>
      </div>
    </main>
    <script src="/assets/site.js"></script>
  </body>
</html>
`;

writeFileSync(path.join(outDir, "index.html"), fullHtml);
rmSync(tmpDir, { recursive: true, force: true });

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
