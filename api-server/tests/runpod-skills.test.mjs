import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRunpodCareerChatRequest,
  buildRunpodSkillRequest,
  parseRunpodSkills,
  readRunpodChatResponse,
} from "../src/lib/runpod-skills.ts";

const catalog = ["Data Analytics", "Software Development", "Communication Skills"];

test("builds a bounded career chat request and includes optional CV context", () => {
  const request = buildRunpodCareerChatRequest([
    { role: "user", content: "What role fits me?" },
    { role: "assistant", content: "Tell me about your projects." },
    { role: "user", content: "I built a dashboard." },
  ], "Synthetic CV text");
  assert.equal(request.model, "Qwen/Qwen3-8B");
  assert.equal(request.chat_template_kwargs.enable_thinking, false);
  assert.match(request.messages[0].content, /summarize its experience, skills, strengths/);
  assert.match(request.messages[0].content, /Never invent qualifications/);
  assert.ok(request.messages.some((message) => message.content.includes("Synthetic CV text")));
  assert.deepEqual(request.messages.slice(-3).map(({ role }) => role), ["user", "assistant", "user"]);
  const bounded = buildRunpodCareerChatRequest(
    [{ role: "user", content: "x".repeat(2_500) }],
    "y".repeat(25_000),
  );
  assert.ok(bounded.messages.every((message) => message.content.length < 20_200));
  assert.ok(!bounded.messages.some((message) => message.content.includes("x".repeat(2_001))));
});

test("requests non-thinking, schema-constrained JSON with room for the final answer", () => {
  const request = buildRunpodSkillRequest("Synthetic CV", catalog);
  assert.equal(request.chat_template_kwargs.enable_thinking, false);
  assert.match(request.messages[1].content, /\/no_think$/);
  assert.equal(request.response_format.type, "json_schema");
  assert.deepEqual(request.response_format.json_schema.schema.properties.skills.items.enum, catalog);
  assert.ok(request.max_tokens > 240);
});

test("bounds the CV text sent to the model", () => {
  const request = buildRunpodSkillRequest("x".repeat(30_000), catalog);
  assert.ok(!request.messages[1].content.includes("x".repeat(20_001)));
});

test("canonicalizes and deduplicates catalogue names", () => {
  assert.deepEqual(
    parseRunpodSkills('{"skills":["data analytics"," Software Development ","Data Analytics","Unknown"]}', catalog),
    ["Data Analytics", "Software Development"],
  );
});

test("reads fenced JSON surrounded by explanatory text", () => {
  assert.deepEqual(
    parseRunpodSkills('Result:\n```json\n{"skills":["Data Analytics"]}\n```\nEnd.', catalog),
    ["Data Analytics"],
  );
});

test("ignores JSON inside reasoning and reads only the final answer", () => {
  assert.deepEqual(
    parseRunpodSkills('<think>{"skills":["Software Development"]}</think>{"skills":["Data Analytics"]}', catalog),
    ["Data Analytics"],
  );
});

test("handles a closing reasoning tag when the template omitted the opening tag", () => {
  assert.deepEqual(
    parseRunpodSkills('Some reasoning</think>\n{"skills":["Communication Skills"]}', catalog),
    ["Communication Skills"],
  );
});

test("accepts a complete top-level string array", () => {
  assert.deepEqual(parseRunpodSkills('["Data Analytics"]', catalog), ["Data Analytics"]);
});

test("accepts an explicit empty result", () => {
  assert.deepEqual(parseRunpodSkills('{"skills":[]}', catalog), []);
});

test("rejects truncated JSON rather than showing a misleading empty result", () => {
  assert.throws(() => parseRunpodSkills('{"skills":["Data Analytics"', catalog));
});

test("rejects unfinished thinking even if it contains JSON", () => {
  assert.throws(() => parseRunpodSkills('<think>{"skills":["Data Analytics"]}', catalog));
});

test("rejects unsupported values and unknown-only results", () => {
  for (const content of ['{"skills":"Data Analytics"}', '{"skills":[42]}', '{"skills":["Unknown"]}']) {
    assert.throws(() => parseRunpodSkills(content, catalog));
  }
});

test("reads completion metadata without exposing reasoning or other response fields", () => {
  assert.deepEqual(readRunpodChatResponse({
    choices: [{ message: { content: '{"skills":[]}', reasoning_content: "private reasoning" }, finish_reason: "stop" }],
    usage: { completion_tokens: 8 },
  }), { text: '{"skills":[]}', finishReason: "stop", completionTokens: 8 });
  assert.deepEqual(readRunpodChatResponse(null), {});
});
