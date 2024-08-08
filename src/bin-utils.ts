import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import type { LanguageModel } from "ai";
import { Hono } from "hono";
import meow from "meow";
import { createServer } from "vite";

import { createApi } from "./api.js";
import {
	type AnthropicModelId,
	AnthropicModelIds,
	type OpenAIModelId,
	OpenAIModelIds,
	generateMultipleObjects,
	generateSingleObject,
} from "./gen.js";
import { Seed } from "./index.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATED_FILE = "generated.json";

export function parseArgs() {
	const defaultPort = 3000;
	const defaultModelId = "gpt-4o-mini";
	const defaultBasePath = "/api";
	const defaultRegenerate = false;
	const defaultProvider = "openai";
	const help = `
	Usage: npx gfa [options] seed.ts

	Options:
	  -p, --port    Port to serve the API on (default: ${defaultPort})
	  -m, --modelId Model ID to use (default: ${defaultModelId})
	  --basePath    Base path for the API (default: ${defaultBasePath})
	  --provider    AI provider to use (default: ${defaultProvider})
	  --regenerate  Regenerate the generated objects (default: ${defaultRegenerate})

	Model IDs:
	  Anthropic: ${AnthropicModelIds.join(", ")}
	  OpenAI: ${OpenAIModelIds.join(", ")}
`;

	const cli = meow(help, {
		importMeta: import.meta,
		booleanDefault: undefined,
		description: false,
		flags: {
			port: {
				type: "number",
				default: defaultPort,
				shortFlag: "p",
			},
			modelId: {
				type: "string",
				default: defaultModelId,
				shortFlag: "m",
				choices: [...AnthropicModelIds, ...OpenAIModelIds],
			},
			basePath: {
				type: "string",
				default: defaultBasePath,
			},
			provider: {
				type: "string",
				default: "openai",
				choices: ["openai", "anthropic"],
			},
			regenerate: {
				type: "boolean",
				default: defaultRegenerate,
			},
		},
	});

	if (cli.input.length !== 1) {
		cli.showHelp();
		process.exit(1);
	}

	if (
		cli.flags.provider === "anthropic" &&
		!AnthropicModelIds.includes(cli.flags.modelId as AnthropicModelId)
	) {
		console.error("Error: Invalid model ID for Anthropic");
		process.exit(1);
	} else if (
		cli.flags.provider === "openai" &&
		!OpenAIModelIds.includes(cli.flags.modelId as OpenAIModelId)
	) {
		console.error("Error: Invalid model ID for OpenAI");
		process.exit(1);
	}

	return {
		seedPath: cli.input[0],
		port: cli.flags.port,
		modelId: cli.flags.modelId as AnthropicModelId | OpenAIModelId,
		basePath: cli.flags.basePath,
		provider: cli.flags.provider as "openai" | "anthropic",
		regenerate: cli.flags.regenerate,
	};
}

export function readApiKey(provider: "openai" | "anthropic") {
	switch (provider) {
		case "openai":
			return process.env.OPENAI_API_KEY;
		case "anthropic":
			return process.env.ANTHROPIC_API_KEY;
		default: {
			const _: never = provider;
		}
	}
}

export async function loadSeed(path: string) {
	let seedObj = {};
	if (path.endsWith(".ts")) {
		const viteServer = await createServer({});
		const module = await viteServer.ssrLoadModule(path);
		seedObj = module.default;
	} else {
		const seed = await import(path);
		seedObj = seed.default;
	}
	if (seedObj === undefined) {
		throw new Error("Seed file must default export object");
	}

	const parseResult = Seed.safeParse(seedObj);
	if (!parseResult.success) {
		throw new Error(
			`Failed to parse seed file: ${JSON.stringify(
				parseResult.error.format(),
				null,
				2,
			)}`,
		);
	}

	return parseResult.data;
}

export function generatedFileExists() {
	return fs.existsSync(path.resolve(__dirname, GENERATED_FILE));
}

export async function generateResources(seed: Seed, model: LanguageModel) {
	const generated: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(seed)) {
		const generate = value.single
			? generateSingleObject
			: generateMultipleObjects;
		const object = await generate({
			model,
			schema: value.schema,
			prompt: value.prompt,
		});
		generated[key] = object;
	}

	fs.writeFileSync(
		path.resolve(__dirname, GENERATED_FILE),
		JSON.stringify(generated, null, 2),
		"utf-8",
	);
}

export function loadGeneratedResources() {
	const generated = fs.readFileSync(
		path.resolve(__dirname, GENERATED_FILE),
		"utf-8",
	);

	return JSON.parse(generated) as Record<
		string,
		Array<Record<string, unknown>> | Record<string, unknown>
	>;
}

export function createApp(
	data: Record<
		string,
		Array<Record<string, unknown>> | Record<string, unknown>
	>,
	basePath: string,
) {
	const app = new Hono();

	for (const [key, value] of Object.entries(data)) {
		const api = createApi(key, value, basePath);
		app.route("/", api);
	}

	return app;
}
