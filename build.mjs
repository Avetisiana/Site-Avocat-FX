import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');
const { marked } = require('marked');

// ─── Category config ──────────────────────────────────────────────────────────

const CATS = {
  penal: {
    label: 'Pénal',
    color: 'rgba(220,80,60,1)',
    bg: 'rgba(220,80,60,.07)',
    border: 'rgba(220,80,60,.3)',
    glow: 'rgba(220,80,60,.04)',
  },
  famille: {
    label: 'Famille',
    color: 'rgba(100,160,220,1)',
    bg: 'rgba(100,160,220,.07)',
    border: 'rgba(100,160,220,.3)',
    glow: 'rgba(100,160,220,.04)',
  },
  crypto: {
    label: 'Cryptomonnaies',
    color: 'var(--or-pale)',
    bg: 'rgba(196,160,64,.07)',
    border: 'rgba(196,160,64,.3)',
    glow: 'rgba(196,160,64,.05)',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Convert markdown body into { tocLinks, sectionsHtml }
// Each ## heading becomes a section div with a scroll-spy id.
// Blockquotes become styled highlight boxes.
function processBody(markdown) {
  const parts = markdown.split(/^## /m);
  const preamble = parts[0].trim();
  const sections = parts.slice(1);

  let tocLinks = '';
  let sectionsHtml = '';

  if (preamble) {
    sectionsHtml += postProcess(marked.parse(preamble));
  }

  sections.forEach((section, i) => {
    const newline = section.indexOf('\n');
    const heading = newline === -1 ? section.trim() : section.slice(0, newline).trim();
    const body = newline === -1 ? '' : section.slice(newline + 1);
    const id = slugify(heading);

    tocLinks += `      <a href="#${id}" class="toc-link${i === 0 ? ' active' : ''}">${heading}</a>\n`;
    sectionsHtml += `
    <div class="article-section" id="${id}">
      <h2 class="section-title">${heading}</h2>
      ${postProcess(marked.parse(body))}
    </div>`;
  });

  return { tocLinks: tocLinks.trimEnd(), sectionsHtml };
}

// Convert blockquotes to highlight-box divs
// > **Titre du cadre**
// > Texte du cadre
function postProcess(html) {
  return html.replace(
    /<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>/g,
    (_, content) => {
      const titleMatch = content.match(/^<strong>(.*?)<\/strong>\s*/);
      if (titleMatch) {
        const title = titleMatch[1];
        const body = content.replace(/^<strong>.*?<\/strong>\s*/, '').trim();
        return `<div class="highlight-box"><div class="highlight-box-title">${title}</div><p>${body}</p></div>`;
      }
      return `<div class="highlight-box"><p>${content}</p></div>`;
    }
  );
}

// ─── Shared nav HTML ──────────────────────────────────────────────────────────

const NAV_PHONE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81A16 16 0 0 0 15.19 16l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

function buildNav(activeLink) {
  return `
<nav id="navbar">
  <a href="index.html"><img src="brand_assets/LF Logo.png" alt="Cabinet LAPERONNIE" class="nav-logo" /></a>
  <ul class="nav-links">
    <li class="nav-item-has-drop">
      <a href="index.html#expertise">Expertise <span class="drop-chevron"></span></a>
      <div class="nav-dropdown">
        <a href="droit-penal.html">Droit Pénal</a>
        <a href="droit-famille.html">Droit de la Famille</a>
        <a href="cryptomonnaies.html">Cryptomonnaies</a>
      </div>
    </li>
    <li><a href="index.html#about">Le Cabinet</a></li>
    <li><a href="index.html#valeurs">Valeurs</a></li>
    <li><a href="cases.html"${activeLink === 'cases' ? ' class="active"' : ''}>Affaires</a></li>
    <li><a href="blog.html"${activeLink === 'blog' ? ' class="active"' : ''}>Actualités</a></li>
    <li><a href="index.html#contact">Contact</a></li>
  </ul>
  <div class="nav-cta-group">
    <a href="tel:+33545383009" class="nav-phone">${NAV_PHONE_SVG}<span>05 45 38 30 09</span></a>
    <a href="index.html#contact" class="btn-rdv">Prendre rendez-vous</a>
  </div>
  <button class="hamburger" id="hamburger" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
</nav>

<div class="mob-nav" id="mob-nav" role="dialog" aria-modal="true">
  <img src="brand_assets/LF Logo.png" alt="Cabinet LAPERONNIE" class="mob-nav-logo" />
  <ul class="mob-nav-links">
    <li><a href="droit-penal.html" class="mob-close">Droit Pénal</a></li>
    <li><a href="droit-famille.html" class="mob-close">Droit de la Famille</a></li>
    <li><a href="cryptomonnaies.html" class="mob-close">Cryptomonnaies</a></li>
    <li><a href="cases.html" class="mob-close${activeLink === 'cases' ? ' active' : ''}">Affaires</a></li>
    <li><a href="blog.html" class="mob-close${activeLink === 'blog' ? ' active' : ''}">Actualités</a></li>
    <li><a href="index.html#contact" class="mob-close">Contact</a></li>
  </ul>
  <div class="mob-nav-divider"></div>
  <a href="tel:+33545383009" class="mob-nav-phone mob-close">05 45 38 30 09</a>
</div>`;
}

// ─── Shared footer HTML ───────────────────────────────────────────────────────

const FOOTER = `
<footer>
  <div class="footer-grid">
    <div>
      <img src="brand_assets/LF Logo.png" alt="Cabinet LAPERONNIE" class="footer-logo" />
      <p class="footer-blurb">Cabinet d'avocat fondé sur l'excellence, l'éthique et un engagement total envers chaque client. Angoulême et ses environs.</p>
    </div>
    <div>
      <p class="f-col-title">Expertise</p>
      <ul class="f-links">
        <li><a href="droit-penal.html">Droit Pénal</a></li>
        <li><a href="droit-famille.html">Droit de la Famille</a></li>
        <li><a href="cryptomonnaies.html">Cryptomonnaies</a></li>
      </ul>
    </div>
    <div>
      <p class="f-col-title">Cabinet</p>
      <ul class="f-links">
        <li><a href="index.html#about">À propos</a></li>
        <li><a href="index.html#valeurs">Nos valeurs</a></li>
        <li><a href="cases.html">Affaires</a></li>
        <li><a href="blog.html">Actualités</a></li>
      </ul>
    </div>
    <div>
      <p class="f-col-title">Contact</p>
      <ul class="f-links">
        <li><a href="index.html#contact">Prendre rendez-vous</a></li>
        <li><a href="https://www.google.com/maps?q=45.648866470828835,0.15478420855165548&z=18" target="_blank" rel="noopener">14 Rue d'Arcole, 16000 Angoulême</a></li>
        <li><a href="tel:+33545383009">05 45 38 30 09</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p class="footer-copy">© 2026 Cabinet d'Avocat LAPERONNIE — François-Xavier LAPERONNIE. Tous droits réservés.</p>
    <div class="footer-legal"><a href="#">Mentions légales</a><a href="#">Confidentialité</a><a href="#">RGPD</a></div>
  </div>
</footer>`;

// ─── Shared mob CTA bar ───────────────────────────────────────────────────────

const MOB_CTA = `
<div class="mob-cta-bar">
  <a href="tel:+33545383009" class="mob-cta-call">${NAV_PHONE_SVG}Appeler</a>
  <a href="index.html#contact" class="mob-cta-rdv">Prendre rendez-vous</a>
</div>`;

// ─── Shared JS ────────────────────────────────────────────────────────────────

const SHARED_JS = `
<script>
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 70); }, { passive: true });
  const hamburger = document.getElementById('hamburger');
  const mobNav = document.getElementById('mob-nav');
  if (hamburger && mobNav) {
    hamburger.addEventListener('click', () => { const o = mobNav.classList.toggle('open'); hamburger.classList.toggle('open', o); document.body.style.overflow = o ? 'hidden' : ''; });
    document.querySelectorAll('.mob-close').forEach(el => el.addEventListener('click', () => { mobNav.classList.remove('open'); hamburger.classList.remove('open'); document.body.style.overflow = ''; }));
  }
</script>`;

// ─── Shared CSS (nav + footer + utils) ───────────────────────────────────────

const SHARED_CSS = `
    :root { --charbon:#060504; --charbon-mid:#0D0B09; --charbon-light:#161310; --charbon-card:#100D0B; --or:#C4A040; --or-pale:#D4B252; --or-dark:#9A7A26; --blanc:#F2EDE4; --blanc-dim:#C0BAB0; --gris:#787068; }
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { background:var(--charbon); color:var(--blanc); font-family:'Montserrat',sans-serif; overflow-x:hidden; }
    body::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:.025; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); }
    nav { position:fixed; top:0; left:0; right:0; z-index:1000; display:flex; align-items:center; justify-content:space-between; padding:1.2rem 5rem; transition:background .4s ease,padding .3s ease,border-color .3s ease; border-bottom:1px solid transparent; }
    nav.scrolled { background:rgba(6,5,4,.96); backdrop-filter:blur(14px); padding:.75rem 5rem; border-color:rgba(196,160,64,.14); }
    .nav-logo { height:70px; opacity:.9; transition:opacity .2s; filter:brightness(0) invert(1) sepia(.45) saturate(5) hue-rotate(8deg) brightness(1.05); }
    .nav-logo:hover { opacity:1; }
    .nav-links { display:flex; gap:2.75rem; list-style:none; align-items:center; }
    .nav-links a { color:var(--blanc-dim); text-decoration:none; font-size:.68rem; font-weight:600; letter-spacing:.18em; text-transform:uppercase; position:relative; transition:color .2s; }
    .nav-links a::after { content:''; position:absolute; bottom:-4px; left:0; right:0; height:1px; background:var(--or); transform:scaleX(0); transform-origin:left; transition:transform .35s cubic-bezier(.4,0,.2,1); }
    .nav-links a:hover, .nav-links a.active { color:var(--or); }
    .nav-links a:hover::after, .nav-links a.active::after { transform:scaleX(1); }
    .btn-rdv { border:1px solid var(--or); color:var(--or); background:transparent; padding:.6rem 1.6rem; font-size:.62rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; text-decoration:none; cursor:pointer; transition:background .22s,color .22s; }
    .btn-rdv:hover { background:var(--or); color:var(--charbon); }
    .nav-cta-group { display:flex; align-items:center; gap:1rem; }
    .nav-phone { display:flex; align-items:center; gap:.5rem; color:var(--blanc-dim); text-decoration:none; font-size:.62rem; font-weight:600; letter-spacing:.1em; border:1px solid rgba(196,160,64,.18); padding:.55rem 1.1rem; transition:color .22s,border-color .22s,background .22s; white-space:nowrap; }
    .nav-phone:hover { color:var(--or); border-color:rgba(196,160,64,.45); background:rgba(196,160,64,.05); }
    .nav-phone svg { width:13px; height:13px; color:var(--or); flex-shrink:0; }
    @media(max-width:900px) { .nav-phone span { display:none; } .nav-phone { padding:.55rem .7rem; } }
    .nav-item-has-drop { position:relative; }
    .nav-item-has-drop > a { display:flex; align-items:center; gap:.45rem; }
    .nav-item-has-drop > a::after { display:none; }
    .drop-chevron { display:inline-block; width:0; height:0; border-left:3.5px solid transparent; border-right:3.5px solid transparent; border-top:3.5px solid currentColor; transition:transform .25s ease; margin-top:1px; flex-shrink:0; }
    .nav-item-has-drop:hover .drop-chevron { transform:rotate(180deg); }
    .nav-dropdown { position:absolute; top:calc(100% + 1.1rem); left:50%; transform:translateX(-50%) translateY(-8px); min-width:210px; background:rgba(6,5,4,.97); border:1px solid rgba(196,160,64,.15); border-top:2px solid var(--or); backdrop-filter:blur(18px); opacity:0; visibility:hidden; transition:opacity .25s ease,transform .25s ease,visibility 0s .25s; z-index:1001; }
    .nav-item-has-drop:hover .nav-dropdown { opacity:1; visibility:visible; transform:translateX(-50%) translateY(0); transition:opacity .25s ease,transform .25s ease,visibility 0s 0s; }
    .nav-dropdown a { display:block; padding:.72rem 1.4rem; font-size:.6rem; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--blanc-dim); text-decoration:none; border-bottom:1px solid rgba(196,160,64,.07); transition:color .18s,background .18s,padding-left .18s; position:relative; }
    .nav-dropdown a:last-child { border-bottom:none; }
    .nav-dropdown a::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:var(--or); transform:scaleY(0); transform-origin:bottom; transition:transform .18s ease; }
    .nav-dropdown a:hover { color:var(--or); background:rgba(196,160,64,.04); padding-left:1.8rem; }
    .nav-dropdown a:hover::before { transform:scaleY(1); }
    .hamburger { display:none; flex-direction:column; justify-content:center; gap:5px; width:38px; height:38px; padding:7px; cursor:pointer; background:transparent; border:1px solid rgba(196,160,64,.22); transition:border-color .2s; flex-shrink:0; }
    .hamburger:hover { border-color:rgba(196,160,64,.55); }
    .hamburger span { display:block; width:100%; height:1px; background:var(--or); transition:transform .3s cubic-bezier(.4,0,.2,1), opacity .25s ease; transform-origin:center; }
    .hamburger.open span:nth-child(1) { transform:translateY(6px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity:0; }
    .hamburger.open span:nth-child(3) { transform:translateY(-6px) rotate(-45deg); }
    .mob-nav { position:fixed; inset:0; z-index:1050; background:rgba(6,5,4,.98); backdrop-filter:blur(24px); display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity .35s ease; padding:2rem; }
    .mob-nav.open { opacity:1; pointer-events:all; }
    .mob-nav-logo { position:absolute; top:1.4rem; left:1.4rem; height:42px; opacity:.75; filter:brightness(0) invert(1) sepia(.45) saturate(5) hue-rotate(8deg) brightness(1.05); }
    .mob-nav-links { list-style:none; display:flex; flex-direction:column; align-items:center; gap:1.75rem; margin-bottom:3rem; }
    .mob-nav-links a { font-family:'Playfair Display',serif; font-size:clamp(1.6rem,6vw,2.2rem); font-weight:600; color:var(--blanc); text-decoration:none; transition:color .2s; }
    .mob-nav-links a:hover, .mob-nav-links a.active { color:var(--or); }
    .mob-nav-divider { width:32px; height:1px; background:rgba(196,160,64,.25); margin-bottom:2.5rem; }
    .mob-nav-phone { font-size:.65rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--or); text-decoration:none; border:1px solid rgba(196,160,64,.28); padding:.65rem 2rem; }
    .mob-cta-bar { display:none; position:fixed; bottom:0; left:0; right:0; z-index:990; background:rgba(6,5,4,.97); backdrop-filter:blur(14px); border-top:1px solid rgba(196,160,64,.15); padding:.65rem 1.25rem; gap:.6rem; align-items:stretch; }
    .mob-cta-call, .mob-cta-rdv { flex:1; display:flex; align-items:center; justify-content:center; gap:.45rem; padding:.75rem .5rem; font-size:.58rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; text-decoration:none; }
    .mob-cta-call { border:1px solid rgba(196,160,64,.28); color:var(--or); }
    .mob-cta-call svg { width:13px; height:13px; flex-shrink:0; }
    .mob-cta-rdv { background:var(--or); color:var(--charbon); }
    footer { background:#070707; border-top:1px solid rgba(196,160,64,.1); padding:4.5rem 5rem 2.5rem; }
    .footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:4rem; margin-bottom:3rem; padding-bottom:3rem; border-bottom:1px solid rgba(255,255,255,.05); }
    .footer-logo { height:56px; opacity:.78; margin-bottom:1.25rem; filter:brightness(0) invert(1) sepia(.45) saturate(5) hue-rotate(8deg) brightness(1.05); }
    .footer-blurb { font-size:.76rem; color:var(--gris); line-height:1.82; font-weight:300; max-width:270px; }
    .f-col-title { font-size:.57rem; font-weight:700; letter-spacing:.26em; text-transform:uppercase; color:var(--or); margin-bottom:1.2rem; }
    .f-links { list-style:none; display:flex; flex-direction:column; gap:.55rem; }
    .f-links a { font-size:.76rem; color:var(--gris); text-decoration:none; font-weight:300; transition:color .2s; }
    .f-links a:hover { color:var(--or); }
    .footer-bottom { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
    .footer-copy { font-size:.66rem; color:rgba(122,118,110,.45); font-weight:300; }
    .footer-legal { display:flex; gap:2rem; }
    .footer-legal a { font-size:.66rem; color:rgba(122,118,110,.45); text-decoration:none; transition:color .2s; }
    .footer-legal a:hover { color:var(--gris); }`;

// ─── Article HTML generator ───────────────────────────────────────────────────

function generateArticleHtml(slug, fm, tocLinks, sectionsHtml) {
  const cat = CATS[fm.category] || CATS.penal;
  const pageTitle = fm.title.replace(/<[^>]+>/g, '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle} — Cabinet LAPERONNIE</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { --cat:${cat.color}; --cat-bg:${cat.bg}; --cat-border:${cat.border}; }
${SHARED_CSS}
    .article-header { padding:11rem 5rem 4rem; background:linear-gradient(160deg,#080706 0%,var(--charbon) 55%,#0A0908 100%); position:relative; overflow:hidden; }
    .article-header::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 20% 60%,${cat.glow} 0%,transparent 70%); }
    .article-header-inner { position:relative; z-index:1; max-width:860px; }
    .breadcrumb { display:flex; align-items:center; gap:.6rem; margin-bottom:2rem; font-size:.6rem; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:var(--gris); }
    .breadcrumb a { color:var(--gris); text-decoration:none; transition:color .2s; }
    .breadcrumb a:hover { color:var(--or); }
    .breadcrumb-sep { color:rgba(196,160,64,.4); }
    .article-tags { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1.75rem; align-items:center; }
    .tag-cat { font-size:.52rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; padding:.28rem .8rem; border:1px solid var(--cat-border); color:var(--cat); background:var(--cat-bg); }
    .tag-read { font-size:.52rem; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--gris); }
    .article-title { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,3.5rem); font-weight:700; line-height:1.1; letter-spacing:-.02em; color:var(--blanc); margin-bottom:1.5rem; }
    .article-title em { color:var(--or); font-style:italic; }
    .article-intro { font-family:'Cormorant Garamond',serif; font-size:clamp(1.05rem,1.8vw,1.25rem); font-style:italic; font-weight:300; color:var(--blanc-dim); max-width:720px; line-height:1.7; }
    .article-meta-bar { display:flex; align-items:center; gap:2rem; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(196,160,64,.1); flex-wrap:wrap; }
    .author-block { display:flex; align-items:center; gap:1rem; }
    .author-photo { width:44px; height:44px; object-fit:cover; object-position:top; border:1px solid rgba(196,160,64,.2); filter:grayscale(.25); }
    .author-info { display:flex; flex-direction:column; gap:.2rem; }
    .author-name { font-size:.68rem; font-weight:600; color:var(--blanc); letter-spacing:.06em; }
    .author-role { font-size:.58rem; font-weight:400; color:var(--gris); letter-spacing:.08em; }
    .meta-sep { width:1px; height:28px; background:rgba(196,160,64,.15); }
    .meta-date { font-size:.62rem; font-weight:500; color:var(--gris); letter-spacing:.1em; }
    .article-layout { display:grid; grid-template-columns:260px 1fr; gap:0; padding:0 5rem 7rem; max-width:1280px; margin:0 auto; align-items:start; }
    .article-sidebar { padding:4rem 2.5rem 4rem 0; align-self:start; }
    @media(min-width:1101px) { .article-sidebar { position:sticky; top:110px; z-index:10; } }
    .toc-label { font-size:.55rem; font-weight:700; letter-spacing:.4em; text-transform:uppercase; color:var(--or); margin-bottom:1.5rem; display:flex; align-items:center; gap:.75rem; }
    .toc-label::before { content:''; width:22px; height:1px; background:var(--or); }
    .toc-nav { display:flex; flex-direction:column; border-left:1px solid rgba(196,160,64,.15); }
    .toc-link { display:block; padding:.7rem 1.2rem; font-size:.68rem; font-weight:500; color:var(--gris); text-decoration:none; letter-spacing:.06em; position:relative; transition:color .2s,padding-left .2s; border-left:2px solid transparent; margin-left:-1px; }
    .toc-link:hover { color:var(--blanc-dim); }
    .toc-link.active { color:var(--or); border-left-color:var(--or); padding-left:1.4rem; }
    .toc-back { display:flex; align-items:center; gap:.5rem; font-size:.6rem; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--gris); text-decoration:none; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(196,160,64,.1); transition:color .2s; }
    .toc-back:hover { color:var(--or); }
    .toc-back svg { width:12px; height:12px; }
    .article-content { padding:4rem 0 4rem 4rem; border-left:1px solid rgba(196,160,64,.08); }
    .article-section { margin-bottom:4rem; padding-bottom:4rem; border-bottom:1px solid rgba(196,160,64,.07); scroll-margin-top:130px; }
    .article-section:last-of-type { border-bottom:none; margin-bottom:2rem; }
    .section-title { font-family:'Playfair Display',serif; font-size:1.55rem; font-weight:600; color:var(--blanc); margin-bottom:1.4rem; line-height:1.3; display:flex; align-items:flex-start; gap:.75rem; }
    .section-title::before { content:''; width:3px; height:1.2em; background:var(--or); flex-shrink:0; margin-top:.15em; }
    .article-content p { font-size:.88rem; color:var(--blanc-dim); line-height:1.9; font-weight:300; margin-bottom:1.2rem; }
    .article-content p:last-child { margin-bottom:0; }
    .article-content strong { color:var(--blanc); font-weight:600; }
    .article-content ul, .article-content ol { margin:1.2rem 0 1.2rem 1.2rem; display:flex; flex-direction:column; gap:.65rem; }
    .article-content li { font-size:.88rem; color:var(--blanc-dim); line-height:1.8; font-weight:300; padding-left:.5rem; }
    .article-content ul li::marker { color:var(--or); }
    .article-content ol li::marker { color:var(--or); font-weight:600; }
    .highlight-box { background:var(--charbon-card); border-left:3px solid var(--or); padding:1.5rem 1.75rem; margin:1.75rem 0; }
    .highlight-box-title { font-size:.6rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--or); margin-bottom:.75rem; }
    .highlight-box p { font-size:.84rem; color:var(--blanc-dim); line-height:1.8; margin-bottom:0; }
    .article-cta-box { background:var(--charbon-card); border:1px solid rgba(196,160,64,.15); padding:2.5rem 2.75rem; margin-top:3rem; position:relative; overflow:hidden; }
    .article-cta-box::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--or-dark),var(--or-pale)); }
    .article-cta-title { font-family:'Playfair Display',serif; font-size:1.4rem; font-weight:600; color:var(--blanc); margin-bottom:.75rem; line-height:1.3; }
    .article-cta-text { font-size:.82rem; color:var(--gris); line-height:1.8; margin-bottom:1.75rem; font-weight:300; }
    .article-cta-actions { display:flex; gap:1rem; flex-wrap:wrap; }
    .btn-or { display:inline-flex; align-items:center; gap:.5rem; background:var(--or); color:var(--charbon); padding:.85rem 1.8rem; font-size:.62rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:background .2s; }
    .btn-or:hover { background:var(--or-pale); }
    .btn-outline { display:inline-flex; align-items:center; gap:.5rem; border:1px solid rgba(196,160,64,.3); color:var(--blanc-dim); padding:.85rem 1.8rem; font-size:.62rem; font-weight:600; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:all .2s; }
    .btn-outline:hover { color:var(--or); border-color:var(--or); }
    @media(max-width:1100px) {
      nav, nav.scrolled { padding-left:2.5rem; padding-right:2.5rem; }
      .article-header, .article-layout, footer { padding-left:2.5rem; padding-right:2.5rem; }
      .article-layout { grid-template-columns:1fr; }
      .article-sidebar { position:static; padding:2rem 0 0; border-bottom:1px solid rgba(196,160,64,.1); margin-bottom:2rem; }
      .toc-nav { flex-direction:row; flex-wrap:wrap; border-left:none; border-top:1px solid rgba(196,160,64,.15); padding-top:.5rem; }
      .toc-link { border-left:none; border-bottom:2px solid transparent; padding:.5rem .75rem; }
      .toc-link.active { border-bottom-color:var(--or); border-left-color:transparent; padding-left:.75rem; }
      .article-content { padding:0; border-left:none; }
      .footer-grid { grid-template-columns:1fr 1fr; gap:2.5rem; }
    }
    @media(max-width:720px) {
      nav { padding:1rem 1.25rem; } nav.scrolled { padding:.75rem 1.25rem; }
      .nav-logo { height:44px; } .nav-links { display:none; } .nav-cta-group { display:none; } .hamburger { display:flex; }
      .article-header, .article-layout, footer { padding-left:1.5rem; padding-right:1.5rem; }
      .footer-grid { grid-template-columns:1fr; gap:2rem; } .footer-bottom { flex-direction:column; gap:.75rem; }
      .mob-cta-bar { display:flex; } body { padding-bottom:68px; }
      .article-cta-actions { flex-direction:column; }
    }
  </style>
