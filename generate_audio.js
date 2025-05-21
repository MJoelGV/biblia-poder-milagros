const fs = require('fs');
const path = require('path');
const textToSpeech = require('@google-cloud/text-to-speech');
const { DOMParser } = require('xmldom');

async function main() {
  // Ruta al XML de la Biblia
  const xmlPath = path.join(__dirname, 'biblia-files', 'Reina-Valera-1960.xmm');
  const xmlStr = fs.readFileSync(xmlPath, 'utf8');
  const xmlDoc = new DOMParser().parseFromString(xmlStr, 'text/xml');

  // Directorio de salida
  const audioDir = path.join(__dirname, 'audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);

  const client = new textToSpeech.TextToSpeechClient();
  const books = xmlDoc.getElementsByTagName('b');

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const bookName = b.getAttribute('n');
    const chapters = b.getElementsByTagName('c');
    for (let j = 0; j < chapters.length; j++) {
      const c = chapters[j];
      const chapNum = c.getAttribute('n');
      // Unir todos los versículos
      const verses = c.getElementsByTagName('v');
      const textArr = [];
      for (let k = 0; k < verses.length; k++) {
        textArr.push(verses[k].textContent);
      }
      const text = `${bookName} capítulo ${chapNum}. ` + textArr.join(' ');
      console.log(`Generando audio: ${bookName} capítulo ${chapNum}`);

      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: { languageCode: 'es-ES', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      });
      const outPath = path.join(audioDir, `${bookName}-${chapNum}.mp3`);
      fs.writeFileSync(outPath, response.audioContent, 'binary');
    }
  }
  console.log('Generación de audio completada.');
}

main().catch(console.error);
