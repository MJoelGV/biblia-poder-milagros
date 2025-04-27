#!/usr/bin/env python3
"""
Genera archivos MP3 por capítulo de la Biblia Reina-Valera-1960 usando espeak-ng y ffmpeg.
Se ejecuta automáticamente en GitHub Actions.
"""
import os
import xml.etree.ElementTree as ET
import subprocess
import requests
from gtts import gTTS
import unicodedata

# Función slugify para nombres de archivo
def slugify(text):
    return unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('ascii').replace(' ', '-')

# Rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
xml_dir = os.path.join(BASE_DIR, 'biblia-files')
xml_files = [os.path.join(xml_dir, f) for f in os.listdir(xml_dir) if f.endswith('.xmm')]
audio_dir = os.path.join(BASE_DIR, 'audio')

# Crear directorio de audio si no existe
os.makedirs(audio_dir, exist_ok=True)

# API Key para VoiceRSS
API_KEY = os.environ.get("VOICERSS_API_KEY")
VOICE = os.environ.get("VOICERSS_VOICE", "Miguel")  # default voice for better quality

# Procesar cada archivo XML (OT y NT)
total = 0
for xml_path in xml_files:
    print(f"Procesando {xml_path}...")
    tree = ET.parse(xml_path)
    root = tree.getroot()
    # Por cada libro y capítulo genera MP3
    for b in root.findall('b'):
        book = b.get('n')
        slug = slugify(book)
        for c in b.findall('c'):
            chap = c.get('n')
            # Concatenar todos los versículos
            verses = ' '.join(v.text.strip() for v in c.findall('v') if v.text)
            text = f"{book} capítulo {chap}. " + verses
            filename = f"{slug}-{chap}.mp3"
            out_path = os.path.join(audio_dir, filename)
            print(f"Generando: {filename}")
            if API_KEY:
                print("Usando VoiceRSS para voz más natural...")
                resp = requests.get(
                    "https://api.voicerss.org/",
                    params={
                        "key": API_KEY,
                        "hl": "es-es",
                        "v": VOICE,
                        "src": text,
                        "c": "MP3",
                        "f": "48khz_16bit_stereo"
                    },
                )
                with open(out_path, 'wb') as f:
                    f.write(resp.content)
            else:
                print("Usando gTTS como fallback...")
                tts = gTTS(text=text, lang='es')
                tts.save(out_path)
            total += 1

print(f"Generados {total} archivos de audio en {audio_dir}")
