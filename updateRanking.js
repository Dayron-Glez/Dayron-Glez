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

function findTableStart(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('| # | Name | Company |') && 
        lines[i].includes('Total Contributions |')) {
      return i;
    }
  }
  return -1;
}

function extractRanking(content) {
  const lines = content.split('\n');
  const ranking = [];
  
  console.log('Buscando tabla de ranking...');

  // Encontrar el inicio de la tabla
  const tableStartIndex = findTableStart(lines);
  
  if (tableStartIndex === -1) {
    console.log('\nBuscando patrones en el contenido...');
    // Buscar líneas que contengan patrones relevantes
    lines.forEach((line, index) => {
      if (line.includes('Total Contributions') || 
          line.includes('| # |') || 
          line.includes('|-----|')) {
        console.log(`Línea ${index}: ${line}`);
      }
    });
    throw new Error('No se encontró el inicio de la tabla');
  }

  console.log(`Tabla encontrada en la línea ${tableStartIndex}`);
  console.log('Contenido alrededor de la tabla:');
  for (let i = Math.max(0, tableStartIndex - 2); i < Math.min(lines.length, tableStartIndex + 5); i++) {
    console.log(`Línea ${i}: ${lines[i]}`);
  }

  // Procesar la tabla
  let i = tableStartIndex + 2; // Saltar el encabezado y la línea de separación
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const line = lines[i].trim();
    try {
      const columns = line.split('|')
        .map(col => col.trim())
        .filter(col => col.length > 0);

      if (columns.length >= 7) {
        // Extraer nombre del usuario
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
            console.log(`Procesado: #${entry.position} ${entry.name}`);
          }
        }
      }
    } catch (error) {
      console.log(`Error procesando línea ${i}: ${line}`);
    }
    i++;
  }

  if (ranking.length === 0) {
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
