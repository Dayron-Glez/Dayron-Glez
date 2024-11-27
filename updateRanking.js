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
  // Buscar la sección que comienza con la tabla de usuarios
  const tableStartIndex = content.indexOf('|------|');
  if (tableStartIndex === -1) {
    throw new Error('No se encontró el inicio de la tabla');
  }

  // Dividir el contenido en líneas y encontrar las filas relevantes
  const lines = content.split('\n');
  const ranking = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('|') && line.includes('|') && !line.includes('---') && !line.includes('Name') && line.trim().length > 0) {
      const columns = line.split('|').map(col => col.trim()).filter(Boolean);
      
      if (columns.length >= 7) {
        try {
          const userMatch = columns[1].match(/\[(.*?)\]/);
          const userName = userMatch ? userMatch[1] : columns[1];
          
          ranking.push({
            position: parseInt(columns[0]),
            name: userName,
            company: columns[2],
            publicContributions: parseInt(columns[5].replace(/,/g, '')),
            totalContributions: parseInt(columns[6].replace(/,/g, ''))
          });
        } catch (error) {
          console.log(`Error procesando línea: ${line}`);
          continue;
        }
      }
    }
  }

  return ranking;
}

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
    console.log('Obteniendo contenido de:', url);
    
    const content = await getContent(url);
    console.log('Contenido obtenido. Longitud:', content.length);

    const ranking = extractRanking(content);
    console.log('Usuarios encontrados:', ranking.length);
    
    if (ranking.length > 0) {
      console.log('Primeros 3 usuarios:', JSON.stringify(ranking.slice(0, 3), null, 2));
    } else {
      console.log('No se encontraron usuarios en el ranking');
    }

  } catch (error) {
    console.error('Error al obtener el ranking:', error.message);
    throw error;
  }
}

main().catch(error => {
  console.error('Error en la ejecución:', error);
  process.exit(1);
});
