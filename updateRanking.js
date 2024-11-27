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
  let foundMainTable = false;
  
  console.log('Analizando contenido...');

  // Buscar la tabla principal que contiene los usuarios
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Buscar la línea que indica el número total de usuarios
    if (line.includes('users') && line.includes('Cuba')) {
      console.log(`Encontrada línea de usuarios: ${line}`);
    }

    // Buscar la tabla principal después de las tablas de navegación
    if (line.startsWith('|') && 
        (line.includes('Name') || line.includes('Nombre')) && 
        (line.includes('Total Contributions') || line.includes('Contribuciones Totales'))) {
      console.log(`Encontrada tabla principal en línea ${i}: ${line}`);
      foundMainTable = true;
      
      // Mostrar las siguientes líneas para verificar
      console.log('\nPrimeras filas de la tabla:');
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        console.log(`${j}: ${lines[j]}`);
      }
      
      // Comenzar a procesar desde la siguiente línea
      i += 2; // Saltar el encabezado y la línea de separación
      
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        try {
          const columns = row.split('|')
            .map(col => col.trim())
            .filter(Boolean);

          if (columns.length >= 7) {
            const nameMatch = columns[1].match(/\[([^\]]+)\]/);
            const entry = {
              position: parseInt(columns[0]),
              name: nameMatch ? nameMatch[1] : columns[1],
              company: columns[2],
              publicContributions: parseInt(columns[5].replace(/,/g, '')),
              totalContributions: parseInt(columns[6].replace(/,/g, ''))
            };

            if (!isNaN(entry.position) && !isNaN(entry.totalContributions)) {
              ranking.push(entry);
              if (ranking.length <= 3) {
                console.log(`Procesado: ${entry.name} (${entry.totalContributions} contribuciones)`);
              }
            }
          }
        } catch (error) {
          console.log(`Error procesando línea ${i}: ${row}`);
        }
        i++;
      }
      break;
    }
  }

  if (!foundMainTable) {
    console.log('\nNo se encontró la tabla principal. Mostrando líneas con posibles tablas:');
    lines.forEach((line, index) => {
      if (line.includes('|') && (line.includes('Name') || line.includes('Contributions'))) {
        console.log(`${index}: ${line}`);
      }
    });
    throw new Error('No se encontró la tabla principal de usuarios');
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
