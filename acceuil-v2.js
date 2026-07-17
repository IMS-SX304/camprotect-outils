/* CamProtect — Acceuil V2 : styles sliders, onglets, outils, bandeau */

@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

/* ---- Sliders "Notre sélection" + onglets ---- */
.prod-swiper-outer{ --swiper-theme-color:#ff6a00; padding:4px 52px 42px; }
.swiper-button-prev{ left:6px; }
.swiper-button-next{ right:6px; }
.prod-swiper, .pv-swiper{ overflow:hidden; }
.swiper-slide{ height:auto; display:flex; }
.swiper-slide .pcard{ width:100%; }
.swiper-pagination{ bottom:0 !important; }
.pcard-title{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

@media (max-width:767px){
  .prod-swiper-outer{ padding:4px 0 42px; }
  .swiper-button-prev, .swiper-button-next{ display:none; }
}

/* ---- Onglet actif (pilule noire) ---- */
.pv-tablink.w--current{ background:#111318; border-color:#111318; color:#fff; }

/* ---- Bloc outils gratuits ---- */
.tools-card{ transition:border-color .25s, transform .25s, box-shadow .25s; }
.tools-card:hover{ border-color:#E85D04 !important; transform:translateY(-5px); box-shadow:0 16px 40px rgba(232,93,4,.18); }
.tools-icon-wrap{ transition:transform .25s; }
.tools-card:hover .tools-icon-wrap{ transform:scale(1.1); }

@media(max-width:767px){ .tools-grid{ grid-template-columns:1fr !important; gap:16px !important; } }
@media(max-width:478px){ .tools-section{ padding-top:48px !important; padding-bottom:48px !important; } }

/* ---- Icône mallette du bandeau prestations ---- */
.cta-eyebrow::before{
  content:""; width:14px; height:14px; flex:0 0 auto;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23E85D04' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='7' width='20' height='14' rx='2'/%3E%3Cpath d='M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/%3E%3C/svg%3E") center/contain no-repeat;
}

/* ---- Uniformisation mobile ---- */
/* Empêche le scroll horizontal parasite de la page (les sliders gardent leur swipe interne) */
body{ overflow-x:hidden; }

@media (max-width:600px){
  /* Marges latérales cohérentes */
  .sel-section, .pv-section, .cta-section{ padding-left:16px; padding-right:16px; }

  /* Titres de section adaptés */
  .sel-h2, .pv-h2{ font-size:26px; }

  /* Bandeau prestations : ne déborde plus, bouton pleine largeur */
  .cta-card{ padding:26px 22px; gap:20px; }
  .cta-left{ min-width:0; }
  .cta-h2{ font-size:24px; }
  .cta-sub{ font-size:15px; }
  .cta-btn{ width:100%; justify-content:center; }
}
