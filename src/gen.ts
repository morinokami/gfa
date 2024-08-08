import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { OpenAIProvider } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { generateObject } from "ai";
import { z } from "zod";

// TODO: Make these constants maintainable
export const AnthropicModelIds = [
	"claude-3-5-sonnet-20240620",
	"claude-3-opus-20240229",
	"claude-3-sonnet-20240229",
	"claude-3-haiku-20240307",
] as const;
export const OpenAIModelIds = [
	"gpt-4o",
	"gpt-4o-2024-05-13",
	"gpt-4o-2024-08-06",
	"gpt-4o-mini",
	"gpt-4o-mini-2024-07-18",
	"gpt-4-turbo",
	"gpt-4-turbo-2024-04-09",
	"gpt-4-turbo-preview",
	"gpt-4-0125-preview",
	"gpt-4-1106-preview",
	"gpt-4",
	"gpt-4-0613",
	"gpt-3.5-turbo-0125",
	"gpt-3.5-turbo",
	"gpt-3.5-turbo-1106",
] as const;
export type AnthropicModelId = (typeof AnthropicModelIds)[number];
export type OpenAIModelId = (typeof OpenAIModelIds)[number];

export function createModel(
	modelId: AnthropicModelId | OpenAIModelId,
	apiKey: string,
): ReturnType<AnthropicProvider | OpenAIProvider> {
	if (AnthropicModelIds.includes(modelId as AnthropicModelId)) {
		const anthropic = createAnthropic({
			apiKey,
		});
		return anthropic(modelId);
	}

	const openai = createOpenAI({
		apiKey,
	});
	return openai(modelId, {
		structuredOutputs: modelId === "gpt-4o-2024-08-06",
	});
}

interface GenerateOptions {
	model: LanguageModel;
	schema: z.ZodObject<
		z.ZodRawShape,
		z.UnknownKeysParam,
		z.ZodTypeAny,
		unknown,
		unknown
	>;
	prompt?: string;
}

export async function generateSingleObject({
	model,
	schema,
	prompt,
}: GenerateOptions) {
	const { object } = await generateObject({
		model,
		schema,
		prompt,
	});

	return object;
}

export async function generateMultipleObjects({
	model,
	schema,
	prompt,
}: GenerateOptions) {
	const { object } = await generateObject({
		model,
		schema: z.object({ result: z.array(schema) }),
		prompt,
	});

	return object.result;
}
