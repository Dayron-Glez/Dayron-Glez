const https = require("https");
const fs = require("fs").promises;

async function getContent(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function extractRanking(content) {
  console.log("Buscando tabla de usuarios...");

  const tableStart = content.indexOf("<table>");
  if (tableStart === -1) {
    throw new Error("No se encontró la tabla HTML");
  }

  const tables = content.split("<table>");
  let rankingTable = null;

  for (const table of tables) {
    if (
      table.includes("<th>#</th>") &&
      table.includes("<th>Name</th>") &&
      table.includes("<th>Total Contributions</th>")
    ) {
      rankingTable = table;
      break;
    }
  }

  if (!rankingTable) {
    throw new Error("No se encontró la tabla de rankings");
  }

  console.log("Tabla de rankings encontrada. Procesando usuarios...");

  const ranking = [];
  const rows = rankingTable.split("<tr>");

  for (const row of rows) {
    if (!row.includes("<td>")) continue;

    try {
      const posMatch = row.match(/<td>(\d+)<\/td>/);
      if (!posMatch) continue;
      const position = parseInt(posMatch[1]);

      const nameMatch = row.match(/<br\/>\s*([^<]+)\s*<\/td>/);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();

      const companyMatch = row.match(/<td>([^<]+)<\/td>/g);
      const company = companyMatch
        ? companyMatch[2].replace(/<\/?td>/g, "").trim()
        : "";

      const contribMatches = row.match(/<td>(\d+)<\/td>/g);
      if (!contribMatches || contribMatches.length < 2) continue;

      const publicContrib = parseInt(
        contribMatches[contribMatches.length - 2].replace(/<\/?td>/g, ""),
      );
      const totalContrib = parseInt(
        contribMatches[contribMatches.length - 1].replace(/<\/?td>/g, ""),
      );

      ranking.push({
        position,
        name,
        company,
        publicContributions: publicContrib,
        totalContributions: totalContrib,
      });

      if (ranking.length <= 3 || name.includes("Dayron")) {
        console.log(
          `Procesado: #${position} ${name} (${totalContrib} contribuciones)`,
        );
      }
    } catch (error) {
      console.log(`Error procesando fila: ${error.message}`);
      continue;
    }
  }

  if (ranking.length === 0) {
    throw new Error("No se pudieron extraer datos de la tabla");
  }

  console.log(`\nSe encontraron ${ranking.length} usuarios en total`);
  return ranking;
}

async function updateReadme(ranking) {
  try {
    const miPosicion = ranking.find((user) => user.name.includes("Dayron"));
    if (!miPosicion) {
      throw new Error("No se encontró tu usuario en el ranking");
    }

    let content = await fs.readFile("./README.md", "utf8");

    const rankingSection = `<div align="center">
  <a href="https://github.com/gayanvoice/top-github-users/blob/main/markdown/total_contributions/cuba.md" target="_blank">
    <h1>🏆 GitHub Ranking Cuba</h1>
  </a>
  <table>
    <tr>
      <td align="center">
        <img width="50" src="https://github.com/tandpfun/skill-icons/blob/main/icons/Github-Dark.svg" alt="GitHub Rank">
      </td>
      <td>
        <h3>Ranking entre desarrolladores cubanos</h3>
        <ul align="left">
          <li>🥇 <b>Posición actual:</b> #${miPosicion.position}</li>
          <li>🔥 <b>Contribuciones totales:</b> ${
            miPosicion.totalContributions
          }</li>
          <li>📊 <b>Contribuciones públicas:</b> ${
            miPosicion.publicContributions
          }</li>
        </ul>
        <sub><i>Última actualización: ${new Date().toLocaleDateString()}</i></sub>
      </td>
    </tr>
  </table>
</div>`;

    if (content.includes("# 🏆 GitHub Ranking Cuba")) {
      content = content.replace(
        /# 🏆 GitHub Ranking Cuba[\s\S]*?<\/div>/m,
        rankingSection,
      );
    } else {
      const statsEndIndex = content.indexOf(
        "</p>",
        content.indexOf("github-readme-streak-stats"),
      );
      if (statsEndIndex !== -1) {
        content =
          content.slice(0, statsEndIndex + 4) +
          "\n\n" +
          rankingSection +
          content.slice(statsEndIndex + 4);
      } else {
        content += "\n\n" + rankingSection;
      }
    }

    await fs.writeFile("./README.md", content, "utf8");
    console.log(
      "README.md actualizado exitosamente con la posición:",
      miPosicion.position,
    );
  } catch (error) {
    console.error("Error actualizando README:", error.message);
    throw error;
  }
}

async function main() {
  try {
    const url =
      "https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown/total_contributions/cuba.md";
    console.log("Obteniendo contenido de:", url);

    const content = await getContent(url);
    console.log(`Contenido obtenido. Longitud: ${content.length}`);

    const ranking = extractRanking(content);

    if (ranking.length > 0) {
      console.log("\nPrimeros 3 usuarios y tu posición:");
      const top3 = ranking.slice(0, 3);
      const tuPosicion = ranking.find((user) => user.name.includes("Dayron"));

      console.log("\nTop 3:");
      console.log(JSON.stringify(top3, null, 2));

      if (tuPosicion) {
        console.log("\nTu posición:");
        console.log(JSON.stringify(tuPosicion, null, 2));
        await updateReadme(ranking);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
