#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bootstrap script: downloads npm and installs project dependencies via agy-node."""
import urllib.request, tarfile, os, subprocess, sys, shutil
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

WORK_DIR = os.path.dirname(os.path.abspath(__file__))
NPM_DIR = os.path.join(WORK_DIR, "_npm")
NODE_CMD = "agy-node"

def download_npm():
    if os.path.exists(os.path.join(NPM_DIR, "bin", "npm-cli.js")):
        print("[✓] npm already downloaded")
        return
    print("[→] Downloading npm 10.9.2 ...")
    url = "https://registry.npmjs.org/npm/-/npm-10.9.2.tgz"
    tgz_path = os.path.join(WORK_DIR, "npm.tgz")
    urllib.request.urlretrieve(url, tgz_path)
    print("[→] Extracting npm ...")
    with tarfile.open(tgz_path, "r:gz") as t:
        t.extractall(WORK_DIR)
    # Extracted to ./package
    extracted = os.path.join(WORK_DIR, "package")
    if os.path.exists(NPM_DIR):
        shutil.rmtree(NPM_DIR)
    shutil.move(extracted, NPM_DIR)
    os.remove(tgz_path)
    print("[✓] npm extracted to", NPM_DIR)

def run_npm(args, cwd=None):
    npm_cli = os.path.join(NPM_DIR, "bin", "npm-cli.js").replace('\\', '/')
    cmd_str = f'agy-node "{npm_cli}" ' + ' '.join(f'"{a}"' if ' ' in a else a for a in args)
    print(f"[->] Running: {cmd_str}")
    result = subprocess.run(cmd_str, cwd=cwd or WORK_DIR, shell=True)
    if result.returncode != 0:
        print(f"[X] Command failed with code {result.returncode}")
        sys.exit(result.returncode)
    return result

def run_npx(args, cwd=None):
    npx_cli = os.path.join(NPM_DIR, "bin", "npx-cli.js").replace('\\', '/')
    cmd_str = f'agy-node "{npx_cli}" ' + ' '.join(f'"{a}"' if ' ' in a else a for a in args)
    print(f"[->] Running: {cmd_str}")
    result = subprocess.run(cmd_str, cwd=cwd or WORK_DIR, shell=True)
    if result.returncode != 0:
        print(f"[X] Command failed with code {result.returncode}")
        sys.exit(result.returncode)
    return result

if __name__ == "__main__":
    download_npm()
    
    # Test npm
    run_npm(["--version"])
    
    print("\n[→] Scaffolding Vite + React project ...")
    run_npx(["-y", "create-vite@latest", ".", "--template", "react"], cwd=WORK_DIR)
    
    print("\n[→] Installing base dependencies ...")
    run_npm(["install"], cwd=WORK_DIR)
    
    print("\n[→] Installing Tailwind CSS and dependencies ...")
    run_npm(["install", "-D", 
             "tailwindcss@3", 
             "postcss", 
             "autoprefixer",
             "@tailwindcss/forms",
    ], cwd=WORK_DIR)
    
    print("\n[→] Installing app dependencies ...")
    run_npm(["install", 
             "leaflet",
             "react-leaflet",
             "axios",
             "lucide-react",
             "framer-motion",
             "react-router-dom",
    ], cwd=WORK_DIR)
    
    print("\n[→] Initialising Tailwind ...")
    run_npx(["tailwindcss", "init", "-p"], cwd=WORK_DIR)
    
    print("\n[✓] Bootstrap complete! All dependencies installed.")
    print(f"[→] Run: agy-node {os.path.join(NPM_DIR, 'bin', 'npm-cli.js')} run dev")
