#!/usr/bin/env python3
"""
scripts/build_gallery.py
Genera el índice `docs/data.json` a partir del contenido de `PixelArt/`.
No duplica ningún archivo en el repositorio: apunta directamente a `PixelArt/...`.

También revisa que la galería entienda las participaciones (archivos fuente sin
imagen, subcarpetas ignoradas...). Con `--strict` termina con error si encuentra
algún problema: así se valida cada Pull Request.
"""

import argparse
import json
import os
import re
import struct
import sys
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIXELART_DIR = os.path.join(ROOT_DIR, "PixelArt")
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
DATA_FILE = os.path.join(DOCS_DIR, "data.json")

IMAGE_EXTENSIONS = {".png", ".gif", ".jpg", ".jpeg", ".webp"}
SOURCE_EXTENSIONS = {".aseprite", ".ase", ".psd", ".kra", ".clip", ".xcf"}

# Sufijos que marcan otra versión del mismo dibujo: gato_32x32.png, gato@8x.png, gato_large.png...
VARIANT_SUFFIX_RE = re.compile(r"[\s_\-@]+(\d+x\d+|x\d+|\d+x|large|grande|big|small|original)$", re.IGNORECASE)
# Timelapse del proceso de dibujo: gato_timelapse.gif, gato-time-lapse_8x.gif...
TIMELAPSE_RE = re.compile(r"[\s_\-@]*time-?lapse", re.IGNORECASE)
# Carpetas duplicadas por el explorador de archivos: "alfocal copia", "alfocal copy 2"...
DUPLICATE_DIR_RE = re.compile(r"\s(copia|copy)(\s\d+)?$", re.IGNORECASE)
# Colores de la paleta, escritos entre comillas invertidas: `#2e222f`
HEX_COLOR_RE = re.compile(r"`(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))`")

# Problemas encontrados durante la generación: (nivel, ruta relativa, mensaje)
problems = []

def report(level, path, message):
    problems.append((level, os.path.relpath(path, ROOT_DIR), message))

def parse_challenge_md(filepath):
    """Extrae metadatos del challenge.md de forma robusta y flexible."""
    data = {
        "title": "Reto Pixel Art",
        "theme": "Libre",
        "dates": "",
        "palette": {
            "name": "Lospec Random",
            "url": "https://lospec.com/palette-list/random",
            "colors": []
        }
    }

    if not os.path.exists(filepath):
        return data

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except OSError as e:
        print(f"Advertencia al leer {filepath}: {e}")
        return data

    for line in content.splitlines():
        line_str = line.strip()

        # Título: primer encabezado #
        if line_str.startswith("#") and data["title"] == "Reto Pixel Art":
            clean_title = re.sub(r"^#+\s*", "", line_str).strip()
            if clean_title:
                data["title"] = clean_title
            continue

        if ":" not in line_str:
            continue

        key_part, val_part = line_str.split(":", 1)
        # Solo letras: "- **💡 Tema" -> "tema", "- Autor de la paleta" -> "autordelapaleta"
        key = re.sub(r"[\W\d_]+", "", key_part.lower())

        if key.startswith("tema"):
            val = val_part.replace("*", "").strip()
            if val:
                data["theme"] = val
        elif key.startswith("fecha"):
            val = val_part.replace("*", "").strip()
            if val:
                data["dates"] = val
        elif key.startswith("paleta"):
            rest = val_part.strip()
            link_m = re.search(r"\[([^\]]+)\]\((https?://[^\)]+)\)", rest)
            if link_m:
                data["palette"]["name"] = link_m.group(1).strip()
                data["palette"]["url"] = link_m.group(2).strip()
            else:
                clean_name = rest.replace("*", "").strip()
                if clean_name:
                    data["palette"]["name"] = clean_name

    unique_colors = []
    for color in HEX_COLOR_RE.findall(content):
        c = color.lower()
        if c not in unique_colors:
            unique_colors.append(c)
    data["palette"]["colors"] = unique_colors

    return data

def image_size(filepath):
    """Devuelve (ancho, alto) de un PNG o GIF, o None si no se puede leer."""
    try:
        with open(filepath, "rb") as f:
            header = f.read(24)
    except OSError:
        return None
    if header.startswith(b"\x89PNG\r\n\x1a\n") and header[12:16] == b"IHDR":
        return struct.unpack(">II", header[16:24])
    if header[:6] in (b"GIF87a", b"GIF89a"):
        return struct.unpack("<HH", header[6:10])
    return None

