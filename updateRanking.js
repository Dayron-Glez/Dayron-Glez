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
  // Buscar la sección que comienza con el encabezado de la tabla
  const tableStartIndex = content.indexOf('| # | Name | Company |');
  if (tableStartIndex === -1) {
    console.log('Buscando encabezado alternativo...');
    throw new Error('No se encontró el inicio de la tabla');
  }

  // Dividir el contenido en líneas
  const lines = content.split('\n');
  const ranking = [];
  let isInTable = false;

  for (const line of lines) {
    // Identificar el inicio de la tabla
    if (line.includes('| # | Name | Company |')) {
      isInTable = true;
      continue;
    }

    // Saltar la línea de separación
    if (line.includes('|--') || !line.trim()) {
      continue;
    }

    // Procesar solo las líneas que son parte de la tabla
    if (isInTable && line.startsWith('|')) {
      try {
        const columns = line.split('|').map(col => col.trim()).filter(Boolean);
        
        if (columns.length >= 6) {
          // Extraer el nombre del usuario del formato markdown
          const nameMatch = columns[1].match(/\[([^\]]+)\]/);
          const userName = nameMatch ? nameMatch[1] : columns[1];

          const entry = {
            position: parseInt(columns[0]),
            name: userName,
            company: columns[2],
            publicContributions: parseInt(columns[4].replace(/,/g, '')),
            totalContributions: parseInt(columns[5].replace(/,/g, ''))
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

  return ranking;
}

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md';
    console.log('Obteniendo contenido de:', url);
    
    const content = await getContent(url);
    console.log('Contenido obtenido. Longitud:', content.length);
    
    // Mostrar las primeras líneas del contenido para debug
    console.log('Primeras líneas del contenido:');
    console.log(content.split('\n').slice(0, 10).join('\n'));

    const ranking = extractRanking(content);
    console.log('Usuarios encontrados:', ranking.length);
    
    if (ranking.length > 0) {
      console.log('Primeros 3 usuarios:', JSON.stringify(ranking.slice(0, 3), null, 2));
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
