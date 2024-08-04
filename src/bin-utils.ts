import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import type { LanguageModel } from "ai";
import { Hono } from "hono";
import meow from "meow";

import { createApi } from "./api.js";
import { generateMultipleObjects, generateSingleObject } from "./gen.js";
import { Schema } from "./index.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATED_FILE = "generated.json";

export function parseArgs() {
	const defaultPort = 3000;
	const defaultModelId = "gpt-4o-mini";
	const defaultBasePath = "/api";
	const defaultRegenerate = false;
	const help = `
	Usage: npx gen-api [options] schema.ts

	Options:
	  -p, --port    Port to serve the API on (default: ${defaultPort})
	  -m, --modelId OpenAI model ID to use (default: ${defaultModelId})
	  --basePath    Base path for the API (default: ${defaultBasePath})
	  --regenerate  Regenerate the generated objects (default: ${defaultRegenerate})
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
		schemaPath: cli.input[0],
		port: cli.flags.port,
		modelId: cli.flags.modelId,
		basePath: cli.flags.basePath,
		regenerate: cli.flags.regenerate,
	};
}

// TODO: Support loading from a TS file
export async function loadSchema(path: string) {
	const schema = await import(path);
	const parseResult = Schema.safeParse(schema.default);
	if (!parseResult.success) {
		// TODO: Show error details
		throw new Error("Failed to parse schema file");
	}

	return parseResult.data;
}

export function generatedFileExists() {
	return fs.existsSync(path.resolve(__dirname, GENERATED_FILE));
}

export async function generateResources(schema: Schema, model: LanguageModel) {
	const generated: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(schema)) {
		const generate = value.single
			? generateSingleObject
			: generateMultipleObjects;
		const object = await generate({
			model,
			schema: value.shape,
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
