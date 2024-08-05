import { z } from "zod";

export const Seed = z.record(
	z.object({
		single: z.boolean().optional(),
		schema: z.instanceof(z.ZodObject),
		prompt: z.string().optional(),
	}),
);

export type Seed = z.infer<typeof Seed>;
