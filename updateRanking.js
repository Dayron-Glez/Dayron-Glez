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
  // Dividir el contenido en líneas
  const lines = content.split('\n');
  const ranking = [];
  let tableStarted = false;
  let headerFound = false;

  console.log('Buscando tabla en el contenido...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Buscar la línea que contiene "th>#</th"
    if (line.includes('<tr>') && line.includes('<th>#</th>')) {
      console.log('Encontrado encabezado de la tabla');
      headerFound = true;
      continue;
    }

    // Si encontramos el encabezado, empezar a procesar las filas
    if (headerFound && line.includes('<tr>')) {
      try {
        // Extraer datos usando expresiones regulares
        const position = line.match(/<td>(\d+)<\/td>/);
        const name = line.match(/>([^<]+)<\/a>/);
        const company = line.match(/<td>([^<]+)<\/td>/g);
        const contributions = line.match(/<td>(\d+)<\/td>/g);

        if (position && name && contributions) {
          const entry = {
            position: parseInt(position[1]),
            name: name[1].trim(),
            company: company ? company[2]?.replace(/<\/?td>/g, '').trim() : '',
            publicContributions: parseInt(contributions[contributions.length - 2].replace(/<\/?td>/g, '')),
            totalContributions: parseInt(contributions[contributions.length - 1].replace(/<\/?td>/g, ''))
          };

          if (!isNaN(entry.position) && !isNaN(entry.totalContributions)) {
            ranking.push(entry);
            console.log(`Procesado usuario #${entry.position}: ${entry.name}`);
          }
        }
      } catch (error) {
        console.log(`Error procesando línea ${i + 1}:`, error.message);
        continue;
      }
    }

    // Detener si encontramos el final de la tabla
    if (headerFound && line.includes('</table>')) {
      break;
    }
  }

  if (ranking.length === 0) {
    console.log('No se encontraron entradas en la tabla');
    console.log('Últimas líneas procesadas:');
    console.log(lines.slice(-10).join('\n'));
    throw new Error('No se encontraron entradas válidas en la tabla');
  }

  console.log(`Se encontraron ${ranking.length} usuarios en total`);
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
