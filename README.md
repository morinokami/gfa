# gfa

`gfa` (generate-fake-api) is a LLM-powered command-line tool that generates structured data based on [Zod](https://github.com/colinhacks/zod) schemas and serves it as a REST API. You can think of it as an AI-driven [json-server](https://github.com/typicode/json-server). Just define a seed file with the resources you want to generate, and `gfa` will take care of the rest.


## tl;dr

You define a seed file with the resources you want to generate:

```ts
import type { Seed } from "gfa";
import { z } from "zod";

export default {
  posts: {
    prompt: "Generate 3 blog posts. The title should be between 5 and 10 words and the body should be between 50 and 100 words.",
    schema: z.object({
      id: z.number(),
      title: z.string(),
      body: z.string(),
    }),
  },
} satisfies Seed;
```

You get a fake REST API with the resources you defined:

```
$ npx gfa seed.ts
✔ Resources generated (total tokens: 453)

Serving API on http://localhost:3000 (Press Ctrl-C to quit)

Available routes:
GET     /api/posts
GET     /api/posts/:id
POST    /api/posts
PUT     /api/posts/:id
PATCH   /api/posts/:id
DELETE  /api/posts/:id
```


## Usage

`gfa` currently supports the following AI providers for generating data:

- [OpenAI API](https://openai.com/api/)
- [Anthropic API](https://www.anthropic.com/api)

You need an API key from one of these providers to use `gfa`. Once you have your API key, set it as an environment variable, either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, using the `export` command. For example:

```sh
export OPENAI_API_KEY=your-api-key
```

After setting the API key, install the dependencies in your project:

```sh
npm install gfa zod --save-dev
```

Next, create a seed file. The seed file should export an object that satisfies the `Seed` type from `gfa`. The seed object should have keys that represent the resources you want to generate. Each resource should have a `schema` key that describes the shape of the resource using a `ZodObject` instance. Resources can also have an optional `prompt` key that describes the prompt to generate the resource. Resources are considered to be plural by default, i.e., they are arrays of objects. If you want to generate a single object instead of an array, you can set the `single` key to `true`.

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

The API is now running at `http://localhost:3000`. You can interact with it using `curl` or a tool like [Postman](https://www.postman.com/). Here is an example request using `curl`:

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
$ curl -s 'http://localhost:3000/api/posts?page=2&per_page=2' | jq .
[
  {
    "id": 3,
    "title": "Healthy Eating: Tips for a Balanced Diet",
    "views": 120
  }
]
```


## Options

### `-m`, `--modelId`

Specifies the model ID to use for generating data. The default is `gpt-4o-2024-08-06`. For a list of available model IDs, see the [Available Model Ids](#available-model-ids) section.

```sh
npx gfa seed.ts --modelId 'gpt-4o-mini'
```

### `--regenerate`

Generates new data for the resources specified in the seed file even if the data already exists.

```sh
npx gfa seed.ts --regenerate
```

### `-p`, `--port`

Specifies the port on which to serve the API. The default is `3000`.

```sh
npx gfa seed.ts --port 8888
```

### `-s`, `--serve`

Specifies the resources path to serve. If the option is set, `gfa` will not generate new data but will serve the data from the specified path. The path should be point to a JSON file that contains the following structure:

```json
{
  "resource_a": [
    {
      "id": 1,
      "name": "Resource A 1"
    },
    {
      "id": 2,
      "name": "Resource A 2"
    }
  ],
  "resource_b": {
    "description": "Resource B"
  },
  ...
}
```

Note that data in arrays should have an `id` field. Without an `id` field, some routes (e.g., `GET /resource_a/[id]`) will not function properly.

### `--basePath`

Specifies the base path for the API. The base path, which defaults to `/api`, is prepended to all routes.

```sh
npx gfa seed.ts --basePath '/v1'
```

Now the API will be served on `http://localhost:3000/v1`.


## Available Model Ids

- Open AI
  - gpt-4o
  - gpt-4o-2024-05-13
  - gpt-4o-2024-08-06 (default)
  - gpt-4o-mini
  - gpt-4o-mini-2024-07-18
  - gpt-4-turbo
  - gpt-4-turbo-2024-04-09
  - gpt-4-turbo-preview
  - gpt-4-0125-preview
  - gpt-4-1106-preview
  - gpt-4
  - gpt-4-0613
  - gpt-3.5-turbo-0125
  - gpt-3.5-turbo
  - gpt-3.5-turbo-1106
- Anthropic
  - claude-3-5-sonnet-20240620
  - claude-3-opus-20240229
  - claude-3-sonnet-20240229
  - claude-3-haiku-20240307


## URL Parameters

### `page`

```
GET /api/posts?page=2
```

### `per_page`

```
GET /api/posts?per_page=5
```


## FAQ

### Where can I find the generated data?

`gfa` generates the data into the `node_modules/gfa/dist` directory. You can tweak the data or add more data to the generated files if you want.

### If I modify the resources through the API, will the changes be saved?

Currently, `gfa` does not save the changes made to the resources through the API.

### How much does it cost to use `gfa`?

The cost of using `gfa` varies based on the AI provider and the amount of data you generate. `gfa` displays the total number of tokens generated each time you run the command. For the details of the pricing, please refer to the pricing pages of the AI providers:

- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [Anthropic API Pricing](https://www.anthropic.com/pricing#anthropic-api)
