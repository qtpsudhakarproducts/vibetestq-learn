# Cucumber BDD with Playwright — Notes Series

## What This Series Covers

This series covers Behaviour Driven Development (BDD) using Cucumber and Playwright together.
You will learn what BDD is, how to write feature files, how to set up the project, how to
write step definitions progressively from basic to production level, how to manage state
with the World object, how to use hooks, and how to generate reports.

---

## Files in This Series

| # | File | Topic |
|---|---|---|
| 01 | `01_what_is_bdd.md` | What BDD is, Three Amigos, BDD as a communication tool |
| 02 | `02_gherkin_syntax.md` | Feature, Scenario, Given/When/Then, Background, tags, Scenario Outline |
| 03 | `03_project_setup.md` | Installing packages, folder structure, cucumber.json, VS Code extension |
| 04 | `04_step_definitions_level1_basic.md` | **Level 1** — Step definitions with no POM, no World |
| 05 | `05_world_object.md` | World object — what it is, how to create it, TypeScript typing |
| 06 | `06_step_definitions_level2_with_world.md` | **Level 2** — Step definitions with World, no POM |
| 07 | `07_step_definitions_level3_with_pom_and_world.md` | **Level 3** — Step definitions with POM and World (production pattern) |
| 08 | `08_step_definitions_reference.md` | Step definitions reference — parameter types, auto-generation, patterns |
| 09 | `09_hooks.md` | BeforeAll, Before, After, AfterAll, tagged hooks, screenshot on failure |
| 10 | `10_pom_integration.md` | Connecting BDD steps to Page Object Model classes |
| 11 | `11_tags_and_filtering.md` | Tagging scenarios and running subsets |
| 12 | `12_scenario_outline.md` | Data-driven BDD with Scenario Outline and Examples |
| 13 | `13_configuration_and_execution.md` | cucumber.json profiles, CLI commands, dry run, parallel, CI pipeline |
| 14 | `14_reports.md` | Generating and reading BDD HTML reports |
| 15 | `15_bdd_vs_playwright.md` | When to use BDD vs plain Playwright tests |
| 16 | `16_playwright_vs_cucumber_comparison.md` | Playwright Test vs Cucumber BDD — full side-by-side comparison tables |

---

## Reading Path

### Complete beginner — read in order from 01 to 16

### Already know BDD, new to Playwright integration
Start at `03_project_setup.md` → `04` → `05` → `06` → `07`

### Know Cucumber basics, want the production pattern
Go straight to `07_step_definitions_level3_with_pom_and_world.md`

### Want to understand how Playwright Test and Cucumber compare
Go to `16_playwright_vs_cucumber_comparison.md`

---

## Step Definitions — Progressive Learning Path

| Level | File | Prerequisite | What You Learn |
|---|---|---|---|
| Level 1 | `04_step_definitions_level1_basic.md` | Files 01–03 | Raw Playwright in steps, why module-level variables break |
| — | `05_world_object.md` | File 04 | What the World is and how to create it — read before Level 2 |
| Level 2 | `06_step_definitions_level2_with_world.md` | File 05 | World for state sharing, hooks for browser lifecycle |
| Level 3 | `07_step_definitions_level3_with_pom_and_world.md` | File 06 | POM classes, thin steps, production-ready pattern |

---

## Stack Used in This Series

- **Playwright** — browser automation and assertions
- **@cucumber/cucumber** — BDD test runner
- **ts-node** — runs TypeScript step definitions without compiling
- **TypeScript** — all examples are in TypeScript
- **OrangeHRM** — the demo application used in examples
