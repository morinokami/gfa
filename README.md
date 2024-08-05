# gen-api

TODO: Add description

LLM-powered [json-server](https://github.com/typicode/json-server)

## Usage

`gen-api` currently uses the [OpenAI API](https://openai.com/api/) to generate data. You need to have an API key to use it. Once you have your API key, set it as the environment variable `OPENAI_API_KEY`. You can set the environment variable by using the `export` command, for example:

```sh
export OPENAI_API_KEY=your-api-key
```

After setting the API key, install the dependencies in your project:

```sh
npm i -D gen-api zod
```

Next, create a seed file. The seed file should export an object that satisfies the `Seed` type exported from `gen-api`. The seed object should have keys that represent the resources you want to generate. Each resource should have a `schema` key that describes the shape of the resource using a `ZodObject` instance. Resources can also have an optional `prompt` key that describes the prompt to generate the resource. If the resource is a single resource, you can set the `single` key to true.

Here is an example seed file:

```ts
import type { Seed } from "gen-api";
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

Now you can run the `gen-api` command to serve the generated API:

```
$ npx gen-api seed.ts
✔ Resources generated

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
```
