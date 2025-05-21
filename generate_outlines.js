#!/usr/bin/env node
/**
 * Script para extraer títulos de capítulos desde biblestudystart.com y generar docs/headings.json
 * Traduce los títulos al español usando @vitalets/google-translate-api.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const translate = require('@vitalets/google-translate-api');

(async () => {
  const baseUrl = 'https://www.biblestudystart.com';
  const outlinesUrl = `${baseUrl}/outlines/`;
  try {
    const { data: html } = await axios.get(outlinesUrl);
    const $ = cheerio.load(html);
    const links = [];
    $('#content a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/outlines/') && href !== '/outlines/') {
        const name = $(el).text().trim();
        links.push({ name, url: new URL(href, baseUrl).href });
      }
    });
    const headings = {};
    for (const { name, url } of links) {
      headings[name] = {};
      console.log(`Fetching outlines for ${name}...`);
      const { data: pageHtml } = await axios.get(url);
      const $$ = cheerio.load(pageHtml);
      const items = $$('#content ul li').toArray();
      for (const li of items) {
        const text = $$(li).text().trim();
        const m = text.match(/Chapter\s+(\d+)\s*[–-]\s*(.*?)\s*\((\d+)-(\d+)\)/);
        if (m) {
          const [, chap, titleEn, start, end] = m;
          // traducir título al español
          let title = titleEn;
          try {
            const res = await translate(titleEn, { to: 'es' });
            title = res.text;
          } catch (err) {
            console.warn(`Error traduciendo "${titleEn}":`, err.message);
          }
          if (!headings[name][chap]) headings[name][chap] = [];
          headings[name][chap].push({
            title,
            start: parseInt(start, 10),
            end: parseInt(end, 10)
          });
        }
      }
    }
    const outPath = path.resolve(__dirname, 'docs', 'headings.json');
    fs.writeFileSync(outPath, JSON.stringify(headings, null, 2), 'utf8');
    console.log(`headings.json generado en ${outPath}`);
  } catch (err) {
    console.error('Error al extraer y traducir outlines:', err);
    process.exit(1);
  }
})();
