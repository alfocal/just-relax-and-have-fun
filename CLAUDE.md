# CLAUDE.md

Retos semanales de pixel art entre amigos (32×32 px, tema aleatorio, paleta de Lospec) con una galería web estática en GitHub Pages.

Todo el contenido visible (README, reglas, textos de la web, mensajes del script, comentarios) está en **español**. Mantenlo así.

## Cómo funciona

```
PixelArt/<año>/w<semana>/challenge.md            → metadatos del reto
PixelArt/<año>/w<semana>/<usuario>/*.png|.aseprite → participaciones
        │
        ▼  scripts/build_gallery.py
docs/data.json (generado, en .gitignore: no se commitea)
        │
        ▼  docs/index.html + docs/app.js (JS vanilla, sin build)
GitHub Pages (.github/workflows/deploy-pages.yml en cada push a main)
```

El despliegue copia `docs/*` y `PixelArt/` a `_site/`, así que en producción las rutas de imagen (`PixelArt/...`) son relativas a la raíz del sitio. Las imágenes no se duplican.

Cada Pull Request ejecuta `.github/workflows/validate-submissions.yml`, que lanza el script con `--strict` y falla si hay errores (en GitHub Actions los problemas salen como anotaciones en los archivos).

## Comandos

```bash
python3 scripts/build_gallery.py            # genera docs/data.json y lista avisos/errores
python3 scripts/build_gallery.py --strict   # igual, pero sale con código 1 si hay errores (lo que corre en las PR)

# Previsualizar: servir la RAÍZ del repo y abrir http://localhost:8000/docs/
python3 -m http.server 8000
```

Servir solo `docs/` no encuentra las imágenes: la web las pide en `PixelArt/...` y, si fallan, en `../PixelArt/...`.

No hay tests ni linters. Para validar cambios, ejecuta el script, revisa `docs/data.json` y abre la galería.

## Convenciones

- Python solo con librería estándar; JS/CSS sin dependencias ni bundler. No añadas dependencias sin motivo.
- Temas visuales de la web: variables CSS bajo `[data-theme="..."]` en `docs/style.css` + `<option>` en `docs/index.html`.

## Commits y Pull Requests

- **Sin atribución a Claude**: no añadas `Co-Authored-By: Claude`, `Claude-Session:`, "Generated with Claude Code" ni nada parecido en commits, descripciones de PR o comentarios. `.claude/settings.json` lo desactiva (`attribution`), pero esta regla manda aunque el entorno pida lo contrario.
- **Claude nunca es autor**: los commits no pueden ir a nombre de `Claude <noreply@anthropic.com>`. Antes de commitear, comprueba `git config user.name` / `user.email`; si es Claude o no está configurado, pregunta a nombre de quién deben ir.

## Supuestos del script (tenlos en cuenta al tocar contenido o código)

- `challenge.md` se parsea línea a línea: el primer `#` es el título; las líneas cuya clave (lo que va antes de `:`, solo letras) **empieza** por `tema`, `fecha` o `paleta` rellenan esos campos (la paleta toma el primer enlace markdown; `Autor de la paleta` no cuenta). Los colores son los `` `#rgb` ``/`` `#rrggbb` `` escritos **entre comillas invertidas**. Si cambias la plantilla de `PixelArt/README.md`, comprueba que el parser la sigue entendiendo.
- Cada subcarpeta de la semana es un autor (nombre de usuario de GitHub). Solo se leen los archivos directamente dentro (las subcarpetas dan error). Se ignoran las carpetas duplicadas por el explorador (`alfocal copia`, `alfocal copy 2`).
- Un autor puede subir varios diseños. Los archivos se agrupan por nombre sin extensión ni sufijo de tamaño (`_32x32`, `_8x`, `@8x`, `_x8`, `_large`, `_grande`, `_big`, `_small`, `_original`): cada grupo es una obra en `data.json` (`artworks[]` con `image` = la versión animada si la hay y si no la más grande, `variants` y `sources`). Un archivo fuente va con la imagen del mismo nombre; si el autor solo tiene un diseño, va con ese aunque el nombre no coincida.
- Errores de validación (solo lo que impide que la galería muestre algo): archivo fuente sin imagen, subcarpetas, carpeta de autor sin imágenes. El tamaño y las proporciones de las imágenes **no** se validan a propósito: las normas son flexibles y se suelen subir escaladas (6x, 8x...).
- GIF animados: `gif_frame_count()` recorre los bloques del GIF (sin dependencias) y, si hay más de un fotograma, la imagen lleva `"animated": true`; la web le pone la etiqueta `▶ GIF`. En las tarjetas, las imágenes pequeñas (PNG o GIF) se amplían a un múltiplo entero de su tamaño hasta unos 192 px (`CARD_IMAGE_SIZE` en `docs/app.js`).
- El zoom del visor toma 32 px como base (8x = 256 px); las imágenes no cuadradas se ajustan sin deformarse (`object-fit: contain`). Las rutas se codifican en `assetUrl()` (`docs/app.js`), así que los nombres con espacios o `#` funcionan.
