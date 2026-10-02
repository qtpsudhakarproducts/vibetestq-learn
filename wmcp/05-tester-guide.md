# Chapter 5: Tester Guide — How to Test WebMCP

This chapter is the practical how-to for testers and QA engineers. Chapter 6 takes a step back and looks at *why* this is becoming a distinct testing discipline. Read this one first if you have a WebMCP-enabled site in front of you and you need to know what to do with it.

## What You Are Actually Testing

A WebMCP-enabled page exposes tools to AI agents. The agent calls those tools with parameters, the page executes them, and the agent reads the result. As a tester, you are validating four things across that loop:

- That the **tools register correctly** when the page loads, with the right names, descriptions, and schemas
- That the **execute function behaves correctly** for valid inputs, invalid inputs, edge cases, and various application states
- That the **agent can discover and pick the right tool** when given a natural-language goal, which is a function of how good your tool descriptions are
- That the **safety patterns work** — that destructive operations require confirmation, that the active-tool pseudo-classes apply, that `agentInvoked` differentiates correctly

Each of those four is a different kind of test, and you need all four for adequate coverage.

## Step 1: Verify Registration

The first thing to check on any WebMCP page is whether the tools you expect actually got registered. Open the Model Context Tool Inspector or the TAMASH extension (Chapter 7) and look at the list of tools detected on the current page.

For each tool, confirm the name matches what the developer documented, the description is present and reads sensibly, and the input schema declares the right parameters with the right types and the right `required` markers. If a tool is missing, the registration call probably did not run — common causes include the page not loading the relevant script, the user not being in the right authentication state, or a JavaScript error before registration. If a tool appears but its schema is wrong, the bug is in the `inputSchema` definition.

Pay attention to **dynamic registration** especially. If the developer registers tools after login, log in and confirm the new tools appear. Log out and confirm they disappear. If the developer registers tools per route in a single-page app, navigate between routes and confirm each route's tool surface is correct. Stale tools that linger after navigation are a common bug class.

## Step 2: Manual Execution With Hand-Crafted Parameters

Once registration is verified, the next step is to call each tool directly with inputs you control. Both the Model Context Tool Inspector and TAMASH let you select a tool, paste a JSON object of parameters into an input field, and execute it.

This is the most valuable single technique in WebMCP testing because it isolates the tool from the LLM. If a tool works correctly with hand-crafted parameters but fails when an agent calls it, the bug is in the description or the schema (the LLM is sending wrong inputs). If a tool fails with hand-crafted parameters too, the bug is in the `execute` function. This isolation cuts your debugging time in half.

For each tool, run it at minimum with valid parameters, with parameters that violate `required`, with parameters that violate `enum` constraints, with parameters at boundary values (zero, maximum, empty string, very long string), and with parameters that look correct but are semantically wrong (a date in the past for a future-only field, a party size of fifteen when the schema allows up to twelve). Confirm the responses are clear, the UI updates correctly, and the page state is consistent after the call.

## Step 3: Natural-Language Testing

The Model Context Tool Inspector ships with a Gemini API integration; TAMASH supports OpenAI, Anthropic, Google, and Ollama. Both let you type a natural-language prompt and watch which tool the agent picks and what parameters it sends.

This is where you find a different kind of bug — bugs in how the agent interprets your tool surface. The agent might pick the wrong tool because two tool descriptions are too similar. It might fail to pick a tool at all because the description does not mention the trigger words the user used. It might map parameters incorrectly because a description was ambiguous. None of these are bugs in the `execute` function — they are bugs in the tool definitions, and they only surface when a real LLM is making the choice.

A useful technique is to write a small set of prompts that *should* exercise each tool and run them all every time the tool surface changes. "Search for round-trip flights from London to New York for two passengers leaving June tenth" should reliably hit `searchFlights`. "Cancel my account" should reliably hit `cancelAccount`. If a prompt that used to work stops working after a tool definition change, you have a regression in description quality.

## Step 4: Edge Case Coverage

A solid WebMCP test pass covers several edge cases beyond the happy path.

**Authentication states.** What happens when an unauthenticated user's agent tries to call a tool that requires login? The tool should either be unregistered for unauthenticated users or return a clear "please log in first" response that the agent can act on. Both are acceptable; silent failure is not.

**Disabled or hidden UI states.** If the developer disables a checkout button because the cart is empty, the corresponding tool should also become unavailable or return a sensible error. Tools that work when the equivalent UI is unavailable are a class of bug specific to WebMCP.

**API or backend downtime.** If the tool calls a backend that is failing, the agent needs to know. Verify the tool returns a structured error response rather than throwing or hanging. Generic "something went wrong" messages are worse for agents than specific ones — agents can sometimes self-correct from a specific error but rarely from a vague one.

**Rate limiting.** If your application has rate limits, agents will hit them faster than humans because they can fire many calls in quick succession. Verify rate limits return a clear retry-after signal and that the tool surfaces this to the agent rather than failing silently.

**Destructive actions.** For any tool that deletes, charges, sends, or otherwise has consequences, confirm the human-in-the-loop pattern works. The user should see a confirmation modal or a Submit button. The agent should not be able to complete the action without a human signal. Test this by calling the tool through the agent and confirming you, as the user, are prompted before anything irreversible happens.

**Concurrent calls.** What happens if the agent calls two tools rapidly? Most tools should be safely concurrent, but tools that mutate shared state (cart, draft document, in-progress checkout) may need serialization. Test this by firing rapid sequences from the inspector and watching for race conditions.

## Step 5: Safety Pattern Verification

Finally, confirm the safety surface is intact.

Verify that `:tool-form-active` styling appears on forms during agent interaction. The user needs to see when an agent is filling a form so they can intervene if something looks wrong.

Verify that `agentInvoked` is correctly distinguishing agent submissions from human submissions. The simplest test is to instrument a form to log the value, then submit it once with a real click and once via the inspector and confirm the log shows the correct values.

Verify `toolactivated` and `toolcancel` events fire as expected and that any UI banners or activity indicators tied to them appear and disappear correctly.

For tools without `toolautosubmit`, verify that the user has to click Submit after the agent fills the form. For destructive imperative tools, verify the confirmation modal appears and that cancelling actually cancels.

## Reporting Bugs in WebMCP Tools

A WebMCP bug report should include several pieces of information that traditional bug reports do not. The tool name and version of the page is a baseline. Beyond that, capture the exact JSON parameters that were sent (manual or agent-generated), the exact response that came back, the agent or LLM model used if the test was natural-language, the prompt that triggered the call, and the page state at the time of the call (logged in or not, what data was loaded, what the URL was).

Without the parameters and the response, a developer cannot tell whether the bug is in the description, the schema, the `execute` function, or the UI update. Be generous with detail — WebMCP debugging benefits from full reproductions far more than typical UI bugs do.

## Tooling Summary

For day-to-day testing, the practical toolkit is:

- **Model Context Tool Inspector** for basic schema viewing, manual execution, and Gemini-based natural-language testing
- **TAMASH Chrome extension** (covered in detail in Chapter 7) for a more capable workflow including BYO-key agent testing across multiple providers, remote MCP server connectivity, and Tool Tester mode
- **`tamash-wmcp` MCP server** (also Chapter 7) for IDE-driven testing, where you call live page tools from Cursor or Claude Desktop and inspect responses programmatically
- **Playwright** for automated regression of WebMCP tools in CI — drive a browser, register-tools, call them, assert responses

Most teams will start with the Tool Inspector for exploratory testing, move to TAMASH for more involved work, and add Playwright for regression once the tool surface is stable.
