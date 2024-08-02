import type { SomeZodObject } from "zod";

export interface Schema {
	[key: string]: {
		single: boolean;
		shape: SomeZodObject;
		prompt?: string;
	};
}