</head>
<body>
${buildNav('blog')}

<div class="article-header">
  <div class="article-header-inner">
    <div class="breadcrumb">
      <a href="index.html">Accueil</a><span class="breadcrumb-sep">›</span>
      <a href="blog.html">Actualités</a><span class="breadcrumb-sep">›</span>
      <span>${cat.label}</span>
    </div>
    <div class="article-tags">
      <span class="tag-cat">${cat.label}</span>
      <span class="tag-read">${fm.readTime || '5 min de lecture'}</span>
    </div>
    <h1 class="article-title">${fm.title}</h1>
    <p class="article-intro">${fm.intro || ''}</p>
    <div class="article-meta-bar">
      <div class="author-block">
        <img src="brand_assets/Photo of the lawyer.png" alt="Maître François-Xavier LAPERONNIE" class="author-photo" />
        <div class="author-info">
          <span class="author-name">Maître François-Xavier LAPERONNIE</span>
          <span class="author-role">Avocat au Barreau de Charente</span>
        </div>
      </div>
      <div class="meta-sep"></div>
      <span class="meta-date">${fm.date || ''}</span>
    </div>
  </div>
</div>

<div class="article-layout">
  <aside class="article-sidebar">
    <div class="toc-label">Sommaire</div>
    <div class="toc-nav">