def gif_frame_count(filepath):
    """Cuenta los fotogramas de un GIF recorriendo sus bloques (0 si no se puede leer)."""
    try:
        with open(filepath, "rb") as f:
            data = f.read()
    except OSError:
        return 0
    if len(data) < 13 or data[:6] not in (b"GIF87a", b"GIF89a"):
        return 0

    pos = 13
    if data[10] & 0x80:  # Tabla de colores global
        pos += 3 * 2 ** ((data[10] & 0x07) + 1)

    frames = 0
    while pos < len(data):
        block = data[pos]
        if block == 0x21:  # Extensión: introductor + etiqueta
            pos += 2
        elif block == 0x2C and pos + 10 < len(data):  # Fotograma: descriptor (+ tabla local) + código LZW
            frames += 1
            packed = data[pos + 9]
            pos += 10
            if packed & 0x80:
                pos += 3 * 2 ** ((packed & 0x07) + 1)
            pos += 1
        else:  # Fin del archivo (0x3B) o datos inesperados
            break
        # Saltar los sub-bloques de datos hasta el terminador de tamaño 0
        while pos < len(data) and data[pos]:
            pos += data[pos] + 1
        pos += 1
    return frames

def design_name(filename):
    """Nombre del diseño al que pertenece un archivo: sin extensión ni sufijos de tamaño o de timelapse."""
    stem = os.path.splitext(filename)[0]
    return VARIANT_SUFFIX_RE.sub("", TIMELAPSE_RE.sub("", stem)) or stem

def build_submission(author, author_path, rel_dir):
    """Agrupa los archivos de un autor en obras: una imagen principal, su GIF, su timelapse, sus versiones y sus fuentes."""
    images = []
    timelapses = []
    sources = []

    for fname in sorted(os.listdir(author_path)):
        if fname.startswith("."):
            continue
        fpath = os.path.join(author_path, fname)
        if os.path.isdir(fpath):
            report("error", fpath, "Las subcarpetas se ignoran: pon los archivos directamente en la carpeta del autor.")
            continue

        ext = os.path.splitext(fname)[1].lower()
        entry = {"filename": fname, "path": f"{rel_dir}/{fname}"}

        if ext in IMAGE_EXTENSIONS:
            size = image_size(fpath)
            if size:
                entry["width"], entry["height"] = size
            if ext == ".gif" and gif_frame_count(fpath) > 1:
                entry["animated"] = True
            if TIMELAPSE_RE.search(os.path.splitext(fname)[0]):
                timelapses.append(entry)
            else:
                images.append(entry)
        elif ext in SOURCE_EXTENSIONS:
            sources.append(entry)

    # gato.png, gato_32x32.png y gato.gif son el mismo dibujo: se muestra la versión
    # estática más grande y el GIF animado (si lo hay) se ve al pulsar un botón
    groups = {}
    for img in images:
        groups.setdefault(design_name(img["filename"]).lower(), []).append(img)

    def area(img):
        return img.get("width", 0) * img.get("height", 0)

    artworks = {}
    for key, group in groups.items():
        still = [i for i in group if not i.get("animated")]
        animated = [i for i in group if i.get("animated")]
        # Si solo hay GIF, es la imagen principal y la web muestra su primer fotograma
        main = max(still or animated, key=area)
        animation = max(animated, key=area) if still and animated else None
        artworks[key] = {
            "name": design_name(main["filename"]),
            "image": main,
            "animation": animation,
            "timelapse": None,
            "variants": [i for i in group if i is not main and i is not animation],
            "sources": []
        }

    def owner(entry):
        """Obra a la que acompaña un timelapse o un archivo fuente (None si no se sabe)."""
        key = design_name(entry["filename"]).lower()
        if key in artworks:
            return artworks[key]
        if len(artworks) == 1:
            # Con un único diseño no hay duda de a qué imagen pertenece
            return next(iter(artworks.values()))
        return None

    # gato_timelapse.gif acompaña a gato.png; si hay varios, el más grande y el resto para descargar
    for timelapse in sorted(timelapses, key=area, reverse=True):
        artwork = owner(timelapse)
        if artwork is None:
            report("error", os.path.join(author_path, timelapse["filename"]),
                   "No hay ninguna imagen con el mismo nombre: llama igual al timelapse y a su imagen (p. ej. gato.png + gato_timelapse.gif).")
        elif artwork["timelapse"] is None:
            artwork["timelapse"] = timelapse
        else:
            artwork["variants"].append(timelapse)

    # gato.aseprite acompaña a gato.png
    for src in sources:
        artwork = owner(src)
        if artwork is None:
            report("error", os.path.join(author_path, src["filename"]),
                   "No hay ninguna imagen con el mismo nombre: llama igual al archivo fuente y a su imagen (p. ej. gato.png + gato.aseprite).")
        else:
            artwork["sources"].append(src)

    if not artworks:
        report("error", author_path, "No hay ninguna imagen (.png, .gif...) en la carpeta del autor.")
        return None

    return {
        "author": author,
        "artworks": list(artworks.values())
    }

