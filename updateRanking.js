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
  
  console.log('Analizando contenido...');
  
  // Buscar la sección de la tabla
  let tableSection = false;
  let dataSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Debug: mostrar líneas que podrían ser relevantes
    if (line.includes('|') || line.includes('table')) {
      console.log(`Línea ${i}: ${line}`);
    }

    // Identificar el inicio de la sección de datos
    if (line.includes('| #') && line.includes('| Name') && line.includes('| Company')) {
      console.log('Encontrado encabezado de la tabla');
      dataSection = true;
      continue;
    }

    // Saltar línea de separación
    if (line.startsWith('|--')) {
      continue;
    }

    // Procesar datos
    if (dataSection && line.startsWith('|')) {
      try {
        const columns = line.split('|')
          .map(col => col.trim())
          .filter(Boolean);

        if (columns.length >= 6) {
          // Extraer información
          const nameMatch = columns[1].match(/\[([^\]]+)\]/);
          const entry = {
            position: parseInt(columns[0]),
            name: nameMatch ? nameMatch[1] : columns[1].replace(/\[|\]/g, ''),
            company: columns[2],
            publicContributions: parseInt(columns[5].replace(/,/g, '')),
            totalContributions: parseInt(columns[6].replace(/,/g, ''))
          };

          if (!isNaN(entry.position) && !isNaN(entry.totalContributions)) {
            ranking.push(entry);
            console.log(`Procesado: ${entry.name} (${entry.totalContributions} contribuciones)`);
          }
        }
      } catch (error) {
        console.log(`Error procesando línea: ${line}`);
        console.log(`Error: ${error.message}`);
      }
    }

    // Salir si encontramos el final de la sección
    if (dataSection && (line.includes('### 🚀') || line.includes('</table>'))) {
      break;
    }
  }

  if (ranking.length === 0) {
    console.log('\nNo se encontraron datos. Mostrando estructura del documento:');
    let count = 0;
    lines.forEach((line, index) => {
      if (line.trim() && count < 20) {
        console.log(`${index}: ${line.substring(0, 100)}`);
        count++;
      }
    });
    throw new Error('No se encontraron entradas válidas en la tabla');
  }

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
      console.log('\nRanking extraído exitosamente');
      console.log(`Total de usuarios: ${ranking.length}`);
      console.log('\nPrimeros 3 usuarios:');
      console.log(JSON.stringify(ranking.slice(0, 3), null, 2));
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
