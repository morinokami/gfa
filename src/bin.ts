#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { serve } from "@hono/node-server";
import type { LanguageModel } from "ai";
import { Hono } from "hono";
import * as z from "zod";

import type { Schema } from ".";
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
	const schemaPath = "TODO";
	const apiKey = process.env.OPENAI_API_KEY as string;

	const schema = loadSchema(schemaPath);
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

function loadSchema(path: string) {
	// TODO: Load schema from a file
	const schema = {
		posts: {
			single: false,
			prompt: "Generate 3 posts",
			shape: z.object({
				id: z.number(),
				title: z.string(),
				views: z.number(),
			}),
		},
		comments: {
			single: false,
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

	return schema as Schema;
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
