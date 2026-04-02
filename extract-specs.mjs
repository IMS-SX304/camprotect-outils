/**
 * extract-specs.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Extrait les specs techniques des fiches PDF Ajax (caméras + détecteurs)
 * via l'API Claude et génère src/data/products-specs.json
 *
 * Usage :
 *   ANTHROPIC_API_KEY=sk-ant-... node extract-specs.mjs
 *
 * Prérequis : Node 18+  (fetch natif)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY   = process.env.ANTHROPIC_API_KEY;
const API_URL   = 'https://api.anthropic.com/v1/messages';
const MODEL     = 'claude-sonnet-4-20250514';
const OUT_DIR   = path.join(__dirname, 'src', 'data');
const OUT_FILE  = path.join(OUT_DIR, 'products-specs.json');

if (!API_KEY) {
  console.error('\n❌  ANTHROPIC_API_KEY non défini.\n   export ANTHROPIC_API_KEY=sk-ant-...\n');
  process.exit(1);
}

// ─── Catalogue des fiches à traiter ─────────────────────────────────────────

const PRODUCTS = [

  // ── CAMÉRAS Ajax ─────────────────────────────────────────────────────────

  {
    key  : 'ajax_bulletcam',
    name : 'Ajax BulletCam',
    type : 'camera',
    shape: 'bullet',
    environment: 'outdoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/69c5491be907476f2e0b9be7_TDS%20-%20EN%20-%20Ajax%20BulletCam.pdf',
  },
  {
    key  : 'ajax_domecam_mini',
    name : 'Ajax DomeCam Mini',
    type : 'camera',
    shape: 'dome',
    environment: 'both',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/69ca8edadb64fd9a3686b257_TDS%20-%20EN%20-%20Ajax%20DomeCam%20mini.pdf',
  },
  {
    key  : 'ajax_turretcam',
    name : 'Ajax TurretCam',
    type : 'camera',
    shape: 'turret',
    environment: 'both',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/69cba86b9b1a53b094a64285_TDS%20-%20EN%20-%20Ajax%20TurretCam-avec%20compression.pdf',
  },

  // ── DÉTECTEURS PIR intérieurs ────────────────────────────────────────────

  {
    key  : 'ajax_motionprotect',
    name : 'Ajax MotionProtect',
    type : 'pir_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b304051f2a3f6ebad74507_TDS%20-%20FR%20-%20Ajax%20MotionProtect%20Jeweller.pdf',
  },
  {
    key  : 'ajax_motionprotect_plus',
    name : 'Ajax MotionProtect Plus',
    type : 'pir_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b310811680d2e0aa9dcf6a_TDS%20-%20FR%20-%20Ajax%20MotionProtect%20Plus%20Jeweller.pdf',
  },
  {
    key  : 'ajax_motioncam',
    name : 'Ajax MotionCam',
    type : 'pir_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b319e4e6bcd6416d35fce4_TDS%20-%20FR%20-%20Ajax%20MotionCam%20Jeweller.pdf',
  },
  {
    key  : 'ajax_motioncam_phod',
    name : 'Ajax MotionCam (PhOD)',
    type : 'pir_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b31e3c34d18c399726e492_TDS%20-%20FR%20-%20Ajax%20MotionCam%20(PhOD)%20Jeweller.pdf',
  },
  {
    key  : 'ajax_combiprotect',
    name : 'Ajax CombiProtect',
    type : 'pir_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b31646a861dd642a6e45e4_TDS%20-%20FR%20-%20Ajax%20CombiProtect%20Jeweller.pdf',
  },

  // ── DÉTECTEURS PIR extérieurs ────────────────────────────────────────────

  {
    key  : 'ajax_motionprotect_outdoor',
    name : 'Ajax MotionProtect Outdoor',
    type : 'pir_detector',
    environment: 'outdoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b32f9ebb9004d90580bde7_TDS%20-%20FR%20-%20Ajax%20MotionProtect%20Outdoor%20Jeweller.pdf',
  },
  {
    key  : 'ajax_motioncam_outdoor',
    name : 'Ajax MotionCam Outdoor',
    type : 'pir_detector',
    environment: 'outdoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b33234d54b2fd8cfe97772_TDS%20-%20FR%20-%20Ajax%20MotionCam%20Outdoor%20Jeweller.pdf',
  },
  {
    key  : 'ajax_motioncam_outdoor_phod',
    name : 'Ajax MotionCam Outdoor (PhOD)',
    type : 'pir_detector',
    environment: 'outdoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b3370c2f0ddb2fab5fbdad_TDS%20-%20FR%20-%20Ajax%20MotionCam%20Outdoor%20(PhOD)%20Jeweller.pdf',
  },

  // ── DÉTECTEURS RIDEAU ────────────────────────────────────────────────────

  {
    key  : 'ajax_motionprotect_curtain',
    name : 'Ajax MotionProtect Curtain',
    type : 'curtain_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/69392c162e61a366ff8b2466_TDS%20-%20FR%20-%20Ajax%20MotionProtect%20Curtain%20Jeweller.pdf',
  },
  {
    key  : 'ajax_curtain_outdoor',
    name : 'Ajax Curtain Outdoor',
    type : 'curtain_detector',
    environment: 'outdoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b32aa8ffeaf5f68037446c_TDS%20-%20FR%20-%20Ajax%20Curtain%20Outdoor%20Jeweller.pdf',
  },
  {
    key  : 'ajax_dualcurtain_outdoor',
    name : 'Ajax DualCurtain Outdoor',
    type : 'curtain_detector',
    environment: 'outdoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b32cda9d89f9f88e4c888a_TDS%20-%20FR%20-%20Ajax%20DualCurtain%20Outdoor%20Jeweller.pdf',
  },

  // ── DÉTECTEUR BRIS DE VITRE ──────────────────────────────────────────────

  {
    key  : 'ajax_glassprotect',
    name : 'Ajax GlassProtect',
    type : 'glass_detector',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b2ff891cb25e693298277a_TDS%20-%20FR%20-%20Ajax%20GlassProtect%20Jeweller.pdf',
  },

  // ── SIRÈNES ──────────────────────────────────────────────────────────────

  {
    key  : 'ajax_homesiren',
    name : 'Ajax HomeSiren',
    type : 'siren',
    environment: 'indoor',
    pdfUrl: 'https://cdn.prod.website-files.com/66e1f58c28ec496d75b4313b/67b466ad87e43ccf896ca718_TDS%20-%20FR%20-%20Ajax%20HomeSiren%20Jeweller.pdf',
  },

];

// ─── Prompts d'extraction par type de produit ────────────────────────────────

function buildPrompt(product) {
  switch (product.type) {

    case 'camera':
      return `
Lis cette fiche technique de caméra Ajax et extrais les specs optiques sous forme JSON strict.
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.

{
  "ir_range_m": <portée IR en mètres, nombre>,
  "focal_lengths": {
    "2.8mm": {
      "fov_h_deg": <angle horizontal en degrés, nombre>,
      "fov_v_deg": <angle vertical en degrés, nombre>,
      "fov_d_deg": <angle diagonal ou null>
    },
    "4mm": {
      "fov_h_deg": <nombre>,
      "fov_v_deg": <nombre>,
      "fov_d_deg": <nombre ou null>
    }
  },
  "power_poe": <true ou false>,
  "ip_rating": "<ex: IP67 ou null>",
  "notes": "<remarque importante ou null>"
}

Si une valeur n'est pas trouvée, mettre null.`;

    case 'pir_detector':
      return `
Lis cette fiche technique de détecteur PIR Ajax et extrais les specs de détection sous forme JSON strict.
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.

{
  "detection_range_m": <portée de détection en mètres, nombre>,
  "detection_angle_h_deg": <angle horizontal de détection en degrés, nombre>,
  "detection_angle_v_deg": <angle vertical de détection en degrés ou null>,
  "mounting_height_m": <hauteur de montage recommandée en mètres, nombre>,
  "immunity_pet": <immunité animaux true/false>,
  "ip_rating": "<ex: IP55 ou null>",
  "battery": "<type de pile, ex: CR123A ou null>",
  "notes": "<remarque importante ou null>"
}

Si une valeur n'est pas trouvée, mettre null.`;

    case 'curtain_detector':
      return `
Lis cette fiche technique de détecteur rideau Ajax et extrais les specs sous forme JSON strict.
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.

{
  "detection_range_m": <portée max en mètres, nombre>,
  "curtain_width_m": <largeur du rideau de détection en mètres ou null>,
  "detection_angle_deg": <angle d'ouverture si indiqué ou null>,
  "mounting_height_m": <hauteur de montage recommandée ou null>,
  "ip_rating": "<ex: IP55 ou null>",
  "battery": "<type de pile ou null>",
  "notes": "<remarque importante ou null>"
}

Si une valeur n'est pas trouvée, mettre null.`;

    case 'glass_detector':
      return `
Lis cette fiche technique de détecteur bris de vitre Ajax et extrais les specs sous forme JSON strict.
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.

{
  "detection_range_m": <portée de détection en mètres, nombre>,
  "detection_angle_deg": <angle de couverture en degrés ou null>,
  "mounting_height_m": <hauteur de montage recommandée ou null>,
  "glass_types": "<types de verre détectés ou null>",
  "battery": "<type de pile ou null>",
  "notes": "<remarque importante ou null>"
}

Si une valeur n'est pas trouvée, mettre null.`;

    case 'siren':
      return `
Lis cette fiche technique de sirène Ajax et extrais les specs sous forme JSON strict.
Réponds UNIQUEMENT avec le JSON, sans texte avant ni après.

{
  "sound_level_db": <niveau sonore en dB, nombre>,
  "sound_range_m": <portée sonore en mètres si indiqué ou null>,
  "flash": <stroboscope intégré true/false>,
  "battery_backup": <batterie de secours true/false>,
  "ip_rating": "<ex: IP55 ou null>",
  "notes": "<remarque importante ou null>"
}

Si une valeur n'est pas trouvée, mettre null.`;

    default:
      return 'Extrais les specs techniques clés sous forme JSON. Réponds uniquement avec du JSON valide.';
  }
}

// ─── Fonctions utilitaires ───────────────────────────────────────────────────

async function fetchPdfAsBase64(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CamProtect-Spec-Extractor/1.0' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

async function callClaudeWithPdf(base64Pdf, prompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type'  : 'application/json',
      'x-api-key'     : API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model     : MODEL,
      max_tokens: 1000,
      system    : 'Tu es un extracteur de specs techniques. Réponds UNIQUEMENT avec du JSON valide, aucun autre texte.',
      messages  : [{
        role: 'user',
        content: [
          {
            type  : 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Pdf }
          },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

function parseJson(text) {
  const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Extraction principale ───────────────────────────────────────────────────

async function extractProduct(product) {
  process.stdout.write(`  ⏳  ${product.name.padEnd(40)}`);

  // 1. Télécharger le PDF
  let base64Pdf;
  try {
    base64Pdf = await fetchPdfAsBase64(product.pdfUrl);
  } catch (e) {
    console.log(`❌  PDF fetch échoué : ${e.message}`);
    return null;
  }

  // 2. Appel Claude
  let apiData;
  try {
    apiData = await callClaudeWithPdf(base64Pdf, buildPrompt(product));
  } catch (e) {
    console.log(`❌  API échouée : ${e.message}`);
    return null;
  }

  // 3. Parse JSON
  const rawText = apiData.content?.[0]?.text || '';
  let specs;
  try {
    specs = parseJson(rawText);
  } catch (e) {
    console.log(`❌  JSON invalide : ${rawText.slice(0, 120)}`);
    return null;
  }

  console.log('✅');
  return {
    name       : product.name,
    type       : product.type,
    ...(product.shape       && { shape      : product.shape }),
    environment: product.environment,
    pdfUrl     : product.pdfUrl,
    ...specs,
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  CamProtect — Extraction specs techniques (Claude API)   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`  Modèle     : ${MODEL}`);
  console.log(`  Produits   : ${PRODUCTS.length}`);
  console.log(`  Sortie     : ${OUT_FILE}\n`);
  console.log('─'.repeat(60));

  // Créer dossier de sortie si nécessaire
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results  = {};
  const failures = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    console.log(`\n[${i + 1}/${PRODUCTS.length}]`);
    const specs = await extractProduct(product);

    if (specs) {
      results[product.key] = specs;
    } else {
      failures.push(product.key);
    }

    // Pause entre les appels (évite rate limit)
    if (i < PRODUCTS.length - 1) await sleep(1200);
  }

  // ── Écriture du fichier de sortie ──────────────────────────────────────
  const output = {
    version     : '1.0',
    extracted_at: new Date().toISOString().split('T')[0],
    total       : Object.keys(results).length,
    products    : results,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  // ── Résumé ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log(`\n✅  ${Object.keys(results).length} produits extraits → ${OUT_FILE}`);

  if (failures.length > 0) {
    console.log(`\n⚠️   ${failures.length} échec(s) :`);
    failures.forEach(k => console.log(`   - ${k}`));
    console.log('\n   → Vérifier les URLs PDF ou relancer pour ces produits.');
  }

  // ── Aperçu ─────────────────────────────────────────────────────────────
  console.log('\n── Aperçu des specs extraites ─────────────────────────────\n');
  for (const [key, data] of Object.entries(results)) {
    console.log(`  ${data.name} [${data.type}]`);
    if (data.focal_lengths) {
      for (const [fl, fov] of Object.entries(data.focal_lengths)) {
        console.log(`    ${fl} → FOV ${fov.fov_h_deg}°H × ${fov.fov_v_deg}°V`);
      }
    }
    if (data.detection_range_m)    console.log(`    Portée : ${data.detection_range_m}m`);
    if (data.detection_angle_h_deg) console.log(`    Angle  : ${data.detection_angle_h_deg}°H`);
    if (data.sound_level_db)       console.log(`    Son    : ${data.sound_level_db} dB`);
  }
  console.log('');
}

main().catch(e => {
  console.error('\n❌  Erreur fatale :', e);
  process.exit(1);
});
