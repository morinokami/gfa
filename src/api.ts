import { Hono } from "hono";

export function createApi(resource: string) {
	const api = new Hono();

	// TODO: Add routes
	api.get(`/${resource}`, (c) => {
		return c.json({});
	});

	return api;
}
