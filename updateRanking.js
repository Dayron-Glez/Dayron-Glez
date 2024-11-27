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
  let isRankingTable = false;
  let headerFound = false;

  console.log('Buscando tabla de ranking...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Buscar la tabla que contiene la información de ranking
    if (line.includes('| #') && line.includes('| Name') && line.includes('| Total Contributions |')) {
      console.log('Encontrado encabezado de la tabla de ranking');
      isRankingTable = true;
      headerFound = true;
      continue;
    }

    // Saltar la línea de separación
    if (line.startsWith('|---')) {
      continue;
    }

    // Procesar las filas de datos
    if (isRankingTable && headerFound && line.startsWith('|')) {
      try {
        // Dividir la línea en columnas
        const columns = line.split('|')
          .map(col => col.trim())
          .filter(col => col.length > 0);

        if (columns.length >= 7) {
          // Extraer el nombre del usuario
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
            if (ranking.length <= 3) {
              console.log(`Procesado usuario #${entry.position}: ${entry.name} (${entry.totalContributions} contribuciones)`);
            }
          }
        }
      } catch (error) {
        continue;
      }

      // Detener si encontramos una línea que no es parte de la tabla
      if (line.includes('### 🚀')) {
        break;
      }
    }
  }

  if (ranking.length === 0) {
    // Mostrar más contexto para debug
    console.log('\nContenido cerca de donde debería estar la tabla:');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Total Contributions')) {
        console.log('\nLíneas alrededor del encabezado:');
        console.log(lines.slice(Math.max(0, i-5), i+5).join('\n'));
        break;
      }
    }
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
