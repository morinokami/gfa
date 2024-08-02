import { z } from "zod";

export const Schema = z.record(
	z.object({
		single: z.boolean().optional(),
		shape: z.instanceof(z.ZodObject),
		prompt: z.string().optional(),
	}),
);

export type Schema = z.infer<typeof Schema>;
