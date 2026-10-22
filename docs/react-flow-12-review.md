# React Flow 12 migration review

The migration is implemented on `chore/react-flow-12`, based on `main` at
`9de921a`. React Flow 11.11.4 is replaced by `@xyflow/react` 12.12.0. React,
Node, build tooling, and model-file format version 2 remain unchanged. Version 1
models remain supported. Merging and releasing are separate steps.

After switching branches, run `npm install` and restart the development server
so the installed dependencies match the branch.

## Implementation and follow-up fixes

- Migrate imports, styles, chunking, internal-node geometry, and viewport APIs.
- Keep runtime measurements out of serialization, dirty tracking, and undo.
  Preserve explicit area dimensions and gesture-level resize history.
- Wait for export node measurements and asynchronous viewport changes; support
  annotation-only exports without waiting for nonexistent nodes.
- Preserve the fixed measurements of derived association helpers so associative
  links remain visible after updates and view changes.
- Make sidebar focus exclusive across nodes and edges in all views, and add
  focus-button tooltips with keyboard visibility.
- Render composition diamonds in the edge SVG without clipped tips. Composite
  the line and diamond before applying opacity to prevent overlap artifacts.

## Validation on 22 October 2026

- `npm run lint`: passed.
- `npm run test:unit`: 541 tests passed in 35 files. The original 514 tests remain.
- `npm run build:ci`: passed. The existing MySQL parser chunk-size warning remains.
- The initial migration comparison against `main`, recorded in commit `f88f7bc`,
  covered a 20-class diagram, light/dark rendering, all three views, matching
  conceptual PNG preview dimensions, pen undo/redo, and an annotation-only preview.
- Follow-up browser checks confirmed solid composition diamonds with matching
  line colors in light and dark themes.
- A temporary browser fixture using the actual model-state hook, node/edge
  components, and PNG exporter confirmed the reported associative link renders.
  Real generated PNG bytes were saved locally and visually inspected:
  conceptual and logical output at 1919 × 1185, physical output at 1919 × 1275,
  and annotation-only output at 1734 × 1185. These fixtures included negative
  coordinates, text, shapes, ink, and notes/areas omitted from the live canvas.
  Content remained unclipped, and the physical default-values footer was visible.
  Dark-mode export retained light export styling and annotation colors.
- Personal model files and local review images are not part of the commits.

## Outstanding manual review

Browser download-event automation timed out, so completion of a native PNG
download through the production dialog remains unverified. The PNG rendering
itself was verified independently from its generated image bytes.

Exhaustive keyboard, pointer, touch, area-resize, relationship-control-point,
and annotation-tool checks across all views and themes remain a release review
task. Automated regressions cover these areas in part; they do not establish
complete visual or interaction parity. Browser file-picker automation also
failed for the supplied model; file parsing/opening has automated coverage,
and the model rendered through the local review fixture.

## Deferred class panel layout

Discussed with the user and explicitly deferred until after the migration:

- Align attribute fields using consistent label and input columns.
- Clarify N/UQ/AI controls, their selected states, and explanatory tooltips.
- Reduce uppercase label noise and excessive vertical spacing.
- Move the class color control into the header instead of a separate Options section.
- Consider compact, accessible delete actions in class and attribute headers,
  retaining class deletion confirmation.
- Add muted type/key summaries to collapsed attributes.
- Keep the colored class stripe, expandable attributes, and Add attribute placement.

Start with alignment, spacing, and the color control. These are recorded design
ideas, not changes included in this migration.
