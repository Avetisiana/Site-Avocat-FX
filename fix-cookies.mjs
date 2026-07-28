/**
 * fix-cookies.mjs — Adds RGPD/CNIL cookie consent to all LAPERONNIE pages.
 * Replaces the immediate GA tag with a consent-gated version.
 * Injects the cookie banner before </body>.
 * Run once: node fix-cookies.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// ─── New GA block (replaces the old one in HTML files) ────────────────────
const NEW_GA_BLOCK = `  <!-- Consentement cookies — GA chargé uniquement après accord RGPD -->
  <script>
  (function(){
    var GA='G-2RW9YDSJCQ',CK='laperonnie_consent';
    function loadGA(){
      if(window._gaOk)return;window._gaOk=1;
      var s=document.createElement('script');
      s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id='+GA;
      document.head.appendChild(s);
      window.dataLayer=window.dataLayer||[];
      window.gtag=function(){dataLayer.push(arguments);};
      gtag('js',new Date());gtag('config',GA);
    }
    window.acceptCookies=function(){
      localStorage.setItem(CK,'ok');
      var b=document.getElementById('cookie-banner');
      if(b)b.style.display='none';
      loadGA();
    };
    window.refuseCookies=function(){
      localStorage.setItem(CK,'no');
      var b=document.getElementById('cookie-banner');
      if(b)b.style.display='none';
    };
    window.manageCookies=function(){
      localStorage.removeItem(CK);
      var b=document.getElementById('cookie-banner');
      if(b)b.style.display='flex';
    };
    document.addEventListener('DOMContentLoaded',function(){
      var c=localStorage.getItem(CK);
      if(!c){var b=document.getElementById('cookie-banner');if(b)b.style.display='flex';}
      else if(c==='ok')loadGA();
    });
  })();
  </script>`;

// ─── Cookie banner HTML (injected before </body>) ─────────────────────────
const COOKIE_BANNER = `
<!-- Bannière consentement cookies RGPD/CNIL -->
<div id="cookie-banner" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:9998;background:rgba(6,5,4,.97);border-top:1px solid rgba(196,160,64,.22);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);padding:1.1rem 1.5rem;align-items:flex-start;justify-content:space-between;gap:.9rem;flex-wrap:wrap;box-shadow:0 -6px 32px rgba(0,0,0,.55);">
  <p style="color:#C0BAB0;font-family:Montserrat,sans-serif;font-size:.72rem;line-height:1.65;margin:0;flex:1;min-width:220px;">
    Ce site utilise Google Analytics pour mesurer l'audience. Ces cookies collectent des données anonymes et nécessitent votre consentement conformément au RGPD.
    <a href="/confidentialite.html" style="color:#C4A040;text-decoration:underline;margin-left:.3em;">En savoir plus</a>
  </p>
  <div style="display:flex;gap:.6rem;flex-shrink:0;flex-wrap:wrap;margin-top:.1rem;">
    <button onclick="refuseCookies()" style="background:transparent;border:1px solid rgba(196,160,64,.3);color:#C0BAB0;font-family:Montserrat,sans-serif;font-size:.58rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:.5rem 1.1rem;cursor:pointer;white-space:nowrap;transition:border-color .2s,color .2s;">Refuser</button>
    <button onclick="acceptCookies()" style="background:#C4A040;border:1px solid #C4A040;color:#060504;font-family:Montserrat,sans-serif;font-size:.58rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:.5rem 1.3rem;cursor:pointer;white-space:nowrap;transition:opacity .2s;">Accepter</button>
  </div>
</div>`;

// ─── Old GA patterns to match ─────────────────────────────────────────────
const OLD_GA_DOUBLE = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-2RW9YDSJCQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());
    gtag("config", "G-2RW9YDSJCQ");
  </script>`;

const OLD_GA_SINGLE = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-2RW9YDSJCQ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-2RW9YDSJCQ');
  </script>`;

// ─── HTML files to update (exclude admin/) ────────────────────────────────
const pages = readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .filter(f => !f.startsWith('admin'));

let updated = 0, skipped = 0;

for (const page of pages) {
  const path = join(ROOT, page);
  let content;
  try { content = readFileSync(path, 'utf8'); }
  catch (e) { console.log('  ✗ Cannot read:', page); skipped++; continue; }

  let changed = false;

  // Replace GA tag (double-quote variant)
  if (content.includes(OLD_GA_DOUBLE)) {
    content = content.replace(OLD_GA_DOUBLE, NEW_GA_BLOCK);
    changed = true;
  }
  // Replace GA tag (single-quote variant, fallback)
  else if (content.includes(OLD_GA_SINGLE)) {
    content = content.replace(OLD_GA_SINGLE, NEW_GA_BLOCK);
    changed = true;
  }

  // Add banner before </body> (only if the div itself is not already present)
  if (!content.includes('id="cookie-banner"') && content.includes('</body>')) {
    content = content.replace('</body>', COOKIE_BANNER + '\n</body>');
    changed = true;
  }

  if (changed) {
    writeFileSync(path, content, 'utf8');
    console.log('  ✓', page);
    updated++;
  } else {
    console.log('  – skip:', page, '(no match found)');
    skipped++;
  }
}

console.log(`\nDone — ${updated} updated, ${skipped} skipped.`);
