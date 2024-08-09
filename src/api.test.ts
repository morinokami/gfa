import assert from "node:assert/strict";
import test from "node:test";
import type { Hono } from "hono";

import { users } from "../fixtures/users";
import { createApi } from "./api";

test("createApi", async (t) => {
	await t.test("single item", async (t) => {
		let api: Hono;
		t.beforeEach(() => {
			api = createApi("user", structuredClone(users[0]), "api");
		});

		await t.test("can GET a single item", async () => {
			const res = await api.request("/api/user", { method: "GET" });
			assert.deepStrictEqual(await res.json(), users[0]);
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
			api = createApi("users", structuredClone(users), "api");
		});

		await t.test("can GET multiple items", async () => {
			const res = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res.json(), users.slice(0, 10));
		});

		await t.test("can paginate multiple items", async () => {
			const res1 = await api.request("/api/users?per_page=5&page=1", {
				method: "GET",
			});
			assert.deepStrictEqual(await res1.json(), users.slice(0, 5));

			const res2 = await api.request("/api/users?per_page=5&page=2", {
				method: "GET",
			});
			assert.deepStrictEqual(await res2.json(), users.slice(5, 10));

			const res3 = await api.request("/api/users?per_page=5&page=3", {
				method: "GET",
			});
			assert.deepStrictEqual(await res3.json(), users.slice(10, 11));
		});

		await t.test("can GET a single item", async () => {
			const res = await api.request("/api/users/1", { method: "GET" });
			assert.deepStrictEqual(await res.json(), users[0]);
		});

		await t.test("can POST a single item", async () => {
			const res = await api.request("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: 12, name: "Larry" }),
			});
			assert.strictEqual(res.status, 201);

			const res2 = await api.request("/api/users/12", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), { id: 12, name: "Larry" });
		});

		await t.test("can PUT a single item", async () => {
			const res = await api.request("/api/users/11", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: 11, name: "Ken" }),
			});
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/users/11", { method: "GET" });
			assert.deepEqual(await res2.json(), { id: 11, name: "Ken" });
		});

		await t.test("can PATCH a single item", async () => {
			const res = await api.request("/api/users/1", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Anna" }),
			});
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/users/1", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), { id: 1, name: "Anna" });
		});

		await t.test("can DELETE a single item", async () => {
			const res = await api.request("/api/users/1", { method: "DELETE" });
			assert.strictEqual(res.status, 204);

			const res2 = await api.request("/api/users", { method: "GET" });
			assert.deepStrictEqual(await res2.json(), [...users.slice(1, 11)]);
		});
	});
});
