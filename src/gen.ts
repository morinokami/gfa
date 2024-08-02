import type { OpenAIProvider } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { OpenAIChatModelId } from "@ai-sdk/openai/internal";
import type { LanguageModel } from "ai";
import { generateObject } from "ai";
import { z } from "zod";

export function createModel(
	modelId: OpenAIChatModelId,
	apiKey: string,
): ReturnType<OpenAIProvider> {
	const openai = createOpenAI({ apiKey });

	return openai(modelId);
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