${tocLinks}
    </div>
    <a href="blog.html" class="toc-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      Retour aux actualités
    </a>
  </aside>

  <main class="article-content">
${sectionsHtml}

    <div class="article-cta-box">
      <div class="article-cta-title">${fm.ctaTitle || 'Vous avez une question juridique ?'}</div>
      <p class="article-cta-text">${fm.ctaText || 'Maître François-Xavier LAPERONNIE est disponible pour une première consultation confidentielle.'}</p>
      <div class="article-cta-actions">
        <a href="index.html#contact" class="btn-or">Prendre rendez-vous</a>
        <a href="tel:+33545383009" class="btn-outline">${NAV_PHONE_SVG}05 45 38 30 09</a>
      </div>
    </div>
  </main>
</div>

${FOOTER}
${SHARED_JS}
<script>
  const sections = document.querySelectorAll('.article-section');
  const links = document.querySelectorAll('.toc-link');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector('.toc-link[href="#' + e.target.id + '"]');
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: .25, rootMargin: '-100px 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
</script>
${MOB_CTA}
</body>
</html>`;
}

// ─── Case HTML generator ──────────────────────────────────────────────────────

function generateCaseHtml(slug, fm, tocLinks, sectionsHtml) {
  const domainLabel = CATS[fm.domain]?.label || 'Pénal';
  const pageTitle = fm.title.replace(/<[^>]+>/g, '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle} — Cabinet LAPERONNIE</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
${SHARED_CSS}
    .case-header { padding:11rem 5rem 4rem; background:linear-gradient(160deg,#080706 0%,var(--charbon) 55%,#0A0908 100%); position:relative; overflow:hidden; }
    .case-header::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 20% 60%,rgba(196,160,64,.04) 0%,transparent 70%); }
    .case-header-inner { position:relative; z-index:1; max-width:860px; }
    .breadcrumb { display:flex; align-items:center; gap:.6rem; margin-bottom:2rem; font-size:.6rem; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:var(--gris); }
    .breadcrumb a { color:var(--gris); text-decoration:none; transition:color .2s; }
    .breadcrumb a:hover { color:var(--or); }
    .breadcrumb-sep { color:rgba(196,160,64,.4); }
    .case-tags { display:flex; gap:.6rem; flex-wrap:wrap; margin-bottom:1.75rem; align-items:center; }
    .tag-domain { font-size:.52rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; padding:.28rem .8rem; border:1px solid rgba(196,160,64,.3); color:var(--or-pale); background:rgba(196,160,64,.07); }
    .tag-outcome { font-size:.52rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; padding:.28rem .8rem; background:rgba(196,160,64,.12); color:var(--or-pale); }
    .tag-outcome::before { content:"✓  "; }
    .case-title { font-family:'Playfair Display',serif; font-size:clamp(2rem,4vw,3.5rem); font-weight:700; line-height:1.1; letter-spacing:-.02em; color:var(--blanc); margin-bottom:1.75rem; }
    .case-title em { color:var(--or); font-style:italic; }
    .case-meta { display:flex; align-items:flex-start; gap:3rem; flex-wrap:wrap; margin-top:2rem; padding-top:2rem; border-top:1px solid rgba(196,160,64,.1); }
    .case-meta-item { display:flex; flex-direction:column; gap:.35rem; font-size:.6rem; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--gris); }
    .case-meta-item span { font-size:.76rem; font-weight:300; letter-spacing:.04em; text-transform:none; color:var(--blanc-dim); }
    .case-layout { display:grid; grid-template-columns:260px 1fr; gap:0; padding:0 5rem 7rem; max-width:1280px; margin:0 auto; align-items:start; }
    .case-sidebar { padding:4rem 2.5rem 4rem 0; align-self:start; }
    @media(min-width:1101px) { .case-sidebar { position:sticky; top:110px; z-index:10; } }
    .sidebar-label { font-size:.55rem; font-weight:700; letter-spacing:.4em; text-transform:uppercase; color:var(--or); margin-bottom:1.5rem; display:flex; align-items:center; gap:.75rem; }
    .sidebar-label::before { content:''; width:22px; height:1px; background:var(--or); }
    .sidebar-nav { display:flex; flex-direction:column; border-left:1px solid rgba(196,160,64,.15); }
    .sidebar-link { display:block; padding:.7rem 1.2rem; font-size:.68rem; font-weight:500; color:var(--gris); text-decoration:none; letter-spacing:.06em; position:relative; transition:color .2s,padding-left .2s; border-left:2px solid transparent; margin-left:-1px; }
    .sidebar-link:hover { color:var(--blanc-dim); }
    .sidebar-link.active { color:var(--or); border-left-color:var(--or); padding-left:1.4rem; }
    .sidebar-back { display:flex; align-items:center; gap:.5rem; font-size:.6rem; font-weight:600; letter-spacing:.15em; text-transform:uppercase; color:var(--gris); text-decoration:none; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(196,160,64,.1); transition:color .2s; }
    .sidebar-back:hover { color:var(--or); }
    .sidebar-back svg { width:12px; height:12px; }
    .case-content { padding:4rem 0 4rem 4rem; border-left:1px solid rgba(196,160,64,.08); }
    .case-section { margin-bottom:4rem; padding-bottom:4rem; border-bottom:1px solid rgba(196,160,64,.07); scroll-margin-top:130px; }
    .case-section:last-of-type { border-bottom:none; margin-bottom:2rem; }
    .case-section-title { font-family:'Playfair Display',serif; font-size:1.55rem; font-weight:600; color:var(--blanc); margin-bottom:1.4rem; line-height:1.3; display:flex; align-items:flex-start; gap:.75rem; }
    .case-section-title::before { content:''; width:3px; height:1.2em; background:var(--or); flex-shrink:0; margin-top:.15em; }
    .case-content p { font-size:.88rem; color:var(--blanc-dim); line-height:1.9; font-weight:300; margin-bottom:1.2rem; }
    .case-content p:last-child { margin-bottom:0; }
    .case-content strong { color:var(--blanc); font-weight:600; }
    .case-content ul, .case-content ol { margin:1.2rem 0 1.2rem 1.2rem; display:flex; flex-direction:column; gap:.65rem; }
    .case-content li { font-size:.88rem; color:var(--blanc-dim); line-height:1.8; font-weight:300; padding-left:.5rem; }
    .case-content ul li::marker { color:var(--or); }
    .case-content ol li::marker { color:var(--or); font-weight:600; }
    .highlight-box, .result-box { background:var(--charbon-card); border-left:3px solid var(--or); padding:1.5rem 1.75rem; margin:1.75rem 0; }
    .highlight-box-title, .result-box-title { font-size:.6rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:var(--or); margin-bottom:.75rem; }
    .highlight-box p, .result-box p { font-size:.84rem; color:var(--blanc-dim); line-height:1.8; margin-bottom:0; }
    @media(max-width:1100px) {
      nav, nav.scrolled { padding-left:2.5rem; padding-right:2.5rem; }
      .case-header, .case-layout, footer { padding-left:2.5rem; padding-right:2.5rem; }
      .case-layout { grid-template-columns:1fr; }
      .case-sidebar { position:static; padding:2rem 0 0; border-bottom:1px solid rgba(196,160,64,.1); margin-bottom:2rem; }
      .sidebar-nav { flex-direction:row; flex-wrap:wrap; border-left:none; border-top:1px solid rgba(196,160,64,.15); padding-top:.5rem; }
      .sidebar-link { border-left:none; border-bottom:2px solid transparent; padding:.5rem .75rem; }
      .sidebar-link.active { border-bottom-color:var(--or); border-left-color:transparent; padding-left:.75rem; }
      .case-content { padding:0; border-left:none; }
      .footer-grid { grid-template-columns:1fr 1fr; gap:2.5rem; }
    }
    @media(max-width:720px) {
      nav { padding:1rem 1.25rem; } nav.scrolled { padding:.75rem 1.25rem; }
      .nav-logo { height:44px; } .nav-links { display:none; } .nav-cta-group { display:none; } .hamburger { display:flex; }
      .case-header, .case-layout, footer { padding-left:1.5rem; padding-right:1.5rem; }
      .footer-grid { grid-template-columns:1fr; gap:2rem; } .footer-bottom { flex-direction:column; gap:.75rem; }
      .mob-cta-bar { display:flex; } body { padding-bottom:68px; }
    }
  </style>
</head>
<body>
${buildNav('cases')}

<div class="case-header">
  <div class="case-header-inner">
    <div class="breadcrumb">
      <a href="index.html">Accueil</a><span class="breadcrumb-sep">›</span>
      <a href="cases.html">Affaires</a><span class="breadcrumb-sep">›</span>
      <span>${domainLabel}</span>
    </div>
    <div class="case-tags">
      <div class="tag-domain">${domainLabel}</div>
      <div class="tag-outcome">${fm.outcome || ''}</div>
    </div>
    <h1 class="case-title">${fm.title}</h1>
    <div class="case-meta">
      <div class="case-meta-item">Date<span>${fm.date || ''}</span></div>
      <div class="case-meta-item">Juridiction<span>${fm.court || ''}</span></div>
      <div class="case-meta-item">Durée<span>${fm.duration || ''}</span></div>
    </div>
  </div>
</div>

<div class="case-layout">
  <aside class="case-sidebar">
    <div class="sidebar-label">Sommaire</div>
    <nav class="sidebar-nav">
${tocLinks}
    </nav>
    <a href="cases.html" class="sidebar-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      Retour aux affaires
    </a>
  </aside>

  <main class="case-content">
${sectionsHtml}

    ${fm.resultDetail ? `
    <div class="result-box" style="margin-top:2rem;">
      <div class="result-box-title">Résultat — ${fm.outcome || ''}</div>
      <p>${fm.resultDetail}</p>
    </div>` : ''}

    <p style="margin-top:2rem;font-size:.78rem;color:var(--gris);font-style:italic;"><em>Les éléments présentés dans cette affaire ont été modifiés pour préserver l'anonymat de notre client. Toute ressemblance avec une affaire réelle identifiable serait fortuite.</em></p>
  </main>
</div>

${FOOTER}
${SHARED_JS}
<script>
  const sections = document.querySelectorAll('.case-section');
  const links = document.querySelectorAll('.sidebar-link');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector('.sidebar-link[href="#' + e.target.id + '"]');
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: .25, rootMargin: '-100px 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
</script>
${MOB_CTA}
</body>
</html>`;
}

