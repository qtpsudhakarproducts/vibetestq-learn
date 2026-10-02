# Chapter 4: Developer Guide

This chapter walks through the full developer workflow: getting your environment ready, choosing between the two APIs, writing tool definitions, handling safety, and shipping responsibly while the spec is still in flux.

## Prerequisites and Environment Setup

You need three things to start: a compatible browser, the right flag enabled, and ideally a test inspector extension.

**Chrome Canary 146 or higher** is required. The flag does not exist in Stable, Beta, or Dev channels. This trips up a surprising number of developers — verify your channel by visiting `chrome://version` and checking that it says "Canary" before you spend any time debugging a missing flag. If you are on Chrome 147 Stable rather than Canary, the flag is still not present despite the version number being higher than 146.

**Enable the flag** by navigating to `chrome://flags/#enable-webmcp-testing`, setting it to Enabled, and relaunching. After relaunch, open DevTools, go to the Console tab, and run `console.log(navigator.modelContext)`. If the result is an object rather than `undefined`, the API is loaded and you are ready to develop.

**Install the Model Context Tool Inspector extension** from the Chrome Web Store. It is not strictly required, but you will spend considerably more time debugging without it. The extension lists every tool registered on the current page, exposes each tool's input schema, lets you execute tools manually with hand-crafted parameters, and includes Gemini API integration for natural-language testing. For local file testing, enable "Allow access to file URLs" in the extension's settings. Chapter 7 covers a more capable alternative — the **TAMASH** extension — which adds remote MCP servers, an embedded agent mode, and an IDE bridge.

## The Two APIs

WebMCP exposes two ways to register tools. The **Declarative API** is HTML-only and works by adding attributes to existing forms. The **Imperative API** is JavaScript-based and gives you full control. They are not exclusive — most production sites will use both.

### When to Use the Declarative API

The declarative path is the lowest-effort way to make an existing site agent-aware. If you already have a search form, a filter panel, an availability checker, or any other form that submits to a backend, you can turn it into an agent-callable tool by adding attributes to the form element and its inputs.

The relevant attributes are `toolname` and `tooldescription` on the form itself, and `toolparamtitle` and `toolparamdescription` on individual fields. The browser reads the existing field types, the `required` markers, the options inside `<select>` elements, and generates a JSON schema automatically. You write almost no new code.

There is one important attribute called `toolautosubmit`. By default, when an agent calls a declarative tool, the browser fills the form with the agent's parameters but stops there — the user has to click Submit. Adding `toolautosubmit` skips that confirmation step. Add it only for read-only operations like searching or checking availability. For anything that writes data, modifies state, or has financial consequences, leave it off and let the user confirm.

### When to Use the Imperative API

The imperative path is what you reach for when forms are not enough. API calls, computed results, multi-step workflows, custom validation logic, anything that should not map to a form submission — these all belong in `navigator.modelContext.registerTool()`.

```javascript
navigator.modelContext.registerTool({
  name: "addTodo",
  description: "Add a new item to the user's to-do list. Use when the user asks to create, add, or remember a task.",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "The task description" },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Priority level. Default to 'medium' if unspecified."
      }
    },
    required: ["text"]
  },
  execute: ({ text, priority = "medium" }) => {
    todoApp.addItem({ id: Date.now(), text, priority, done: false });
    todoApp.renderList();
    return {
      content: [{ type: "text", text: `Added "${text}" with ${priority} priority.` }]
    };
  }
});
```

That tool has the four parts every imperative tool has: a `name` that the agent uses to invoke it, a `description` that helps the LLM decide when to use it, an `inputSchema` in JSON Schema format, and an `execute` function that does the work and returns a structured response.

### Dynamic Registration

Tools do not have to be registered all at once. You can register and unregister them as application state changes — expose a login tool to anonymous users, then unregister it and expose account-specific tools after authentication. The pattern keeps the tool surface aligned with what the user can actually do at any given moment, which both improves agent accuracy (fewer wrong-tool selections) and reduces security exposure (no exposing admin tools to unauthenticated users).

A note on lifecycle methods: the spec has shifted across previews. Some helpers that existed in Chrome 146 were removed in March 2026, including `provideContext` and `clearContext`. The durable pattern is "expose only the tools that make sense for the current page state, and clean them up when they no longer apply" — the exact method names may continue to change. Verify against the current Chrome documentation before relying on a specific helper.

## Writing Good Tool Definitions

The technical mechanics of registering a tool are easy. Writing a *good* tool definition — one that an LLM will actually invoke correctly — takes more thought.

**Names should read like verbs.** `searchFlights`, `cancelOrder`, `addToCart` — these tell an LLM what the tool does. Names like `flights` or `order` give the model less to work with. Use camelCase or snake_case consistently across your tool surface.

