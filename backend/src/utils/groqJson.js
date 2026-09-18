import Groq from "groq-sdk";
import { z } from "zod";

/* Every AI feature here used `response_format: { type: "json_object" }`, which
   only promises *some* JSON — the fields inside were whatever the model felt
   like, so a missing key or a renamed one reached the code as a schema
   mismatch (Groq rejects the worst cases with json_validate_failed and the
   whole call dies). Groq's Structured Outputs constrain decoding against a
   JSON Schema instead, so the response is the shape we asked for by
   construction. gpt-oss-120b is one of the models that support strict mode. */
export const GROQ_MODEL = "openai/gpt-oss-120b";

/* Built on first use rather than at import: this module is pulled in while the
   server boots, which is before dotenv has populated process.env. */
let client = null;
const getGroq = () => {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
};

/* zod is the single source of truth: it renders the JSON Schema sent to Groq
   and then validates what comes back, so the two can never drift apart.
   Strict mode requires every property to be listed in `required` and every
   object to set `additionalProperties: false` — both of which
   z.toJSONSchema({ io: "output" }) emits for a plain z.object. */
const strictSchemaFor = (schema) => z.toJSONSchema(schema, { io: "output" });

const schemaMismatch = (name, issues) => {
  const error = new Error(
    `Groq response for "${name}" did not match its schema: ${issues}`
  );
  error.code = "GROQ_SCHEMA_MISMATCH";
  return error;
};

/**
 * Ask Groq for a JSON document that matches `schema` and return the parsed,
 * validated value. Throws (instead of returning something half-formed) so each
 * caller keeps its own fallback — a bad AI answer must never break the screen
 * the user is waiting on.
 *
 * @param {Object} options
 * @param {string} options.name - schema name reported to Groq
 * @param {import("zod").ZodType} options.schema - zod schema for the answer
 * @param {string} options.prompt - user message
 * @param {string} [options.system] - optional system message
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens] - headroom must also cover reasoning tokens
 * @param {string} [options.reasoningEffort] - "low" keeps thinking short for lookups
 */
export const generateStructured = async ({
  name,
  schema,
  prompt,
  system,
  temperature = 0.6,
  maxTokens,
  reasoningEffort,
}) => {
  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt },
    ],
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    response_format: {
      type: "json_schema",
      json_schema: {
        name,
        strict: true,
        schema: strictSchemaFor(schema),
      },
    },
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    /* Truncated by max_tokens, or a stray non-JSON finish. */
    const failure = new Error(`Groq returned invalid JSON for "${name}": ${error.message}`);
    failure.code = "GROQ_INVALID_JSON";
    throw failure;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw schemaMismatch(
      name,
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"} ${issue.message}`)
        .join("; ")
    );
  }

  return result.data;
};
