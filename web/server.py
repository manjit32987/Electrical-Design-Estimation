"""
Simple local web server launcher for Building Electrical Estimator Web App.
Run this script to launch the app locally in your browser:
    python web/server.py
"""

import http.server
import socketserver
import webbrowser
import os

PORTS_TO_TRY = [8000, 8080, 8085, 8888, 0]
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    for port in PORTS_TO_TRY:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            actual_port = httpd.socket.getsockname()[1]
            url = f"http://localhost:{actual_port}/index.html"
            print(f"[+] Serving Electrical Design Estimator Web App at {url}")
            print("Press Ctrl+C to stop the server.")
            webbrowser.open(url)
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServer stopped.")
            break
        except OSError:
            continue

if __name__ == "__main__":
    main()
