#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { serve } from "@hono/node-server";
import type { LanguageModel } from "ai";
import { Hono } from "hono";

import { Schema } from ".";
import { createApi } from "./api";
import {
	createModel,
	generateMultipleObjects,
	generateSingleObject,
} from "./gen";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	// TODO: Read command line arguments
	const port = 3333;
	const modelId = "gpt-4o-mini";
	const schemaPath = "../schema.ts";
	const apiKey = process.env.OPENAI_API_KEY as string;

	const schema = await loadSchema(schemaPath);
	const model = createModel(modelId, apiKey);
	await generateObjects(schema, model);
	const generated = loadGeneratedObjects();
	const app = createApp(generated);

	console.log(`Serving API on http://localhost:${port}`);
	serve({
		fetch: app.fetch,
		port,
	});
}
main();

async function loadSchema(path: string) {
	const schema = await import(path);
	const parseResult = Schema.safeParse(schema.default);
	if (!parseResult.success) {
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
	} else {
		console.log("Objects already generated.");
	}
}

function loadGeneratedObjects() {
	const generated = fs.readFileSync(
		path.resolve(__dirname, "generated.json"),
		"utf-8",
	);

	return JSON.parse(generated) as Record<string, unknown>;
}

function createApp(data: Record<string, unknown>) {
	const app = new Hono();

	for (const [key, value] of Object.entries(data)) {
		const api = createApi(key);
		app.route("/", api);
	}

	return app;
}