def build_gallery():
    """Genera docs/data.json y devuelve el número de errores encontrados."""
    print("🎨 Construyendo índice de la galería Pixel Art...")
    os.makedirs(DOCS_DIR, exist_ok=True)

    challenges = []

    if not os.path.exists(PIXELART_DIR):
        print(f"No se encontró el directorio {PIXELART_DIR}")
        return 0

    # Buscar años en PixelArt (carpetas numéricas)
    years = sorted([d for d in os.listdir(PIXELART_DIR) if os.path.isdir(os.path.join(PIXELART_DIR, d)) and d.isdigit()], reverse=True)

    for year in years:
        year_path = os.path.join(PIXELART_DIR, year)
        weeks = sorted([w for w in os.listdir(year_path) if os.path.isdir(os.path.join(year_path, w)) and w.lower().startswith("w")],
                       key=lambda x: int(re.sub(r"\D", "", x) or 0), reverse=True)

        for week in weeks:
            week_path = os.path.join(year_path, week)
            challenge_md = os.path.join(week_path, "challenge.md")
            if not os.path.exists(challenge_md):
                report("aviso", week_path, "Falta challenge.md: se usarán un tema y una paleta genéricos.")
            meta = parse_challenge_md(challenge_md)

            week_num = int(re.sub(r"\D", "", week) or 0)
            challenge_entry = {
                "year": year,
                "week": week,
                "weekNumber": week_num,
                "title": meta.get("title") or f"Reto Semana {week_num} ({year})",
                "theme": meta.get("theme") or "Tema semanal",
                "dates": meta.get("dates") or "",
                "palette": meta.get("palette"),
                "submissions": []
            }

            # Buscar autores dentro de la semana
            subdirs = sorted([
                s for s in os.listdir(week_path)
                if os.path.isdir(os.path.join(week_path, s))
                and not s.startswith(".")
            ])

            for author in subdirs:
                author_path = os.path.join(week_path, author)
                if DUPLICATE_DIR_RE.search(author):
                    report("aviso", author_path, "Carpeta ignorada: parece una copia duplicada.")
                    continue
                submission = build_submission(author, author_path, f"PixelArt/{year}/{week}/{author}")
                if submission:
                    challenge_entry["submissions"].append(submission)

            challenges.append(challenge_entry)

    gallery_data = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalChallenges": len(challenges),
        "totalSubmissions": sum(len(c["submissions"]) for c in challenges),
        "totalArtworks": sum(len(s["artworks"]) for c in challenges for s in c["submissions"]),
        "challenges": challenges
    }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(gallery_data, f, indent=2, ensure_ascii=False)

    nojekyll_path = os.path.join(DOCS_DIR, ".nojekyll")
    if not os.path.exists(nojekyll_path):
        with open(nojekyll_path, "w", encoding="utf-8") as f:
            f.write("# NoJekyll\n")

    print(f"✅ Índice generado en {DATA_FILE}")
    print(f"📊 Estadísticas: {gallery_data['totalChallenges']} retos, {gallery_data['totalArtworks']} obras.")

    print_problems()
    return sum(1 for level, _, _ in problems if level == "error")

def print_problems():
    in_actions = os.environ.get("GITHUB_ACTIONS") == "true"
    for level, path, message in problems:
        if in_actions:
            # Anotaciones que GitHub muestra junto a los archivos de la Pull Request
            command = "error" if level == "error" else "warning"
            print(f"::{command} file={path}::{message}")
        else:
            icon = "❌" if level == "error" else "⚠️"
            print(f"{icon} {path}: {message}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Genera docs/data.json y revisa las participaciones.")
    parser.add_argument("--strict", action="store_true", help="Termina con error si alguna participación tiene problemas.")
    args = parser.parse_args()

    errors = build_gallery()
    if args.strict and errors:
        print(f"🚫 {errors} error(es): revisa los mensajes de arriba.")
        sys.exit(1)
