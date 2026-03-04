import { Command } from "commander";
import { runCreate } from "./create.js";
import { runSetup } from "./setup.js";

declare const __MARMOTTE_VERSION__: string;

const program = new Command()
  .name("marmotte")
  .description("Extensible development toolkit for TypeScript projects")
  .version(__MARMOTTE_VERSION__);

program
  .command("create [dir]")
  .description("Scaffold a new project from a template")
  .option("-t, --template <id>", "template ID or git source (skips prompt)")
  .option("-n, --name <name>", "project name (skips prompt)")
  .option("--no-examples", "skip example code")
  .option("-f, --features <ids...>", "features to apply (skips prompt)")
  .action((dir, opts) => {
    runCreate({ dir, ...opts }).catch((e) => {
      console.error(e);
      process.exit(1);
    });
  });

program
  .command("setup [dir]")
  .description("Add tooling features to an existing project")
  .option("-f, --features <ids...>", "feature IDs to apply (skips prompt)")
  .action((dir, opts) => {
    runSetup({ dir, ...opts }).catch((e) => {
      console.error(e);
      process.exit(1);
    });
  });

program.parse();
