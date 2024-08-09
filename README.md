# gfa

`gfa` (generate-fake-api) is a LLM-powered command-line tool that generates structured data based on provided schemas and serves it as a REST API. You can think of it as an AI-driven [json-server](https://github.com/typicode/json-server). Just define a seed file with the resources you want to generate, and `gfa` will take care of the rest.

## Usage

`gfa` currently supports the following AI providers for generating data:

- [OpenAI API](https://openai.com/api/)
- [Anthropic API](https://www.anthropic.com/api)

You need an API key from one of these providers to use `gfa`. Once you have your API key, set it as an environment variable called `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. You can set the environment variable by using the `export` command. For example:

```sh
export OPENAI_API_KEY=your-api-key
```

After setting the API key, install the dependencies in your project:

```sh
npm install gfa zod --save-dev
```

Next, create a seed file. The seed file should export an object that satisfies the `Seed` type exported from `gfa`. The seed object should have keys that represent the resources you want to generate. Each resource should have a `schema` key that describes the shape of the resource using a `ZodObject` instance. Resources can also have an optional `prompt` key that describes the prompt to generate the resource. Resources are considered to be plural by default, i.e., they are arrays of objects. If you want to generate a single object instead of an array, you can set the `single` key to `true`.

Here is an example seed file:

```ts
import type { Seed } from "gfa";
import { z } from "zod";

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
```

Now you can run the `gfa` command to generate resources and serve the API:

```
$ npx gfa seed.ts
✔ Resources generated (total tokens: 383)

Serving API on http://localhost:3000 (Press Ctrl-C to quit)

Available routes:
GET     /api/posts
GET     /api/posts/:id
POST    /api/posts
PUT     /api/posts/:id
PATCH   /api/posts/:id
DELETE  /api/posts/:id
GET     /api/comments
GET     /api/comments/:id
POST    /api/comments
PUT     /api/comments/:id
PATCH   /api/comments/:id
DELETE  /api/comments/:id
GET     /api/profile
PUT     /api/profile
PATCH   /api/profile
```

The API is now running on `http://localhost:3000`. You can make requests to the API using `curl` or a tool like [Postman](https://www.postman.com/). Here is an example request using `curl`:

```
$ curl -s http://localhost:3000/api/posts | jq .
[
  {
    "id": 1,
    "title": "Exploring the Wonders of Nature",
    "views": 150
  },
  {
    "id": 2,
    "title": "The Future of Technology: Trends to Watch",
    "views": 200
  },
  {
    "id": 3,
    "title": "Healthy Eating: Tips for a Balanced Diet",
    "views": 120
  }
]
curl -s 'http://localhost:3000/api/posts?page=2&per_page=2' | jq .
[
  {
    "id": 3,
    "title": "Healthy Eating: Tips for a Balanced Diet",
    "views": 120
  }
]
```
