import assert from "node:assert/strict";
import test from "node:test";
import type { Hono } from "hono";
import { createApi } from "./api";

test("createApi", async (t) => {
	await t.test("single item", async (t) => {
		let api: Hono;
		t.beforeEach(() => {
			api = createApi("user", { id: 1, name: "Alice" }, "api");
		});

		await t.test("can GET a single item", async () => {
			const res = await api.request("/api/user", { method: "GET" });
			assert.deepStrictEqual(await res.json(), { id: 1, name: "Alice" });
		});

		await t.test("can PUT a single item", async () => {
			const res = await api.request("/api/user", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: 2, name: "Bob" }),
			});
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/user", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), { id: 2, name: "Bob" });
		});

		await t.test("can PATCH a single item", async () => {
			const res = await api.request("/api/user", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Bob" }),
			});
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/user", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), { id: 1, name: "Bob" });
		});
	});

	await t.test("multiple items", async (t) => {
		let api: Hono;
		t.beforeEach(() => {
			api = createApi(
				"users",
				[
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" },
				],
				"api",
			);
		});

		await t.test("can GET multiple items", async () => {
			const res = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res.json(), [
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" },
			]);
		});

		await t.test("can GET a single item", async () => {
			const res = await api.request("/api/users/1", { method: "GET" });
			assert.deepStrictEqual(await res.json(), { id: 1, name: "Alice" });
		});

		await t.test("can POST a single item", async () => {
			const res = await api.request("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: 3, name: "Charlie" }),
			});
			assert.strictEqual(res.status, 201);

			const res2 = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), [
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" },
				{ id: 3, name: "Charlie" },
			]);
		});

		await t.test("can PUT a single item", async () => {
			const res = await api.request("/api/users/1", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: 3, name: "Charlie" }),
			});
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), [
				{ id: 3, name: "Charlie" },
				{ id: 2, name: "Bob" },
			]);
		});

		await t.test("can PATCH a single item", async () => {
			const res = await api.request("/api/users/1", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Charlie" }),
			});
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), [
				{ id: 1, name: "Charlie" },
				{ id: 2, name: "Bob" },
			]);
		});

		await t.test("can DELETE a single item", async () => {
			const res = await api.request("/api/users/1", { method: "DELETE" });
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), [{ id: 2, name: "Bob" }]);
		});
	});
});
