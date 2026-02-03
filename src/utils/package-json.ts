import { z } from "zod";

export const ZPackageJson = z.looseObject({
  name: z.string(),
  description: z.string().default(""),
  version: z.string(),
  dependencies: z.record(z.string(), z.string()).default(() => ({})),
});
