# gen-api

LLM-powered [json-server](https://github.com/typicode/json-server)

```sh
$ npm i -D gen-api zod
$ vim schema.ts
$ cat schema.ts
import { z } from 'zod';

export const schema = {
  posts: {
    prompt: "Generate 3 posts",
    shape: z.object({
      id: z.number(),
      title: z.string(),
      views: z.number(),
    }),
  },
  comments: {
    prompt: "Generate 5 comments",
    shape: z.object({
      id: z.number(),
      text: z.string(),
      postId: z.number(),
    }),
  },
  profile: {
    prompt: "Generate a profile",
    shape: z.object({
      name: z.string(),
    }),
  },
}
$ npx gen-api schema.ts
```