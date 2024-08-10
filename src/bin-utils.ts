import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import type { CompletionTokenUsage, LanguageModel } from "ai";
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
	const help = `
	Usage: npx gfa [options] seed.ts

	Options:
	  -m, --modelId Model ID to use (default: ${defaultModelId})
	  -p, --port    Port to serve the API on (default: ${defaultPort})
	  -s, --serve   Path to the resources file to serve (default: <system generated file>)
	  --basePath    Base path for the API (default: ${defaultBasePath})
	  --regenerate  Regenerate the generated objects (default: ${defaultRegenerate})

	Model IDs:
	  OpenAI: ${OpenAIModelIds.join(", ")}
	  Anthropic: ${AnthropicModelIds.join(", ")}
`;

	const cli = meow(help, {
		importMeta: import.meta,
		booleanDefault: undefined,
		description: false,
		flags: {
			modelId: {
				type: "string",
				default: defaultModelId,
				shortFlag: "m",
				choices: [...AnthropicModelIds, ...OpenAIModelIds],
			},
			port: {
				type: "number",
				default: defaultPort,
				shortFlag: "p",
			},
			serve: {
				type: "string",
				shortFlag: "s",
			},
			basePath: {
				type: "string",
				default: defaultBasePath,
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

	return {
		seedPath: cli.input[0],
		modelId: cli.flags.modelId as AnthropicModelId | OpenAIModelId,
		port: cli.flags.port,
		serve: cli.flags.serve,
		basePath: cli.flags.basePath,
		regenerate: cli.flags.regenerate,
	};
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
	const usage: CompletionTokenUsage = {
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
	};

	for (const [key, value] of Object.entries(seed)) {
		const generate = value.single
			? generateSingleObject
			: generateMultipleObjects;
		const object = await generate({
			model,
			schema: value.schema,
			prompt: value.prompt,
		});
		generated[key] = object.result;
		usage.promptTokens += object.tokenUsage.promptTokens;
		usage.completionTokens += object.tokenUsage.completionTokens;
		usage.totalTokens += object.tokenUsage.totalTokens;
	}

	fs.writeFileSync(
		path.resolve(__dirname, GENERATED_FILE),
		JSON.stringify(generated, null, 2),
		"utf-8",
	);

	return usage;
}

export function loadGeneratedResources(customPath?: string) {
	const generated = fs.readFileSync(
		customPath
			? path.join(process.cwd(), customPath)
			: path.resolve(__dirname, GENERATED_FILE),
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
