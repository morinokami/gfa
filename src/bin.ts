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
	loadSeed,
	parseArgs,
} from "./bin-utils.js";
import { createModel } from "./gen.js";

async function main() {
	const { seedPath, port, modelId, basePath, regenerate } = parseArgs();
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("Error: OPENAI_API_KEY environment variable must be set");
		process.exit(1);
	}

	const seed = await loadSeed(path.join(process.cwd(), seedPath));
	const model = createModel(modelId, apiKey);
	if (!generatedFileExists() || regenerate) {
		const spinner = ora("Generating resources...").start();
		await generateResources(seed, model);
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
