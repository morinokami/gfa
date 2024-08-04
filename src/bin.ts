#!/usr/bin/env node

import * as path from "node:path";
import { serve } from "@hono/node-server";
import chalk from "chalk";
import { showRoutes } from "hono/dev";
import ora from "ora";

import {
	createApp,
	generateResources,
	generatedFileExists,
	loadGeneratedResources,
	loadSchema,
	parseArgs,
} from "./bin-utils.js";
import { createModel } from "./gen.js";

async function main() {
	const { schemaPath, port, modelId, basePath, regenerate } = parseArgs(); // TODO: Check if port is valid and available
	const apiKey = process.env.OPENAI_API_KEY as string; // TODO: Check if API key is set

	const schema = await loadSchema(path.join(process.cwd(), schemaPath));
	const model = createModel(modelId, apiKey);
	if (!generatedFileExists() || regenerate) {
		const spinner = ora("Generating resources...").start();
		await generateResources(schema, model);
		spinner.stopAndPersist({
			symbol: chalk.green("✔"),
			text: "Resources generated\n",
		});
	}
	const generated = loadGeneratedResources();
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
