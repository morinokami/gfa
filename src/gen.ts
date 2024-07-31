import type { OpenAIProvider } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { OpenAIChatModelId } from "@ai-sdk/openai/internal";
import type { LanguageModel } from "ai";
import { generateObject } from "ai";
import * as z from "zod";
import type { ZodObject, ZodRawShape } from "zod";

export function createModel(
	modelId: OpenAIChatModelId,
	apiKey: string,
): ReturnType<OpenAIProvider> {
	const openai = createOpenAI({ apiKey });
	return openai(modelId);
}

interface GenerateOptions<T extends ZodRawShape> {
	model: LanguageModel;
	schema: ZodObject<T>;
	prompt?: string;
}

export async function generateSingleObject<T extends ZodRawShape>({
	model,
	schema,
	prompt,
}: GenerateOptions<T>) {
	const { object } = await generateObject({
		model,
		schema,
		prompt,
	});
	return object;
}

export async function generateMultipleObjects<T extends ZodRawShape>({
	model,
	schema,
	prompt,
}: GenerateOptions<T>) {
	const { object } = await generateObject({
		model,
		schema: z.object({ result: z.array(schema) }),
		prompt,
	});
	return object.result;
}
