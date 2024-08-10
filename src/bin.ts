#!/usr/bin/env node

import * as path from "node:path";
import * as nodeServer from "@hono/node-server";
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
	const { seedPath, modelId, port, serve, basePath, regenerate } = parseArgs();

	if (!serve) {
		// Generate resources
		const seed = await loadSeed(path.join(process.cwd(), seedPath));
		const model = createModel(modelId);
		if (!generatedFileExists() || regenerate) {
			const spinner = ora("Generating resources...").start();
			const usage = await generateResources(seed, model);
			spinner.stopAndPersist({
				symbol: chalk.green("✔"),
				text: `Resources generated (total tokens: ${usage.totalTokens})\n`,
			});
		}
	}

	const generated = loadGeneratedResources(serve);
	const app = createApp(generated, basePath);

	console.log(
		`Serving API on http://localhost:${port} (Press Ctrl-C to quit)\n`,
	);
	console.log("Available routes:");
	showRoutes(app);

	nodeServer.serve({
		fetch: app.fetch,
		port,
	});
}
main();
