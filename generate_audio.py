#!/usr/bin/env python3
"""
Genera archivos MP3 por capítulo de la Biblia Reina-Valera-1960 usando gTTS (Google Translate TTS gratuito).
Se ejecuta automáticamente en GitHub Actions.
"""
import os
import xml.etree.ElementTree as ET
from gtts import gTTS

# Rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
xml_path = os.path.join(BASE_DIR, 'biblia-files', 'Reina-Valera-1960.xmm')
audio_dir = os.path.join(BASE_DIR, 'audio')

# Crear directorio de audio si no existe
os.makedirs(audio_dir, exist_ok=True)

# Parse XML
tree = ET.parse(xml_path)
root = tree.getroot()

# Por cada libro y capítulo genera MP3
total = 0
for b in root.findall('b'):
    book = b.get('n')
    for c in b.findall('c'):
        chap = c.get('n')
        # Concatenar todos los versículos
        verses = ' '.join(v.text.strip() for v in c.findall('v') if v.text)
        text = f"{book} capítulo {chap}. " + verses
        filename = f"{book}-{chap}.mp3"
        out_path = os.path.join(audio_dir, filename)
        print(f"Generando: {filename}")
        tts = gTTS(text=text, lang='es')
        tts.save(out_path)
        total += 1

print(f"Generados {total} archivos de audio en {audio_dir}")
