CONCEPTUAL SMOKE MODELS

Open the .mdlz files with File > Open. These are ordinary version-2 Modelizer
files, not imports or screenshots. Only conceptual visibility is enabled.
Enable notes, areas, annotations and composite aggregations when prompted or
through View settings. Display preferences belong to the application, not the
model file. Test with the operations compartment both on and off.

01-library-basics.mdlz
  4 classes / 3 connections. Establish a clean baseline: class titles,
  attributes, names, roles, multiplicities and horizontal/vertical routing.

02-dispatch-border-spacing.mdlz
  10 classes / 10 connections. DispatchCentre has neighbours on all four sides,
  including a parallel pair and classes with no attributes. Move the hub far
  right and back; move it vertically too. On a fixed border, connection order
  and separation should stay stable as distance changes. Move a neighbour past
  another and verify that the endpoint order follows their new positions.

03-university-enrolment.mdlz
  18 classes / 26 connections. Parallel enrolment links, four reflexive corners
  on Person, an association class, composition, three domains, notes and all
  four annotation shapes. Move Student/Course: the dashed association-class
  connector must meet the base line. Resize a reflexive loop and undo once.

04-commerce-operations.mdlz
  32 classes / 64 connections. Five parallel lanes including composition, eight reflexive loops,
  three association classes, manual routes, straight routes and overlapping
  areas. Check crowded borders, long paths through other domains, route edits,
  and selection/focus when switching between classes and associations.

05-global-platform-frontier.mdlz
  80 classes / 312 connections / 16 notes / 9 areas / 38 annotations.
  A deliberately difficult END-GOAL fixture, not a current visual pass.

  Six domains, high-degree hubs, large parallel groups, long names and roles,
  minimum-height and attribute-heavy classes, all four reflexive corners,
  nested loops, compositions, association classes attached to ordinary and
  reflexive associations, straight/manual/orthogonal mixtures, negative
  coordinates, overlapping areas, pale marks, pen/marker strokes, text boxes,
  Unicode, arrows, lines, rectangles and ellipses.

  Person intentionally has EIGHT reflexive associations, exceeding the current
  four-loop creation limit. The v2 loader retains them. This fixture must not
  be simplified merely to make the current renderer look successful.

  Inspect Identity's Person/Organisation group, Commerce's Customer/Reservation
  group, Finance's Invoice/Payment group, and the central cross-domain audit
  corridor first. The local notes and annotations identify review targets.
  The whole diagram is large: fit view is for navigation; judge text at a useful
  local zoom (for example 100%). Requiring every label to be readable on one
  fitted laptop screen is not the acceptance criterion.

REPEATABLE PASS

1. Open each file. Check that the class/edge/annotation counts match manifest.json
   and that opening alone does not mark it dirty. No missing-edge errors.
2. Pan/zoom and use keyboard focus. At 100%, inspect complete association names,
   both roles and both multiplicities, not just the lines. Try light and dark.
3. Drag classes farther apart while keeping the attachment side unchanged.
   Check stable endpoint ordering and spacing on all four borders. Add/remove
   attributes, then undo; endpoints must stay on the current class boundary.
4. Select an association, edit a manual route, resize a loop and undo each
   completed gesture once. Dashed attachment points must follow their base path.
5. Toggle notes/areas/annotations and composite aggregation visibility. Content
   must return intact. Annotations must align during zoom and pan.
6. Edit text and erase a pen stroke; undo. Use the laser, save and reopen: laser
   trails must never persist. No laser data is deliberately stored in fixtures.
7. Export PNG at both resolutions with notes, areas and annotations included,
   even after hiding them on the canvas. Inspect negative-coordinate content,
   outer labels, arrowheads, pale marks, text boxes and image pixel dimensions.
8. Save As a working copy outside examples/, reopen it and compare content.
   Keep these generated baselines unchanged for repeatable comparisons.

END-GOAL READABILITY

Every class remains identifiable; every connection can be traced unambiguously;
names, roles and multiplicities retain their complete text; dashed links meet
their base association; loops and compositions remain understandable; notes,
areas and annotations help orientation. Do not count truncation, tiny text,
hidden labels, dropped edges or deletion of difficult content as a pass.

Examples 01-04 are progressively harder regression cases. Record failures in 05
as concrete future layout goals, with the class/edge IDs and a screenshot.
Automated loading/geometry checks do not establish visual readability.

REMAINING REVIEW AND DEFERRED IDEAS

Browser and PNG comparisons for the latest UI/routing changes remain outstanding
because browser automation was unavailable. Native PNG download completion and
full-app file-picker interaction also remain unverified; automated loading,
saving and geometry tests do not replace those checks. Before release, exercise
keyboard, pointer, touch, area resizing, control points and annotation tools in
all three views and both themes.

Fainter grid dots and lighter class borders/shadows were discussed and deferred;
they are not approved changes. Preserve the optional empty operations compartment.
Reflexive loops do not automatically avoid neighbouring labels or nodes; long
roles/names and crowded borders can still require manual placement or loop resizing.
The extreme fixture above records the readability goal, not a completed result.

REGENERATION

From the repository root: node examples/generate.mjs
This deterministically rewrites these five fixtures and manifest.json. No random
IDs, timestamps, external services or dependencies beyond the application are
used. Future edits should update the generator and regenerate the fixtures.
