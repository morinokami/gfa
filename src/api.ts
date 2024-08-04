import path from "node:path";
import { Hono } from "hono";

export function createApi(
	resource: string,
	data: Array<Record<string, unknown>> | Record<string, unknown>,
	basePath: string,
) {
	const route = path.join("/", basePath, resource);

	return Array.isArray(data)
		? createMultipleItemEndoiubts(route, data)
		: createSingleItemEndpoints(route, data);
}

function createSingleItemEndpoints(
	route: string,
	data: Record<string, unknown>,
) {
	let item = data;
	const api = new Hono();

	api.get(route, (c) => {
		return c.json(item);
	});

	api.put(route, async (c) => {
		item = await c.req.json();

		return new Response(null, { status: 204 });
	});

	api.patch(route, async (c) => {
		const body = await c.req.json();

		item = { ...item, ...body };

		return new Response(null, { status: 204 });
	});

	return api;
}

function createMultipleItemEndoiubts(
	route: string,
	data: Array<Record<string, unknown>>,
) {
	const items = data;
	const api = new Hono();

	api.get(route, (c) => {
		return c.json(items);
	});

	api.get(`${route}/:id`, (c) => {
		const id = c.req.param("id");

		const item = items.find((item) => String(item.id) === id);
		if (!item) {
			return c.notFound();
		}

		return c.json(item);
	});

	api.post(route, async (c) => {
		const item = await c.req.json();

		items.push(item);

		return new Response(null, { status: 201 });
	});

	api.put(`${route}/:id`, async (c) => {
		const id = c.req.param("id");
		const item = await c.req.json();

		const index = items.findIndex((item) => String(item.id) === id);
		if (index === -1) {
			return c.notFound();
		}
		items[index] = item;

		return new Response(null, { status: 204 });
	});

	api.patch(`${route}/:id`, async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json();

		const index = items.findIndex((item) => String(item.id) === id);
		if (index === -1) {
			return c.notFound();
		}
		items[index] = { ...items[index], ...body };

		return new Response(null, { status: 204 });
	});

	api.delete(`${route}/:id`, (c) => {
		const id = c.req.param("id");

		const index = items.findIndex((item) => String(item.id) === id);
		if (index === -1) {
			return c.notFound();
		}
		items.splice(index, 1);

		return new Response(null, { status: 204 });
	});

	return api;
}
