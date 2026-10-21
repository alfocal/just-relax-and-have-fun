# 🎨 Reglas de los Retos Semanales de Pixel Art

¡Bienvenido/a al rincón de pixel art de **Just Relax and Have Fun**! 👾
Aquí nos reunimos cada semana para practicar, experimentar y sobre todo pasarlo bien dibujando en baja resolución. No importa tu nivel: el objetivo es relajarse, aprender y compartir.

---

## 📜 Reglas Generales del Reto

Cada semana se publicará un nuevo desafío con las siguientes condiciones fijas:

| Parámetro | Regla |
| :--- | :--- |
| **📏 Tamaño del lienzo** | Exactamente **32 × 32 píxeles** (¡la magia de la baja resolución!). |
| **🎲 Tema** | **Una palabra al azar** elegida como tema central del reto. |
| **🎨 Paleta de color** | **Una paleta aleatoria** obtenida de [Lospec Random Palette](https://lospec.com/palette-list/random). *(Solo se pueden usar los colores de dicha paleta)*. |
| **📅 Frecuencia** | Reto semanal (renovado cada semana). |

---

## 🛠️ Cómo Generar el Reto de una Nueva Semana

Cualquier miembro del grupo u organizador de turno puede preparar el reto de la semana siguiendo estos pasos:

1. **Obtener el tema aleatorio**:
   - Genera una palabra al azar usando cualquier generador (por ejemplo [PalabrasAleatorias](https://palabrasaleatorias.com/) o similar).
2. **Obtener la paleta de colores**:
   - Entra en [https://lospec.com/palette-list/random](https://lospec.com/palette-list/random) y anota el nombre de la paleta, su autor, su URL y los códigos HEX de los colores.
3. **Crear la carpeta y el archivo de la semana**:
   - Estructura de carpetas: `PixelArt/<AÑO>/w<Nº_SEMANA>/`
     *Ejemplo:* `PixelArt/2026/w42/`
   - Dentro de esa carpeta, crea el archivo `challenge.md` usando la plantilla a continuación.

### 📋 Plantilla para `challenge.md`

Copia y pega este contenido en el `challenge.md` de la semana correspondiente:

```markdown
# 🏆 Reto Pixel Art - Semana [Nº] ([Año])

- **📅 Fechas:** [Fecha Inicio] - [Fecha Fin]
- **💡 Tema:** **[PALABRA_ALEATORIA]**
- **📏 Tamaño:** 32 × 32 píxeles
- **🎨 Paleta:** [[Nombre de la Paleta]](https://lospec.com/palette-list/[slug-paleta]) ([Nº] colores)
  - Autor de la paleta: [Nombre del creador en Lospec]
  - Colores (HEX): `#HEX1`, `#HEX2`, `#HEX3`, `#HEX4`...

---

## 🎨 Muestra de Paleta
<!-- Puedes incluir los cuadritos de color si lo deseas -->
| Color | Código HEX |
| :--- | :--- |
| Color 1 | `#000000` |
| Color 2 | `#ffffff` |

---

## 👥 Participaciones
Las obras de los participantes se irán enlazando aquí conforme se añadan mediante Pull Request:

- [@usuario1](usuario1/): [Título o descripción opcional]
- [@usuario2](usuario2/): [Título o descripción opcional]
```

---

## 🚀 Cómo Participar y Subir tu Dibujo

Para unirte al reto de la semana en curso:

### 1. Prepara tu carpeta personal
Dentro de la carpeta de la semana correspondiente (`PixelArt/<AÑO>/w<SEMANA>/`), crea una subcarpeta con tu nombre de usuario de GitHub:

```text
PixelArt/
└── 2026/
    └── w42/
        ├── challenge.md
        └── tu_usuario/          <-- Tu carpeta
            ├── dibujo.png       <-- Tu imagen PNG (agrandada)
            └── dibujo.aseprite  <-- Archivo fuente (opcional)
```

### 2. Formato de los archivos
- **🖼️ Imagen PNG (Recomendado/Obligatorio):**
  - Guarda tu obra en formato `.png`.
  - **Agrandado / Reescalado:** Como 32×32 píxeles se ve diminuto en pantallas modernas, exporta una versión escalada a **4x (128×128)**, **8x (256×256)** o **16x (512×512)**.
  - ⚠️ **Muy Importante:** Al reescalar o exportar, usa el filtro de interpolación **Vecino más próximo (*Nearest Neighbor* / Por aproximación)** para que los píxeles se mantengan 100% nítidos y no se vean borrosos.
  - Si quieres, también puedes incluir la versión a 32×32 original (ej. `dibujo_32x32.png` y `dibujo_large.png`). Los archivos con el mismo nombre y un sufijo de tamaño (`_32x32`, `_8x`, `@8x`, `_large`, `_grande`...) se muestran como una sola obra.
- **🎞️ GIF animado (Opcional):**
  - ¿Te animas a darle movimiento? Sube tu obra como `.gif` animado, con los mismos colores de la paleta. En la galería se ve quieta y se reproduce al pulsar el botón **▶ GIF**.
  - Puedes exportarlo a 32×32 o escalado (en Aseprite: *Archivo → Exportar como…* con formato `.gif` y el escalado que quieras); los GIF pequeños se amplían en la galería sin perder nitidez.
  - Si subes la versión estática y la animada con el mismo nombre (`dibujo.png` + `dibujo.gif`), se muestran como una sola obra: se ve la estática y **▶ GIF** cambia a la animada. Si solo subes el GIF, se ve su primer fotograma.
- **⏱️ Timelapse (Opcional):**
  - ¿Quieres enseñar cómo lo has dibujado? Sube el timelapse del proceso como `.gif` con el mismo nombre que tu imagen y el sufijo `_timelapse` (`dibujo.png` + `dibujo_timelapse.gif`). Es independiente del GIF animado: puedes subir uno, otro o los dos.
  - En la galería aparece el botón **▶ TIMELAPSE** para verlo.
- **💾 Fichero fuente (Opcional):**
  - Si quieres compartir tu proceso o capas, añade el archivo de origen de tu programa: `.aseprite`, `.psd`, `.kra`, etc.
  - Ponle el mismo nombre que a su imagen (`dibujo.png` + `dibujo.aseprite`) para que la galería sepa a qué obra pertenece.

### 3. ¿Más de un diseño en la misma semana?
¡Claro! Pon todos en tu carpeta, directamente (sin subcarpetas), cada uno con su propio nombre:

```text
tu_usuario/
├── gato.png
├── gato.aseprite
├── perro.png
└── perro.aseprite
```

### 4. Compruébalo en local (opcional)
Antes de abrir la Pull Request puedes ver cómo quedará la galería con tu dibujo. Solo necesitas Python 3; desde la carpeta del repositorio:

```bash
python3 scripts/preview.py
```

Se abre la galería en tu navegador (`http://localhost:8000/`), igual que la web publicada. En la terminal verás si la revisión de la PR va a encontrar algún problema con tus archivos. Si cambias algo en tu carpeta, recarga la página. Para salir, pulsa `Ctrl+C`.

¿Quieres verlo en el móvil? Usa `python3 scripts/preview.py --movil` y abre en el móvil la dirección que aparece (tienen que estar en la misma wifi).

### 5. Enviar mediante Pull Request
1. Crea una nueva rama en git (ej. `git checkout -b w42-tu-usuario`).
2. Añade tu carpeta con tus archivos.
3. Haz push a tu fork o al repositorio.
4. Abre una **Pull Request** con un título descriptivo (ej: `W42 - Participación de tu_usuario`).
5. Se revisará automáticamente que la galería entienda tus archivos (por ejemplo, que cada archivo fuente tenga su imagen). Si algo falla, verás el motivo en la propia PR.
6. ¡Una vez revisada y aprobada, tu obra aparecerá automáticamente en la galería web!

---

## 🧰 Herramientas Recomendadas

- **Editores de Pixel Art:**
  - [Aseprite](https://www.aseprite.org/)
  - [Pixquare](https://www.pixquare.art)
  - [Lospec Pixel Art Tool](https://lospec.com/pixel-art-maker)

---

¡Disfruta, experimenta y diviértete creando! 🌟
