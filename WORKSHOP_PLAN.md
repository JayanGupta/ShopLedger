# Legacy Codebase Workshop: execution and submission plan

## Target codebase

`ShopLedger` is a small Node.js/Express application for wholesale and retail billing, inventory, and a customer ledger. The source is organized into `routes/`, `lib/`, and `public/`, with JSON data in `data/db.json`. The exact workshop rubric and Google Form fields still need to be captured before finalizing deliverables.

## Approach

1. **Capture the rubric and submission schema**
   - Record every workshop task, required format, length limit, and scoring criterion.
   - Record every form field, required/optional status, and any URL or attachment expectations.
   - Do not submit until every required field is mapped to a reviewed artifact.
2. **Build a baseline map before changing code**
   - Trace the app entry point and route-to-library call paths.
   - Inventory domain modules and data shape; identify duplicated logic, implicit assumptions, and risky edge cases.
   - Run only the commands the workshop asks for; capture exact commands, output, and failures.
3. **Produce evidence-backed findings**
   - For each finding, record severity, file/line, concrete behavior, reproduction or code path, user/business impact, and a practical fix.
   - Separate verified facts from hypotheses; avoid claiming tests that were not run.
4. **Complete requested workshop deliverables**
   - Keep each response aligned to a rubric item and cite repository paths/lines.
   - Save the final answer for every item in the evidence log below and in a standalone submission draft.
5. **Review for completeness and submit**
   - Check every required form field against the rubric-to-artifact map.
   - Confirm word/character limits and links; preserve a copy of the exact submitted text and the confirmation page/receipt if available.
   - Form submission is an external action; wait for the user's explicit go-ahead after review.

## Deliverable and evidence tracker

| Rubric item | Required output / format | Evidence or artifact | Status |
|---|---|---|---|
| Workshop rubric not yet accessible | Capture exact task and criteria | Challenge site URL; request access or pasted prompt | Blocked on source text |
| Form fields not yet accessible | Capture labels, constraints, submission method | Google Form URL; request accessible form or pasted questions | Blocked on source text |
| Codebase baseline | Architecture and call-flow map | `ShopLedger/` source; to prepare after rubric is known | Not started |
| Findings / requested solution | One reviewed answer per rubric item | To be recorded in `WORKSHOP_SUBMISSION_DRAFT.md` | Not started |
| Submission record | Exact submitted values and receipt | To be recorded after authorized submission | Not started |

## Submission safeguards

- Preserve raw evidence and exact final answers in the workspace before filling the form.
- Use the form's field labels verbatim in the draft so transfer is mechanical.
- If a form field accepts only a URL or file, prepare and verify the target artifact first.
- Never imply a command, test, or behavior was verified unless it was actually observed.
- Keep the submitted copy unchanged after submission; note the submission time and confirmation identifier if one is provided.

## Access needed to finalize

The current network path returns HTTP 403 for the workshop page and HTTP 401 for the form. Paste the workshop instructions and form field labels here, or provide links accessible without that restriction. Then this plan can be mapped to the actual scoring rubric and submission schema.
