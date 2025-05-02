import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import xml.dom.minidom
import xml.etree.ElementTree as ET
import re

API_URL = "https://es.wikipedia.org/w/api.php"
CATEGORY = "Términos cristianos"

# Obtener miembros de categoría

def get_category_members(category):
    members = []
    cmcontinue = None
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Categoría:{category}",
            "cmlimit": "500",
            "format": "json",
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue
        resp = requests.get(API_URL, params=params).json()
        members.extend(resp.get("query", {}).get("categorymembers", []))
        if "continue" in resp:
            cmcontinue = resp["continue"]["cmcontinue"]
        else:
            break
    return members

# Obtener extracto (introducción)

def get_intro(title):
    params = {
        "action": "query",
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "titles": title,
        "format": "json",
    }
    resp = requests.get(API_URL, params=params).json()
    pages = resp.get("query", {}).get("pages", {})
    page = next(iter(pages.values()))
    return page.get("extract", "")

# Extraer referencias de versículos

BOOKS = ["Génesis","Éxodo","Levítico","Números","Deuteronomio","Josué","Jueces","Rut","Samuel","Reyes","Crónicas","Esdras","Nehemías","Ester","Job","Salmos","Proverbios","Eclesiastés","Cantar de los Cantares","Isaías","Jeremías","Lamentaciones","Ezequiel","Daniel","Oseas","Joel","Amós","Abdías","Jonás","Miqueas","Nahúm","Habacuc","Sofonías","Hageo","Zacarías","Malaquías","Mateo","Marcos","Lucas","Juan","Hechos","Romanos","Corintios","Gálatas","Efesios","Filipenses","Colosenses","Tesalonicenses","Timoteo","Tito","Filemón","Hebreos","Santiago","Pedro","Juan","Judas","Apocalipsis"]

def extract_references(text):
    pattern = r"\b(?:(?:" + "|".join(BOOKS) + r"))\s\d+:\d+\b"
    matches = re.findall(pattern, text)
    # Eliminar duplicados preservando orden
    seen = set()
    refs = []
    for m in matches:
        if m not in seen:
            seen.add(m)
            refs.append(m)
    return refs

# Crear XML

def create_xml(terminos):
    root = ET.Element("diccionario")
    for term in terminos:
        termino = ET.SubElement(root, "termino")
        palabra = ET.SubElement(termino, "palabra")
        palabra.text = term["palabra"]
        definicion = ET.SubElement(termino, "definicion")
        definicion.text = term["definicion"]
        if term["referencias"]:
            referencias = ET.SubElement(termino, "referencias")
            for ref in term["referencias"]:
                ref_elem = ET.SubElement(referencias, "ref")
                ref_elem.text = ref
    # Formatear XML
    xmlstr = xml.dom.minidom.parseString(ET.tostring(root, encoding="unicode")).toprettyxml(indent="    ")
    with open('diccionario_wiki.xml', 'w', encoding='utf-8') as f:
        f.write(xmlstr)

# Flujo principal

def main():
    print(f"Obteniendo miembros de la categoría {CATEGORY}...")
    members = get_category_members(CATEGORY)
    terminos = []
    for m in members:
        title = m.get('title')
        if not title or ':' in title:
            continue
        print(f"Procesando: {title}")
        intro = get_intro(title)
        definition = intro.split('\n')[0] if intro else ''
        refs = extract_references(intro)
        # Saltar términos placeholders
        if re.match(r'^Término\d+$', title):
            continue
        # Saltar términos católicos
        if re.search(r'catol', title, re.IGNORECASE) or re.search(r'catol', definition, re.IGNORECASE):
            print(f"Skipping Catholic term: {title}")
            continue
        terminos.append({
            'palabra': title,
            'definicion': definition,
            'referencias': refs
        })
    print(f"{len(terminos)} términos obtenidos. Creando XML...")
    create_xml(terminos)
    print('Archivo diccionario_wiki.xml generado.')

if __name__ == '__main__':
    main()
