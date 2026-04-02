# CamProtect Planner — Extraction des specs techniques

## Objectif

Ce script (`extract-specs.mjs`) lit les fiches techniques PDF de chaque produit Ajax
hébergées sur le CDN Webflow et en extrait les specs techniques via l'API Claude.

Il produit `src/data/products-specs.json`, source de vérité pour le planner.

## Prérequis

- Node.js 18+ (vérifier : `node -v`)
- Une clé API Anthropic (`sk-ant-...`)

## Lancer l'extraction

```bash
# 1. Cloner le repo
git clone https://github.com/<votre-org>/camprotect-planner.git
cd camprotect-planner

# 2. Définir la clé API
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# 3. Lancer
node extract-specs.mjs
```

## Ce que ça produit

`src/data/products-specs.json` — exemple de structure :

```json
{
  "version": "1.0",
  "extracted_at": "2026-04-02",
  "total": 16,
  "products": {
    "ajax_bulletcam": {
      "name": "Ajax BulletCam",
      "type": "camera",
      "shape": "bullet",
      "environment": "outdoor",
      "ir_range_m": 35,
      "focal_lengths": {
        "2.8mm": { "fov_h_deg": 106, "fov_v_deg": 56, "fov_d_deg": null },
        "4mm":   { "fov_h_deg": 84,  "fov_v_deg": 47, "fov_d_deg": null }
      },
      "power_poe": true,
      "ip_rating": "IP67"
    },
    "ajax_motionprotect": {
      "name": "Ajax MotionProtect",
      "type": "pir_detector",
      "environment": "indoor",
      "detection_range_m": 12,
      "detection_angle_h_deg": 88.5,
      "detection_angle_v_deg": 50,
      "mounting_height_m": 2.4,
      "immunity_pet": false,
      "ip_rating": null
    },
    "ajax_homesiren": {
      "name": "Ajax HomeSiren",
      "type": "siren",
      "environment": "indoor",
      "sound_level_db": 105,
      "sound_range_m": null,
      "flash": true,
      "battery_backup": true
    }
  }
}
```

## Produits traités (16 fiches)

| Produit | Type |
|---|---|
| Ajax BulletCam | Caméra bullet (2.8mm / 4mm) |
| Ajax DomeCam Mini | Caméra dôme (2.8mm / 4mm) |
| Ajax TurretCam | Caméra tourelle (2.8mm / 4mm) |
| Ajax MotionProtect | Détecteur PIR intérieur |
| Ajax MotionProtect Plus | Détecteur PIR intérieur |
| Ajax MotionCam | Détecteur PIR intérieur |
| Ajax MotionCam (PhOD) | Détecteur PIR intérieur |
| Ajax CombiProtect | Détecteur PIR intérieur |
| Ajax MotionProtect Outdoor | Détecteur PIR extérieur |
| Ajax MotionCam Outdoor | Détecteur PIR extérieur |
| Ajax MotionCam Outdoor (PhOD) | Détecteur PIR extérieur |
| Ajax MotionProtect Curtain | Détecteur rideau intérieur |
| Ajax Curtain Outdoor | Détecteur rideau extérieur |
| Ajax DualCurtain Outdoor | Détecteur rideau double extérieur |
| Ajax GlassProtect | Détecteur bris de vitre |
| Ajax HomeSiren | Sirène intérieure |

## Mettre à jour quand un nouveau produit est ajouté

1. Ajouter l'entrée dans le tableau `PRODUCTS` de `extract-specs.mjs`
2. Relancer `node extract-specs.mjs`
3. Committer `src/data/products-specs.json`

