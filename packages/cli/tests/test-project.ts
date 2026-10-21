import { prepare, scaffold } from "./projects.test-utils";

async function main() {
  await prepare();
  const template = process.argv[1];
  if (!template) throw new Error(`missing template`);
  await scaffold(template);
}

main();
