const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');

const GITHUB_URL = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
const GITHUB_USERNAME = 'Dayron-Glez';

function extractRanking(content) {
  const $ = cheerio.load(content);
  
  // Buscar la tabla que contiene el ranking (la que tiene las columnas específicas)
  const rankingTable = $('table').filter((i, table) => {
    const headers = $(table).find('th').map((i, el) => $(el).text()).get();
    return headers.includes('#') && 
           headers.includes('Name') && 
           headers.includes('Company') &&
           headers.includes('Public Contributions') &&
           headers.includes('Total Contributions');
  });

  // Extraer los datos de la tabla
  const ranking = [];
  rankingTable.find('tr').slice(1).each((i, row) => {
    const cols = $(row).find('td');
    ranking.push({
      position: $(cols[0]).text().trim(),
      name: $(cols[1]).text().trim(),
      company: $(cols[2]).text().trim(),
      publicContributions: parseInt($(cols[5]).text().trim()),
      totalContributions: parseInt($(cols[6]).text().trim())
    });
  });

  return ranking;
}

(async () => {
  try {
    const response = await fetch(GITHUB_URL);
    const markdown = await response.text();

    // Dividir el contenido en líneas
    const lines = markdown.split('\n');
    
    // Encontrar la tabla
    const tableStartIndex = lines.findIndex(line => line.includes('| --- |') || line.includes('|------|'));
    if (tableStartIndex === -1) {
      throw new Error('No se encontró la tabla en el contenido');
    }

    // Buscar el usuario en las filas de la tabla
    let userRank = null;
    for (let i = tableStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.includes(GITHUB_USERNAME)) {
        // La línea es parte de la tabla y contiene el usuario
        const columns = line.split('|').map(col => col.trim());
        userRank = columns[1]; // El ranking debería estar en la segunda columna
        console.log('Línea completa encontrada:', line);
        console.log('Columnas:', columns);
        break;
      }
    }

    if (userRank) {
      console.log('Ranking encontrado:', userRank);
      
      const readmePath = './README.md';
      const readme = fs.readFileSync(readmePath, 'utf-8');

      // Actualiza el ranking en el README.md
      const updatedReadme = readme.replace(
        /Soy uno de los (?:principales )?contribuyentes de GitHub en Cuba.*?\n/,
        `Soy uno de los contribuyentes de GitHub en Cuba según el ranking (posición: ${userRank}).\n`
      );

      // Escribe los cambios en el README.md
      fs.writeFileSync(readmePath, updatedReadme);
      console.log('README.md actualizado con éxito.');
    } else {
      console.log('Contenido de las primeras 20 líneas:');
      console.log(lines.slice(0, 20).join('\n'));
      console.error(`No se encontró el usuario "${GITHUB_USERNAME}" en la tabla del ranking.`);
    }
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    console.error('Stack completo:', error.stack);
  }
})();
