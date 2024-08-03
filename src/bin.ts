#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { serve } from "@hono/node-server";
import type { LanguageModel } from "ai";
import { Hono } from "hono";
import meow from "meow";

import { showRoutes } from "hono/dev";
import { createApi } from "./api.js";
import {
	createModel,
	generateMultipleObjects,
	generateSingleObject,
} from "./gen.js";
import { Schema } from "./index.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	const { schemaPath, port, modelId, basePath } = parseArgs();
	const apiKey = process.env.OPENAI_API_KEY as string;

	const schema = await loadSchema(path.join(process.cwd(), schemaPath));
	const model = createModel(modelId, apiKey);
	await generateObjects(schema, model);
	const generated = loadGeneratedObjects();
	const app = createApp(generated, basePath);

	console.log(
		`Serving API on http://localhost:${port} (Press Ctrl-C to quit)\n`,
	);
	console.log("Available routes:");
	showRoutes(app);

	serve({
		fetch: app.fetch,
		port,
	});
}
main();

function parseArgs() {
	const defaultPort = 3000;
	const defaultModelId = "gpt-4o-mini";
	const defaultBasePath = "/api";
	const help = `
	Usage: npx gen-api [options] schema.ts

	Options:
	  -p, --port    Port to serve the API on (default: ${defaultPort})
	  -m, --modelId OpenAI model ID to use (default: ${defaultModelId})
	  --basePath    Base path for the API (default: ${defaultBasePath})
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
	};
}

// TODO: Support loading from a TS file
async function loadSchema(path: string) {
	const schema = await import(path);
	const parseResult = Schema.safeParse(schema.default);
	if (!parseResult.success) {
		// TODO: Show error details
		console.error("Failed to parse schema file");
		process.exit(1);
	}

	return parseResult.data;
}

async function generateObjects(schema: Schema, model: LanguageModel) {
	if (!fs.existsSync(path.resolve(__dirname, "generated.json"))) {
		console.log("Generating objects...");
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
			path.resolve(__dirname, "generated.json"),
			JSON.stringify(generated, null, 2),
			"utf-8",
		);
	}
}

function loadGeneratedObjects() {
	const generated = fs.readFileSync(
		path.resolve(__dirname, "generated.json"),
		"utf-8",
	);

	return JSON.parse(generated) as Record<
		string,
		Array<Record<string, unknown>> | Record<string, unknown>
	>;
}

function createApp(
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