// Rename article-section / section-title to case-section / case-section-title for case pages
function generateCaseSectionsHtml(markdown) {
  const { tocLinks, sectionsHtml } = processBody(markdown);
  const caseSectionsHtml = sectionsHtml
    .replace(/class="article-section"/g, 'class="case-section"')
    .replace(/class="section-title"/g, 'class="case-section-title"');
  return { tocLinks, sectionsHtml: caseSectionsHtml };
}

// ─── Card generators ──────────────────────────────────────────────────────────

const ARROW_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

function generateArticleCard(slug, fm) {
  const cat = CATS[fm.category] || CATS.penal;
  return `
    <a href="article-${slug}.html" class="article-card reveal" data-cat="${fm.category}">
      <div class="article-card-top">
        <span class="article-cat ${fm.category}">${cat.label}</span>
        <span class="article-read-time">${fm.readTime || '5 min de lecture'}</span>
      </div>
      <h2 class="article-title">${fm.title}</h2>
      <p class="article-excerpt">${fm.intro ? fm.intro.slice(0, 160).replace(/<[^>]+>/g, '') + '…' : ''}</p>
      <div class="article-card-footer">
        <span class="article-date">${fm.date || ''}</span>
        <span class="article-cta">Lire ${ARROW_SVG}</span>
      </div>
    </a>`;
}

