import { Hono } from "hono";

export function createApi(
	resource: string,
	data: Array<unknown> | Record<string, unknown>,
) {
	const api = new Hono();

	// TODO: Add routes
	api.get(`/${resource}`, (c) => {
		return c.json(data);
	});

	return api;
}
