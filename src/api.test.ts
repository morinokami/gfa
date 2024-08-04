import assert from "node:assert";
import test from "node:test";
import { inspectRoutes } from "hono/dev";

import { createApi } from "./api";

test("createApi", async (t) => {
	await t.test("should create an API for a single item", () => {
		const api = createApi("user", { id: 1, name: "Alice" }, "api");
		const routes = inspectRoutes(api);

		// there are 3 routes
		assert.strictEqual(routes.length, 3);
		// route path is correct
		assert(routes.every((route) => route.path === "/api/user"));
		// expected methods are present
		const methods = routes.map((route) => route.method);
		assert(methods.includes("GET"));
		assert(methods.includes("PUT"));
		assert(methods.includes("PATCH"));
	});

	await t.test("should create an API for multiple items", () => {
		const api = createApi(
			"users",
			[
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" },
			],
			"api",
		);
		const routes = inspectRoutes(api);

		// there are 6 routes
		assert.strictEqual(routes.length, 6);
		// expected methods are present
		const routesWithoutId = routes.filter(
			(route) => route.path === "/api/users",
		);
		const routesWithId = routes.filter((route) => route.path !== "/api/users");
		assert.strictEqual(routesWithoutId.length, 2);
		assert.strictEqual(routesWithId.length, 4);
		const methodsWithoutId = routesWithoutId.map((route) => route.method);
		const methodsWithId = routesWithId.map((route) => route.method);
		assert(methodsWithoutId.includes("GET"));
		assert(methodsWithoutId.includes("POST"));
		assert(methodsWithId.includes("GET"));
		assert(methodsWithId.includes("PUT"));
		assert(methodsWithId.includes("PATCH"));
		assert(methodsWithId.includes("DELETE"));
	});

	// TODO: Test each route's behavior
});
