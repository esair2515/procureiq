# ProcureIQ

ProcureIQ is a local-first procurement intelligence demo for industrial sourcing and operations teams. It helps a sourcing team inspect purchasing spend, compare supplier records, test allocation scenarios, and explain sourcing decisions. It includes a fully synthetic portfolio dataset and a worked industrial case study. It does not use paid APIs or claim synthetic savings were achieved.

## Business problem

Unit price alone can misstate the cost of an industrial purchase. Freight, incoming defects, and schedule disruption can materially change the sourcing decision. ProcureIQ's case study compares three illustrative supplier alternatives for 500 wind turbine control modules and exposes each input and cost component behind its recommendation.

The **Executive summary** recommends the option with the lowest calculated expected total cost of ownership (TCO). The **Case study** page shows the business problem, supplier alternatives, scenario inputs, comparison, assumptions, and limitations. In this synthetic example, Kinetic Drive Solutions ranks first at a modeled $90,582, versus $99,146 for the Northstar baseline. The $8,565 difference is a scenario estimate only; no purchase was made and no savings were realized.

## Methodology

For quantity `Q`, unit price `P`, freight `F`, defect rate `d`, delay probability `r`, expected delay days `D`, and delay impact per day `C`:

```text
purchase and freight cost = Q × P + F
expected defect cost      = Q × d × P
expected delay cost       = r × D × C
TCO                       = purchase and freight + expected defect cost + expected delay cost
```

Rates are decimal inputs (0.02 means 2%). The model rounds displayed component totals to cents. Supplier alternatives sort by unrounded calculated total and ties preserve input order. The calculation is deterministic and implemented in `src/logic.ts`; the assumptions and synthetic case inputs are in `src/caseStudy.ts`.

## Case assumptions and limitations

- Every case quote and risk value is synthetic. Supplier names are demo records; the case values are not real quotations or measured vendor performance.
- Quantity is 500 control modules. Each option uses its own illustrative unit price, one-time freight amount, defect rate, delay probability, and expected delay duration.
- Each defective unit is assumed to consume one additional unit at the quoted purchase price. This does not model return freight, warranty recovery, inspection labor, or production rework.
- Delay cost is probability-weighted: delay probability × expected delay days × $3,500 per day. This is an illustrative business impact assumption, not a finance-approved estimate.
- The model excludes taxes, duties, payment terms, inventory carrying cost, quote validity, capacity constraints, price breaks, multi-sourcing, and interactions between defects and delays.
- Treat the recommendation as a demonstration of method. Validate current quotes, inspection records, delivery history, supplier capacity, and the cost of schedule disruption before using the method in a live award decision.

## Application features

- **Overview and spend analytics:** procurement spend, supplier coverage, on-time history, lead-time reference averages, category charts, date filters, and purchasing records.
- **Supplier directory and recommendations:** searchable supplier records and adjustable within-category score weights for price, shipping, lead time, quality, and reliability. This score is a relative sourcing aid and is separate from the case-study TCO calculation.
- **Scenario planner:** allocation sliders estimate landed purchase spend and delivery metrics from the displayed records and supplier reference values. Its savings are modeled opportunities, not actual outcomes.
- **Executive summary and case study:** recommendation, cost components, risk inputs, alternatives, assumptions, and limitations, all from the same deterministic TCO calculation.
- **Insights:** plain-English observations are generated from local data and formulas; no LLM supplies or invents figures.
- **Imports and exports:** validated CSV/Excel purchase and supplier import; CSV and PDF report export.
- **Company workspaces:** create and switch between named company workspaces (for example, a business unit or operating company) from the workspace button at the top of the sidebar. Every workspace has its own supplier and purchase records. New workspaces start empty; import supplier records first, then import purchases that refer to those supplier IDs. The original Northstar Manufacturing workspace remains the clearly labeled synthetic demo.

## Synthetic demo data

The base portfolio has 18 synthetic supplier records and 144 generated purchase records with industrial equipment, electrical, mechanical, fastener, and renewable energy examples. Dates cover November 2025 through October 2026. Values are representative examples created for this portfolio project and are not customer data, quotations, or real supplier performance. Data and workspace names stay in that browser's local storage; there is no account, server-side database, or sharing across browsers. **Restore synthetic demo** resets the Northstar demo records. The Executive summary and Case study remain fixed synthetic examples and show a notice when viewed from another workspace.

### Using a company workspace

1. Open the workspace switcher above the sidebar navigation and create a workspace using the company or business unit name you want to demonstrate.
2. Select **Import data** and import the company’s supplier CSV/Excel file. Supplier IDs must be unique within that workspace.
3. Import its purchase records, using the same `supplierId` values and matching category names.
4. Review the dashboard, analytics, supplier rankings, and scenario planner. These calculations then use the active workspace's records.

The public portfolio site is a browser-only demonstration. Do not upload confidential company, employee, pricing, or other restricted procurement data: anyone using the public site has a separate local browser store, and the app has no authentication, access controls, or enterprise data protections. Use synthetic or approved non-sensitive records only. A shared enterprise deployment would require authenticated access, server-side storage, and a security review.

## Run locally

Requirements: Node.js 20.19+ or 22.12+, npm, and network access for the initial package installation.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. No login, backend, API key, or paid service is required.

## Import formats

Use **Import data** in the header. CSV, `.xlsx`, and `.xls` are supported; Excel imports use the first worksheet. Column capitalization, spaces, underscores, and hyphens are ignored.

Supplier required columns: `name`, `category`, `price`, `shipping`, `leadDays`, `quality`, `reliability`. Optional: `id`, `code`, `location`, `certification`, `status`.

Purchase required columns: `date`, `supplierId`, `category`, `item`, `quantity`, `unitPrice`, `shipping`. Optional: `id`, `region`, `onTime`, `qualityScore`. Blank `onTime` values are excluded from the on-time denominator. Blank quality scores use the linked supplier's reference value. Supplier IDs must match an available supplier. Invalid rows are skipped with row-level validation messages. CSV templates are available in the import dialog.

## Run tests and production build

```bash
npm test
npm run build
npm run preview
```

Vitest covers spend, supplier scoring, scenario allocation, data validation, TCO components, invalid input boundaries, deterministic ranking, and the case-study recommendation.
