import xml.etree.ElementTree as ET
import xml.dom.minidom

# Diccionario de términos bíblicos comunes
terminos = [
    {
        'palabra': 'Aarón',
        'definicion': 'Hermano mayor de Moisés y primer sumo sacerdote del pueblo de Israel.',
        'referencias': ['Éxodo 4:14', 'Éxodo 28:1']
    },
    {
        'palabra': 'Abba',
        'definicion': 'Palabra aramea que significa "padre". Es un término íntimo y cariñoso, similar a "papá".',
        'referencias': ['Marcos 14:36', 'Romanos 8:15']
    },
    {
        'palabra': 'Abel',
        'definicion': 'Segundo hijo de Adán y Eva, pastor de ovejas, asesinado por su hermano Caín.',
        'referencias': ['Génesis 4:2', 'Hebreos 11:4']
    },
    {
        'palabra': 'Bendición',
        'definicion': 'Favor o don especial concedido por Dios. También puede referirse al acto de invocar el favor divino sobre alguien.',
        'referencias': ['Génesis 12:2', 'Números 6:24']
    },
    {
        'palabra': 'Canaán',
        'definicion': 'La tierra prometida por Dios a Abraham y sus descendientes, también conocida como Israel.',
        'referencias': ['Génesis 12:5', 'Josué 1:2']
    },
    {
        'palabra': 'David',
        'definicion': 'Rey de Israel, compositor de muchos salmos y antepasado de Jesús. Conocido por su fe y valentía.',
        'referencias': ['1 Samuel 16:13', 'Mateo 1:1']
    },
    {
        'palabra': 'Edén',
        'definicion': 'El jardín creado por Dios donde vivieron Adán y Eva antes de la caída.',
        'referencias': ['Génesis 2:8', 'Génesis 3:23']
    },
    {
        'palabra': 'Faraón',
        'definicion': 'Título dado a los reyes del antiguo Egipto. En el Éxodo, se refiere al gobernante que se opuso a Moisés.',
        'referencias': ['Éxodo 5:2', 'Éxodo 14:28']
    },
    {
        'palabra': 'Gólgota',
        'definicion': 'Lugar donde Jesús fue crucificado, significa "lugar de la calavera".',
        'referencias': ['Mateo 27:33', 'Juan 19:17']
    },
    {
        'palabra': 'Herodes',
        'definicion': 'Nombre de varios reyes que gobernaron en Judea. Herodes el Grande ordenó matar a los niños de Belén.',
        'referencias': ['Mateo 2:1', 'Lucas 1:5']
    },
    {
        'palabra': 'Israel',
        'definicion': 'Nombre dado por Dios a Jacob. También se refiere al pueblo escogido de Dios y a la tierra prometida.',
        'referencias': ['Génesis 32:28', 'Éxodo 4:22']
    },
    {
        'palabra': 'Jerusalén',
        'definicion': 'Ciudad santa, capital del antiguo reino de Israel y lugar donde estaba el templo.',
        'referencias': ['2 Samuel 5:5', 'Apocalipsis 21:2']
    },
    {
        'palabra': 'Levitas',
        'definicion': 'Miembros de la tribu de Leví, dedicados al servicio del templo y al sacerdocio.',
        'referencias': ['Números 3:12', 'Deuteronomio 10:8']
    },
    {
        'palabra': 'Maná',
        'definicion': 'Alimento milagroso que Dios proveyó a los israelitas durante su travesía por el desierto.',
        'referencias': ['Éxodo 16:31', 'Juan 6:31']
    },
    {
        'palabra': 'Nazaret',
        'definicion': 'Ciudad donde Jesús creció, de ahí el título "Jesús de Nazaret".',
        'referencias': ['Mateo 2:23', 'Lucas 4:16']
    },
    {
        'palabra': 'Pascua',
        'definicion': 'Fiesta que conmemora la liberación de Israel de Egipto. En el NT, relacionada con la muerte de Cristo.',
        'referencias': ['Éxodo 12:11', '1 Corintios 5:7']
    },
    {
        'palabra': 'Querubín',
        'definicion': 'Ser celestial, ángel de alto rango que sirve y adora a Dios.',
        'referencias': ['Génesis 3:24', 'Ezequiel 10:1']
    },
    {
        'palabra': 'Rabí',
        'definicion': 'Título de respeto que significa "maestro", frecuentemente usado para dirigirse a Jesús.',
        'referencias': ['Juan 1:38', 'Mateo 23:8']
    },
    {
        'palabra': 'Sión',
        'definicion': 'Nombre de una de las colinas de Jerusalén. También usado como símbolo del pueblo de Dios.',
        'referencias': ['2 Samuel 5:7', 'Hebreos 12:22']
    },
    {
        'palabra': 'Tabernáculo',
        'definicion': 'Santuario portátil usado por los israelitas para adorar a Dios durante su peregrinación.',
        'referencias': ['Éxodo 25:9', 'Hebreos 9:2']
    }
]

def create_xml():
    """Crea el archivo XML con los términos"""
    root = ET.Element("diccionario")
    
    for term in sorted(terminos, key=lambda x: x['palabra']):
        termino = ET.SubElement(root, "termino")
        
        palabra = ET.SubElement(termino, "palabra")
        palabra.text = term['palabra']
        
        definicion = ET.SubElement(termino, "definicion")
        definicion.text = term['definicion']
        
        if term['referencias']:
            referencias = ET.SubElement(termino, "referencias")
            for ref in term['referencias']:
                ref_elem = ET.SubElement(referencias, "ref")
                ref_elem.text = ref
    
    # Formatear XML para que sea legible
    xmlstr = xml.dom.minidom.parseString(ET.tostring(root, encoding='unicode')).toprettyxml(indent="    ")
    
    with open('diccionario_nuevo.xml', 'w', encoding='utf-8') as f:
        f.write(xmlstr)

def main():
    print("Creando archivo XML con términos bíblicos...")
    create_xml()
    print("¡Archivo diccionario_nuevo.xml creado exitosamente!")
    print(f"Se agregaron {len(terminos)} términos")

if __name__ == "__main__":
    main()
