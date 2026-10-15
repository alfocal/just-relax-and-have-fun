# 🕹️ Just Relax and Have Fun 🎨

<div align="center">

> *"Dibuja, relájate y disfruta del pixel art cada semana con amigos."*

[![GitHub Pages](https://img.shields.io/badge/🌐_Galería-GitHub_Pages-6366f1?style=for-the-badge)](https://alfocal.github.io/just-relax-and-have-fun/)
[![Pixel Art Size](https://img.shields.io/badge/Lienzo-32x32_px-f43f5e?style=for-the-badge)](PixelArt/README.md)
[![Palettes](https://img.shields.io/badge/Paletas-Lospec_Random-10b981?style=for-the-badge)](https://lospec.com/palette-list/random)
[![License](https://img.shields.io/badge/Comunidad-Amigos_y_PixelArt-fbbf24?style=for-the-badge)](PixelArt/README.md)

[🖼️ Ver Galería Web Online](https://alfocal.github.io/just-relax-and-have-fun/) • [📜 Ver Reglas del Reto](PixelArt/README.md) • [✨ Cómo Participar](#-cómo-participar)

</div>

---

## 👾 ¿Qué es este repositorio?

**Just Relax and Have Fun** es un espacio creado para compartir retos semanales de **Pixel Art** entre amigos y conocidos.

El objetivo principal no es competir, sino tener una excusa divertida y sin presión para dibujar, aprender técnicas de pixel art en baja resolución, explorar paletas de color insospechadas y ver la creatividad de cada participante ante un mismo tema.

---

## 🌟 Reglas Rápidas del Reto

Cada semana tenemos un nuevo reto publicado en la carpeta [`PixelArt/`](PixelArt/):

```
       ┌────────────────────────────────────────────────────────┐
       │   🎲 TEMA:       1 palabra elegida al azar             │
       │   📏 TAMAÑO:     32 × 32 píxeles                       │
       │   🎨 PALETA:     1 paleta aleatoria de Lospec          │
       │   📅 FRECUENCIA: Reto semanal                          │
       └────────────────────────────────────────────────────────┘
```

> 📖 **Consulta la normativa completa, la plantilla semanal y consejos de exportación en:**
> 👉 [**PixelArt/README.md (Guía y Reglas Oficiales)**](PixelArt/README.md)

---

## 🚀 Cómo Participar

Participar es tan fácil como enviar una **Pull Request**:

1. **Revisa el reto semanal:** Ve a la carpeta `PixelArt/<año>/w<semana>/` y lee el archivo `challenge.md` (o consulta la [Galería Web](https://alfocal.github.io/just-relax-and-have-fun/)).
2. **Crea tu dibujo:** Dibuja a **32x32 px** usando únicamente los colores de la paleta indicada.
3. **Prepara tu carpeta:**
   ```text
   PixelArt/
   └── 2026/
       └── w42/
           └── tu_nombre_de_usuario/
               ├── mi_dibujo.png       <-- PNG reescalado (ej. 256x256 con Nearest Neighbor)
               └── mi_dibujo.aseprite  <-- Archivo de trabajo editable (opcional)
   ```
4. **Envía tu Pull Request:** Abre un PR con el título `W<semana> - <tu_usuario>` y ¡listo! En cuanto se apruebe, tu dibujo aparecerá en la web automáticamente.

---

## 🌐 Galería Web en GitHub Pages

Disponemos de un visor interactivo publicado con GitHub Pages donde puedes ver todas las obras expuestas por semana, explorar las paletas de Lospec usadas, ver detalles de cada autor e inspeccionar los dibujos ampliados con renderizado *pixel-perfect*:

👉 **[Entrar a la Galería de Pixel Art](https://alfocal.github.io/just-relax-and-have-fun/)**

---

## 📁 Estructura del Repositorio

```text
just-relax-and-have-fun/
├── .github/workflows/         # Automatización de despliegue a GitHub Pages
│   └── deploy-pages.yml
├── docs/                      # Archivos de la Galería Web (GitHub Pages)
│   ├── index.html             # Interfaz web retro de la galería
│   ├── style.css              # Estilos pixel art / retro arcade
│   ├── app.js                 # Lógica interactiva y visor modal
│   └── data.json              # Índice generado de retos y obras
├── scripts/
│   └── build_gallery.py       # Generador automático del índice de obras
├── PixelArt/
│   ├── README.md              # Reglas oficiales y guía paso a paso
│   └── 2026/
│       └── w42/
│           ├── challenge.md   # Información del reto (tema y paleta Lospec)
│           └── alfocal/
│               ├── test.png
│               └── test.aseprite
├── .gitignore
└── README.md
```

---

## 🧰 Herramientas Recomendadas

- **Editores de Pixel Art:**
  - [Aseprite](https://www.aseprite.org/)
  - [Pixquare](https://www.pixquare.art)
  - [Lospec Pixel Art Tool](https://lospec.com/pixel-art-maker)
- **Recursos de Paletas:**
  - [Lospec Random Palette](https://lospec.com/palette-list/random)
  - [Lospec Palette List](https://lospec.com/palette-list)

---

<div align="center">
  <sub>Hecho con 🩵, píxeles y ganas de pasar un buen rato.</sub>
</div>
