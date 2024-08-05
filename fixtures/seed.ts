import { z } from "zod";

import type { Seed } from "..";

export default {
	posts: {
		prompt: "Generate 3 posts",
		schema: z.object({
			id: z.number(),
			title: z.string(),
			views: z.number(),
		}),
	},
	comments: {
		prompt: "Generate 5 comments. postIds should be between 1 and 3",
		schema: z.object({
			id: z.number(),
			text: z.string(),
			postId: z.number(),
		}),
	},
	profile: {
		single: true,
		prompt: "Generate a profile",
		schema: z.object({
			name: z.string(),
		}),
	},
} satisfies Seed;
