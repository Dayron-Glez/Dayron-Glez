const https = require('https');

async function getContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractRanking(content) {
  console.log('Buscando tabla de usuarios...');

  // Buscar la tabla HTML
  const tableStart = content.indexOf('<table>');
  if (tableStart === -1) {
    throw new Error('No se encontró la tabla HTML');
  }

  // Encontrar la tabla que contiene los rankings (la que tiene el encabezado correcto)
  const tables = content.split('<table>');
  let rankingTable = null;

  for (const table of tables) {
    if (table.includes('<th>#</th>') && 
        table.includes('<th>Name</th>') && 
        table.includes('<th>Total Contributions</th>')) {
      rankingTable = table;
      break;
    }
  }

  if (!rankingTable) {
    throw new Error('No se encontró la tabla de rankings');
  }

  console.log('Tabla de rankings encontrada. Procesando usuarios...');

  const ranking = [];
  const rows = rankingTable.split('<tr>');

  // Procesar cada fila
  for (const row of rows) {
    if (!row.includes('<td>')) continue;

    try {
      // Extraer posición
      const posMatch = row.match(/<td>(\d+)<\/td>/);
      if (!posMatch) continue;
      const position = parseInt(posMatch[1]);

      // Extraer nombre
      const nameMatch = row.match(/<br\/>\s*([^<]+)\s*<\/td>/);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();

      // Extraer empresa
      const companyMatch = row.match(/<td>([^<]+)<\/td>/g);
      const company = companyMatch ? companyMatch[2].replace(/<\/?td>/g, '').trim() : '';

      // Extraer contribuciones
      const contribMatches = row.match(/<td>(\d+)<\/td>/g);
      if (!contribMatches || contribMatches.length < 2) continue;

      const publicContrib = parseInt(contribMatches[contribMatches.length - 2].replace(/<\/?td>/g, ''));
      const totalContrib = parseInt(contribMatches[contribMatches.length - 1].replace(/<\/?td>/g, ''));

      ranking.push({
        position,
        name,
        company,
        publicContributions: publicContrib,
        totalContributions: totalContrib
      });

      if (ranking.length <= 3 || name.includes('Dayron')) {
        console.log(`Procesado: #${position} ${name} (${totalContrib} contribuciones)`);
      }
    } catch (error) {
      console.log(`Error procesando fila: ${error.message}`);
      continue;
    }
  }

  if (ranking.length === 0) {
    throw new Error('No se pudieron extraer datos de la tabla');
  }

  console.log(`\nSe encontraron ${ranking.length} usuarios en total`);
  return ranking;
}

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
    console.log('Obteniendo contenido de:', url);
    
    const content = await getContent(url);
    console.log(`Contenido obtenido. Longitud: ${content.length}`);
    
    const ranking = extractRanking(content);
    
    if (ranking.length > 0) {
      console.log('\nPrimeros 3 usuarios y tu posición:');
      const top3 = ranking.slice(0, 3);
      const tuPosicion = ranking.find(user => user.name.includes('Dayron'));
      
      console.log('\nTop 3:');
      console.log(JSON.stringify(top3, null, 2));
      
      if (tuPosicion) {
        console.log('\nTu posición:');
        console.log(JSON.stringify(tuPosicion, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

main().catch(error => {
  console.error('Error en la ejecución:', error);
  process.exit(1);
});
