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
  const lines = content.split('\n');
  const ranking = [];
  let tableStarted = false;
  let headerPassed = false;

  console.log('Buscando tabla en el contenido...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Mostrar algunas líneas para debug
    if (i < 20) {
      console.log(`Línea ${i}: ${line.substring(0, 100)}`);
    }

    // Buscar el inicio de la tabla
    if (line.startsWith('<table>')) {
      console.log('Encontrada etiqueta <table>');
      tableStarted = true;
      continue;
    }

    if (tableStarted && line.includes('| #') && line.includes('| Name |')) {
      console.log('Encontrado encabezado de la tabla');
      headerPassed = true;
      continue;
    }

    // Saltar la línea de separación
    if (line.startsWith('|--')) {
      continue;
    }

    // Procesar las filas de datos
    if (headerPassed && line.startsWith('|') && line.includes('|')) {
      try {
        const columns = line.split('|')
          .map(col => col.trim())
          .filter(col => col.length > 0);

        if (columns.length >= 7) {
          // Extraer nombre del usuario del formato markdown [nombre](url)
          const nameMatch = columns[1].match(/\[([^\]]+)\]/);
          const name = nameMatch ? nameMatch[1] : columns[1];

          const entry = {
            position: parseInt(columns[0]),
            name: name,
            company: columns[2],
            publicContributions: parseInt(columns[5].replace(/,/g, '')),
            totalContributions: parseInt(columns[6].replace(/,/g, ''))
          };

          if (!isNaN(entry.position) && !isNaN(entry.totalContributions)) {
            ranking.push(entry);
            console.log(`Procesado usuario #${entry.position}: ${entry.name}`);
          }
        }
      } catch (error) {
        console.log(`Error procesando línea: ${line}`);
        continue;
      }
    }

    // Detener si encontramos el final de la tabla
    if (tableStarted && line.includes('</table>')) {
      break;
    }
  }

  if (ranking.length === 0) {
    console.log('No se encontraron entradas en la tabla');
    throw new Error('No se encontraron entradas válidas en la tabla');
  }

  console.log(`\nSe encontraron ${ranking.length} usuarios en total`);
  return ranking;
}

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
    console.log('Obteniendo contenido de:', url);
    
    const content = await getContent(url);
    console.log('Contenido obtenido. Longitud:', content.length);
    
    if (!content) {
      throw new Error('El contenido está vacío');
    }

    const ranking = extractRanking(content);
    
    if (ranking.length > 0) {
      console.log('\nPrimeros 3 usuarios:');
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
