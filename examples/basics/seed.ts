import type { Seed } from "gfa";
import { z } from "zod";

export default {
	recipe: {
		prompt: "Generate a lasagna recipe.",
		schema: z.object({
			name: z.string(),
			ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
			steps: z.array(z.string()),
		}),
		single: true,
	},
} satisfies Seed;
