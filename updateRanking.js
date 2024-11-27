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
  // Buscar la tabla que contiene los datos
  const tableRegex = /\|[\s]*#[\s]*\|[\s]*Name[\s]*\|[\s]*Company[\s]*\|[\s]*Twitter Username[\s]*\|[\s]*Location[\s]*\|[\s]*Public Contributions[\s]*\|[\s]*Total Contributions[\s]*\|/;
  const tableMatch = content.match(tableRegex);

  if (!tableMatch) {
    // Mostrar una parte del contenido para debug
    console.log('Contenido parcial para debug:');
    console.log(content.substring(0, 1000));
    throw new Error('No se encontró el inicio de la tabla');
  }

  console.log('Tabla encontrada. Procesando datos...');

  // Obtener la sección relevante del contenido
  const contentAfterTable = content.substring(tableMatch.index);
  const lines = contentAfterTable.split('\n');
  const ranking = [];
  let isHeader = true;

  for (const line of lines) {
    // Saltar el encabezado y la línea de separación
    if (isHeader || line.includes('|-')) {
      isHeader = false;
      continue;
    }

    // Detener si llegamos al final de la tabla
    if (line.includes('### 🚀')) {
      break;
    }

    // Procesar solo líneas que son parte de la tabla
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      try {
        const columns = line.split('|')
          .map(col => col.trim())
          .filter(col => col.length > 0);

        if (columns.length >= 7) {
          // Extraer el nombre del usuario del formato markdown
          const nameMatch = columns[1].match(/\[([^\]]+)\]/);
          const userName = nameMatch ? nameMatch[1] : columns[1];

          const entry = {
            position: parseInt(columns[0]),
            name: userName,
            company: columns[2],
            publicContributions: parseInt(columns[5].replace(/,/g, '')),
            totalContributions: parseInt(columns[6].replace(/,/g, ''))
          };

          if (!isNaN(entry.position) && !isNaN(entry.totalContributions)) {
            ranking.push(entry);
          }
        }
      } catch (error) {
        console.log(`Error procesando línea: ${line}`);
        continue;
      }
    }
  }

  if (ranking.length === 0) {
    throw new Error('No se encontraron entradas válidas en la tabla');
  }

  console.log(`Se encontraron ${ranking.length} entradas válidas`);
  return ranking;
}

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
    console.log('Obteniendo contenido de:', url);
    
    const content = await getContent(url);
    console.log('Contenido obtenido. Longitud:', content.length);
    
    // Verificar que el contenido no esté vacío
    if (!content) {
      throw new Error('El contenido está vacío');
    }

    const ranking = extractRanking(content);
    
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