function generateCaseCard(slug, fm) {
  return `
    <a href="case-${slug}.html" class="case-card reveal">
      <div style="display:flex; gap:.6rem; flex-wrap:wrap;">
        <div class="case-domain-tag">${CATS[fm.domain]?.label || fm.domain}</div>
        <div class="case-outcome">${fm.outcome || ''}</div>
      </div>
      <h2 class="case-card-title">${fm.title}</h2>
      <p class="case-card-excerpt">${fm.excerpt || ''}</p>
      <div class="case-card-meta">
        <span class="case-meta-item">${fm.date || ''}</span>
        <span class="case-meta-item">${fm.court || ''}</span>
      </div>
      <span class="case-card-cta">Lire l'affaire ${ARROW_SVG}</span>
    </a>`;
}

// ─── Main build ───────────────────────────────────────────────────────────────

async function build() {
  const articlesDir = '_content/articles';
  const casesDir = '_content/cases';

  let newArticleCards = '';
  let newCaseCards = '';

  // Process articles
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      const { data: fm, content: markdown } = matter(raw);
      const slug = path.basename(file, '.md');

      const { tocLinks, sectionsHtml } = processBody(markdown);
      const html = generateArticleHtml(slug, fm, tocLinks, sectionsHtml);
      fs.writeFileSync(`article-${slug}.html`, html);

      newArticleCards += generateArticleCard(slug, fm);
      console.log(`✓ article-${slug}.html`);
    }
  }

  // Process cases
  if (fs.existsSync(casesDir)) {
    const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(casesDir, file), 'utf8');
      const { data: fm, content: markdown } = matter(raw);
      const slug = path.basename(file, '.md');

      const { tocLinks, sectionsHtml } = generateCaseSectionsHtml(markdown);
      const html = generateCaseHtml(slug, fm, tocLinks, sectionsHtml);
      fs.writeFileSync(`case-${slug}.html`, html);

      newCaseCards += generateCaseCard(slug, fm);
      console.log(`✓ case-${slug}.html`);
    }
  }

  // Inject article cards into blog.html
  if (newArticleCards && fs.existsSync('blog.html')) {
    let blogHtml = fs.readFileSync('blog.html', 'utf8');
    blogHtml = blogHtml.replace(
      /<!-- CMS_ARTICLES_START -->[\s\S]*?<!-- CMS_ARTICLES_END -->/,
      `<!-- CMS_ARTICLES_START -->${newArticleCards}\n    <!-- CMS_ARTICLES_END -->`
    );
    fs.writeFileSync('blog.html', blogHtml);
    console.log('✓ blog.html updated');
  }

  // Inject case cards into cases.html
  if (newCaseCards && fs.existsSync('cases.html')) {
    let casesHtml = fs.readFileSync('cases.html', 'utf8');
    casesHtml = casesHtml.replace(
      /<!-- CMS_CASES_START -->[\s\S]*?<!-- CMS_CASES_END -->/,
      `<!-- CMS_CASES_START -->${newCaseCards}\n    <!-- CMS_CASES_END -->`
    );
    fs.writeFileSync('cases.html', casesHtml);
    console.log('✓ cases.html updated');
  }

  console.log('\nBuild complete.');
}

build().catch(err => { console.error(err); process.exit(1); });
