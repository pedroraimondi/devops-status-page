const { access, cp, mkdir, rm, writeFile } = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const publicDirectory = path.join(projectRoot, "public");
const outputDirectory = path.join(projectRoot, "dist");
const outputIndex = path.join(outputDirectory, "index.html");

async function build() {
  console.log("Iniciando o build da página de status...");

  console.log("1/4 Removendo a pasta dist anterior...");
  await rm(outputDirectory, { recursive: true, force: true });

  console.log("2/4 Criando uma nova pasta dist...");
  await mkdir(outputDirectory, { recursive: true });

  console.log("3/4 Copiando os arquivos públicos...");
  await cp(publicDirectory, outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");

  console.log("4/4 Verificando o arquivo principal...");
  await access(outputIndex);

  console.log("Build concluído com sucesso: dist/index.html está pronto.");
}

build().catch((error) => {
  console.error("Falha no build:", error.message);
  process.exitCode = 1;
});
