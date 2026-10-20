#!/usr/bin/env python3
"""
scripts/preview.py
Previsualiza la galería en local antes de abrir una Pull Request.

Sirve la web igual que GitHub Pages (los archivos de `docs/` en la raíz y
`PixelArt/` al lado) sin copiar nada, y regenera `docs/data.json` cada vez que
se recarga la página: añade o cambia tus dibujos y pulsa recargar.

    python3 scripts/preview.py            # abre http://localhost:8000/
    python3 scripts/preview.py --movil    # también desde el móvil (misma wifi)
"""

import argparse
import contextlib
import http.server
import io
import os
import posixpath
import socket
import sys
import threading
import urllib.parse
import webbrowser

import build_gallery
from build_gallery import DOCS_DIR, ROOT_DIR

regenerate_lock = threading.Lock()
last_problems = None

def regenerate(verbose=False):
    """Regenera docs/data.json y muestra los problemas si han cambiado desde la última vez."""
    global last_problems
    build_gallery.problems.clear()
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        errors = build_gallery.build_gallery()

    if verbose:
        print(output.getvalue(), end="")
    elif build_gallery.problems != last_problems:
        print("\n🔄 Han cambiado las participaciones:")
        build_gallery.print_problems()
    else:
        return

    last_problems = list(build_gallery.problems)
    if errors:
        print(f"🚫 {errors} error(es): la revisión de la Pull Request fallará. Revisa los mensajes de arriba.")
    else:
        print("✅ Sin errores: la revisión de la Pull Request pasará.")

class PreviewHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Como en GitHub Pages: PixelArt/ junto a los archivos de docs/.
        # Se normaliza antes de decidir para que "/PixelArt/../" no salga de la carpeta.
        url_path = urllib.parse.unquote(path.split("?", 1)[0].split("#", 1)[0])
        in_pixelart = (posixpath.normpath(url_path) + "/").startswith("/PixelArt/")
        self.directory = ROOT_DIR if in_pixelart else DOCS_DIR
        return super().translate_path(path)

    def do_GET(self):
        # La web pide data.json en cada carga: así ve siempre lo que hay ahora en PixelArt/
        if self.path.split("?", 1)[0] == "/data.json":
            with regenerate_lock:
                regenerate()
                super().do_GET()
        else:
            super().do_GET()

    def end_headers(self):
        # Sin caché: al recargar siempre se ven los últimos cambios
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_request(self, code="-", size="-"):
        # Solo se muestran las peticiones que fallan (p. ej. una imagen que no se encuentra)
        if isinstance(code, int) and code >= 400 and not self.path.startswith("/favicon.ico"):
            print(f"⚠️  {int(code)} {urllib.parse.unquote(self.path)}")

    def log_error(self, format, *args):
        pass  # El fallo ya lo muestra log_request

def port_in_use(port):
    """Comprueba si ya hay otro servidor escuchando en ese puerto (IPv4 o IPv6)."""
    for family, address in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                if s.connect_ex((address, port)) == 0:
                    return True
        except OSError:
            pass
    return False

def start_server(host, first_port):
    for port in range(first_port, first_port + 20):
        if port_in_use(port):
            continue
        try:
            return http.server.ThreadingHTTPServer((host, port), PreviewHandler)
        except OSError:
            continue
    sys.exit(f"🚫 No hay ningún puerto libre entre {first_port} y {first_port + 19}.")

def lan_ip():
    """IP del ordenador en la red local. Conectar un socket UDP no envía nada: solo elige la interfaz."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("192.0.2.1", 80))
            return s.getsockname()[0]
    except OSError:
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Previsualiza la galería en local, igual que en GitHub Pages.")
    parser.add_argument("--puerto", type=int, default=8000, help="Puerto en el que servir la web (por defecto 8000; si está ocupado, el siguiente libre).")
    parser.add_argument("--movil", action="store_true", help="Acepta conexiones de otros dispositivos de tu red para probar en el móvil.")
    parser.add_argument("--sin-navegador", action="store_true", help="No abre el navegador automáticamente.")
    args = parser.parse_args()

    # Que los mensajes salgan al momento aunque la salida no sea una terminal
    sys.stdout.reconfigure(line_buffering=True)
    regenerate(verbose=True)

    server = start_server("0.0.0.0" if args.movil else "127.0.0.1", args.puerto)
    port = server.server_address[1]
    url = f"http://localhost:{port}/"

    print(f"\n👀 Galería en {url}")
    if args.movil:
        ip = lan_ip()
        if ip:
            print(f"📱 Desde el móvil (en la misma wifi): http://{ip}:{port}/")
        else:
            print("📱 No se ha podido averiguar la IP del ordenador en tu red.")
    print("   Recarga la página para ver los cambios de PixelArt/. Ctrl+C para salir.")

    if not args.sin_navegador:
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Previsualización cerrada.")
    finally:
        server.server_close()
