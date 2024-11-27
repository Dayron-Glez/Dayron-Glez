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
  // Buscar la sección que comienza con la tabla correcta
  const tableStartIndex = content.indexOf('| #');
  if (tableStartIndex === -1) {
    throw new Error('No se encontró el inicio de la tabla');
  }

  // Dividir el contenido en líneas
  const lines = content.split('\n');
  const ranking = [];
  let tableFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Identificar el inicio de la tabla de ranking
    if (line.startsWith('| #') && line.includes('Name') && line.includes('Total Contributions')) {
      tableFound = true;
      continue;
    }

    // Saltar la línea de separación
    if (line.startsWith('|---') || !line) {
      continue;
    }

    // Procesar las filas de la tabla
    if (tableFound && line.startsWith('|')) {
      try {
        const columns = line.split('|')
          .map(col => col.trim())
          .filter(col => col.length > 0);

        if (columns.length >= 7) {
          // Extraer información del usuario
          const position = parseInt(columns[0]);
          const nameMatch = columns[1].match(/\[([^\]]+)\]/);
          const name = nameMatch ? nameMatch[1] : columns[1];
          const company = columns[2];
          const publicContrib = parseInt(columns[5].replace(/,/g, ''));
          const totalContrib = parseInt(columns[6].replace(/,/g, ''));

          if (!isNaN(position) && !isNaN(totalContrib)) {
            ranking.push({
              position,
              name,
              company,
              publicContributions: publicContrib,
              totalContributions: totalContrib
            });
          }
        }
      } catch (error) {
        console.log(`Error procesando línea: ${line}`);
        continue;
      }
    }

    // Salir si encontramos el final de la tabla
    if (tableFound && line.startsWith('### 🚀')) {
      break;
    }
  }

  if (ranking.length === 0) {
    throw new Error('No se encontraron entradas válidas en la tabla');
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
    console.log(`Se encontraron ${ranking.length} usuarios`);
    
    if (ranking.length > 0) {
      console.log('Primeros 3 usuarios:');
      console.log(JSON.stringify(ranking.slice(0, 3), null, 2));
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
