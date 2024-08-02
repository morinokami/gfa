# gen-api

LLM-powered [json-server](https://github.com/typicode/json-server)

```sh
$ npm i -D gen-api zod
$ vim schema.ts
$ cat schema.ts
import type { Schema } from "gen-api";
import { z } from "zod";

export default {
	posts: {
		single: false,
		prompt: "Generate 3 posts",
		shape: z.object({
			id: z.number(),
			title: z.string(),
			views: z.number(),
		}),
	},
	comments: {
		single: false,
		prompt: "Generate 5 comments. postIds should be between 1 and 3",
		shape: z.object({
			id: z.number(),
			text: z.string(),
			postId: z.number(),
		}),
	},
	profile: {
		single: true,
		prompt: "Generate a profile",
		shape: z.object({
			name: z.string(),
		}),
	},
} satisfies Schema;
$ npx gen-api schema.ts
```