# gen-api

TODO: Add description

LLM-powered [json-server](https://github.com/typicode/json-server)

```sh
$ npm i -D gen-api zod
$ vim schema.js
$ cat schema.js
import { z } from "zod";

/** @type {import("gen-api").Schema} */
export default {
  posts: {
    prompt: "Generate 3 posts",
    shape: z.object({
      id: z.number(),
      title: z.string(),
      views: z.number(),
    }),
  },
  comments: {
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
};
$ npx gen-api schema.js
```