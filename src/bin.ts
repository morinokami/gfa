#!/usr/bin/env node

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import * as z from "zod";
import { createApi } from "./api";
import {
	createModel,
	generateMultipleObjects,
	generateSingleObject,
} from "./gen";

// TODO: Load schema
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

// TODO: Generate objects if not already generated
const model = createModel("gpt-4o-mini", "x");
for (const [key, value] of Object.entries(schema)) {
	console.log(key);
	const generate = value.single
		? generateSingleObject
		: generateMultipleObjects;
	const object = await generate({
		model,
		// @ts-expect-error
		schema: value.shape,
		prompt: value.prompt,
	});
	console.log(object);
}

// TODO: Load generated objects
const generated = {
	posts: [
		{ id: 1, title: "Exploring the Wonders of Nature", views: 150 },
		{
			id: 2,
			title: "The Future of Technology: Trends to Watch",
			views: 200,
		},
		{
			id: 3,
			title: "Healthy Eating: Tips for a Balanced Diet",
			views: 120,
		},
	],
	comments: [
		{
			id: 1,
			text: "This is a great post! Really enjoyed reading it.",
			postId: 1,
		},
		{
			id: 2,
			text: "I completely agree with your point of view.",
			postId: 2,
		},
		{ id: 3, text: "Thanks for sharing this information!", postId: 1 },
		{
			id: 4,
			text: "Interesting perspective, I hadn't thought of it that way.",
			postId: 3,
		},
		{
			id: 5,
			text: "Looking forward to more posts like this!",
			postId: 2,
		},
	],
	profile: { name: "John Doe" },
};

const app = new Hono();

for (const [key, value] of Object.entries(generated)) {
	const api = createApi(key);
	app.route("/", api);
}

serve({
	fetch: app.fetch,
	port: 3333,
});
