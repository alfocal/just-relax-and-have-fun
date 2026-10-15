#!/usr/bin/env python3
"""
scripts/build_gallery.py
Genera el índice `docs/data.json` a partir del contenido de `PixelArt/`.
No duplica ningún archivo en el repositorio: apunta directamente a `PixelArt/...`.
"""

import os
import re
import json
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIXELART_DIR = os.path.join(ROOT_DIR, "PixelArt")
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
DATA_FILE = os.path.join(DOCS_DIR, "data.json")

IMAGE_EXTENSIONS = {".png", ".gif", ".jpg", ".jpeg", ".webp"}
SOURCE_EXTENSIONS = {".aseprite", ".ase", ".psd", ".kra", ".clip", ".xcf"}

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
            lines = f.readlines()

        for line in lines:
            line_str = line.strip()
            
            # Título: primer encabezado #
            if line_str.startswith("#") and data["title"] == "Reto Pixel Art":
                clean_title = re.sub(r"^#+\s*", "", line_str).strip()
                if clean_title:
                    data["title"] = clean_title
                continue

            if ":" in line_str:
                key_part, val_part = line_str.split(":", 1)
                key_lower = key_part.lower()

                # Tema (solo si "tema" está antes de los dos puntos)
                if "tema" in key_lower:
                    val = val_part.replace("*", "").strip()
                    if val:
                        data["theme"] = val
                    continue

                # Fechas
                if "fecha" in key_lower:
                    val = val_part.replace("*", "").strip()
                    if val:
                        data["dates"] = val
                    continue

                # Paleta
                if "paleta" in key_lower:
                    rest = val_part.strip()
                    link_m = re.search(r"\[([^\]]+)\]\((https?://[^\)]+)\)", rest)
                    if link_m:
                        data["palette"]["name"] = link_m.group(1).strip()
                        data["palette"]["url"] = link_m.group(2).strip()
                    else:
                        clean_name = rest.replace("*", "").strip()
                        if clean_name:
                            data["palette"]["name"] = clean_name
                    continue

        # Extraer colores HEX encontrados en el documento
        with open(filepath, "r", encoding="utf-8") as f:
            full_content = f.read()

        hex_colors = re.findall(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b", full_content)
        seen = set()
        unique_colors = []
        for color in hex_colors:
            c = color.lower()
            if c not in seen:
                seen.add(c)
                unique_colors.append(c)
        data["palette"]["colors"] = unique_colors

    except Exception as e:
        print(f"Advertencia al parsear {filepath}: {e}")

    return data

def build_gallery():
    print("🎨 Construyendo índice de la galería Pixel Art...")
    os.makedirs(DOCS_DIR, exist_ok=True)

    challenges = []
    
    if not os.path.exists(PIXELART_DIR):
        print(f"No se encontró el directorio {PIXELART_DIR}")
        return

    # Buscar años en PixelArt (carpetas numéricas)
    years = sorted([d for d in os.listdir(PIXELART_DIR) if os.path.isdir(os.path.join(PIXELART_DIR, d)) and d.isdigit()], reverse=True)

    for year in years:
        year_path = os.path.join(PIXELART_DIR, year)
        weeks = sorted([w for w in os.listdir(year_path) if os.path.isdir(os.path.join(year_path, w)) and w.lower().startswith("w")],
                       key=lambda x: int(re.sub(r"\D", "", x) or 0), reverse=True)

        for week in weeks:
            week_path = os.path.join(year_path, week)
            challenge_md = os.path.join(week_path, "challenge.md")
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
                and "copia" not in s.lower()
                and "copy" not in s.lower()
            ])

            for author in subdirs:
                author_path = os.path.join(week_path, author)
                submission = {
                    "author": author,
                    "images": [],
                    "sources": []
                }

                for fname in sorted(os.listdir(author_path)):
                    if fname.startswith("."):
                        continue
                    ext = os.path.splitext(fname)[1].lower()
                    rel_path = f"PixelArt/{year}/{week}/{author}/{fname}"

                    if ext in IMAGE_EXTENSIONS:
                        submission["images"].append({
                            "filename": fname,
                            "path": rel_path
                        })
                    elif ext in SOURCE_EXTENSIONS:
                        submission["sources"].append({
                            "filename": fname,
                            "path": rel_path
                        })

                if submission["images"] or submission["sources"]:
                    challenge_entry["submissions"].append(submission)

            challenges.append(challenge_entry)

    gallery_data = {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "totalChallenges": len(challenges),
        "totalSubmissions": sum(len(c["submissions"]) for c in challenges),
        "totalArtworks": sum(sum(len(s["images"]) for s in c["submissions"]) for c in challenges),
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

if __name__ == "__main__":
    build_gallery()