**Descriptions should be positive and specific.** Write "use this to check flight availability for a given route and date" instead of "do not use this for hotel bookings." Models trained on natural language pick up positive guidance better than negative. Mention the trigger conditions — "use when the user asks about availability, price, or schedule for flights."

**Schemas should encode constraints aggressively.** Use `enum` for fields with a fixed set of values. Use `required` for parameters the tool cannot work without. Use `description` on every property — these descriptions are what the LLM reads when it needs to figure out what to put in a parameter. Date formats, units of measurement, ID formats — call them out explicitly.

**Validate in code, not just in schema.** Schema enforcement varies across agents, and you cannot rely on it. Re-check parameters at the start of your `execute` function and return clear, actionable error messages when something is wrong. Good error messages are not just for the user — the agent reads them and can self-correct on the next attempt.

**Update the UI before returning.** Agents often inspect the page after a tool call to verify it worked. If the DOM has not changed, the agent may assume the call failed and try again. Update state and re-render, then return.

**Accept raw user input where possible.** If the user says "11:00 to 15:00," accept those strings directly. Do not require the agent to convert them to minutes-from-midnight or some internal format — every translation is an opportunity for a mistake.

## Safety Patterns

WebMCP is built around the assumption that a human is watching. Three mechanisms help you enforce that.

The first is the **`agentInvoked` boolean** on the `SubmitEvent` interface. When an agent triggers a form submission, the property is true. When a person clicks Submit, it is false. Use it for rate limiting, audit logging, or branching response formats — for example, returning different error text to an agent than you would show to a human.

The second is the **`toolactivated` and `toolcancel` window events**, which fire when an agent invokes or cancels a tool. Both carry a `toolName` property. Use them to show a banner indicating the agent is working, log the activity, or pause unrelated UI animations while the agent has focus.

The third is the **CSS pseudo-classes `:tool-form-active` and `:tool-submit-active`**, which Chrome applies to the form an agent is currently filling and to its submit button. Style these so the user can see what is happening. A blue border and a subtle "AI agent is filling this form" label go a long way toward keeping the user oriented.

For destructive imperative tools — anything that deletes, charges, or sends — there is no submit button to gate execution. The pattern is to wrap the action in a Promise that resolves only after a confirmation modal returns. The agent expresses intent by calling the tool, and the human confirms execution by clicking the modal button. This keeps the human in the loop even when the technical mechanism is a function call rather than a form submission.

## Implementation Checklist

A practical order of operations when adding WebMCP to an existing application:

1. **Audit existing forms.** Search forms, filter UIs, and availability checkers are the safest starting points — read-only, low-stakes, easy wins.
2. **Add declarative attributes** to those forms first. Verify they appear in the Model Context Tool Inspector or TAMASH extension.
3. **Test manually with hand-crafted JSON parameters** in the inspector. If a tool fails here, the bug is in your `execute` function. If it works manually but fails when an agent calls it, the bug is in your description or schema.
4. **Test with natural language.** If the agent picks the wrong tool, your descriptions need to be more specific or your tool surface has too much overlap.
5. **Move to imperative tools** for workflows that need API calls, computed results, or auth-gated actions.
6. **Add code-level validation** to every imperative tool. Do not assume schema enforcement worked.
7. **Update the UI before `execute` returns.** Always.
8. **For destructive operations,** leave `toolautosubmit` off (declarative) or build a confirmation Promise (imperative).
9. **Style the active-tool pseudo-classes** so users can see when an agent is working.
10. **Plan for spec churn.** Pin yourself to a version of the documentation, watch the changelog, and keep your tool surface narrow enough to migrate quickly.

## Common Pitfalls

A few mistakes show up repeatedly in early WebMCP code.

**Forgetting that tools are ephemeral.** Tools registered on page load disappear when the user navigates away. If your single-page app uses a router, register tools per route and unregister them on navigation, or you will end up with stale tools that no longer match the visible UI.

**Conflating agent and human flows.** The same form handler runs for both. Use `agentInvoked` to branch where they should differ — for example, returning a structured JSON response to an agent versus showing a toast to a human.

**Writing tool descriptions for humans.** The audience for a tool description is an LLM, not a developer. Optimize for clarity and specificity, not brevity. A description that is too short forces the model to guess; a description that names the trigger conditions and the expected outcome eliminates the guesswork.

**Skipping the natural-language test.** Manual JSON execution proves the tool works. Natural-language testing proves the agent will actually find and use it correctly. Both are necessary.

**Treating WebMCP as production-ready.** It is not, yet. Use it for prototyping, internal tools, and preparing your team for the standard's eventual stable release. Ship cautiously and behind feature flags.
