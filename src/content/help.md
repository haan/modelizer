Modelizer is a lightweight database modeling tool for teaching conceptual, logical, and physical modeling.
It is intentionally **not** a smart assistant:
- it does **not validate** your model
- it does **not auto-correct** modeling choices
- it does **not auto-generate** relationships from associations

## Recommended workflow

1. Create a model (`File > New`).
2. Add classes and attributes in **Classes**.
3. Build associations in **Conceptual** view.
4. Build attribute relationships in **Logical** or **Physical** view.
5. Save as `.mdlz`.
6. Export current view as PNG when needed.

## Interface overview

### Top menu
- **File**: New, Open, Save, Save As, Import (Java Modelizer / MySQL), Export as PNG.
- **Settings**: toggle composition, confirmation dialogs, PNG accent colors, Notes, Areas.
- **View**: background, accent colors, fullscreen, view-specific settings toggle, constraint display mode.
- **Help**: opens this dialog plus the About tab.

### Left sidebar
- Quick actions: New, Open, Save, Export.
- Panels: Classes, Refs, optional Notes, optional Areas.
- Views: Conceptual, Logical, Physical.
- Sync button: copy positions from previous modeling phase (disabled in conceptual view).

## Views

### Conceptual
- Shows classes and associations.
- Relationships are hidden.
- Attribute handles are hidden.

### Logical
- Shows classes and relationships.
- Associations are hidden.
- Attribute handles are visible.

### Physical
- Shows classes and relationships with full attribute details.
- Default values overlay appears when at least one attribute has a default value.

## Classes and attributes

### Classes
- Add class from **Classes > Add class**.
- Class is auto-selected when created.
- Class names are generated as `Class1`, `Class2`, ... (counting classes only).
- You can reorder, rename, focus, recolor, set visibility, and delete classes.
- `Ctrl+Alt+C` (`Ctrl+Opt+C` on macOS): add class.

### Attributes
- Add attribute from class header button.
- `Ctrl+Alt+A` (`Ctrl+Opt+A` on macOS): add attribute to currently selected class.
- Attribute editor supports:
  - name
  - visibility (Conceptual, Logical/Physical)
  - logical name
  - constraints: N, UQ, AI
  - type + parameters (`varchar`, `decimal`, `enum`, etc.)
  - default value
  - delete

### Constraint display mode (View menu)
- **Show Null**: nullable attributes show `N`.
- **Show Not Null** (default): non-nullable attributes show `NN`.
- **Show Null as ?**: nullable attributes append `?` to type (physical class view).

In physical class rendering, attributes with a default value are marked with `*` after the name.

## Associations and relationships

### Associations (Conceptual view)
Create associations by connecting class handles.

Supported:
- association
- reflexive association (max 2 per class)
- associative association (class connected to an association)
- composition (when enabled in Settings)

Association and composition edges support these styles in **Refs > Style**:
- **Straight**: direct line between endpoints.
- **Orthogonal**: auto-routed right-angle line.
- **Manual**: user-routed polyline with rounded bends and endpoint stubs.

Manual routing interactions:
- Double-click an edge segment: add a handle.
- Drag a handle: move that routing point.
- `Alt + click` a handle (`Option + click` on macOS): remove it.

Reflexive associations can be resized when selected:
- horizontal handle: adjusts loop width
- vertical handle: adjusts loop height

### Composition
- Enable via `Settings > Enable composite aggregation`.
- Created by toggling **Composite aggregation** in an association item in Refs.
- Uses association data (name, multiplicities, roles) and keeps it when toggled.
- Hidden from conceptual canvas when composition setting is disabled.

### Relationships (Logical/Physical views)
- Create relationships by connecting attribute handles.
- Duplicate relationships between the same two attributes are blocked (direction ignored).
- While moving classes in logical/physical, relationship handles auto-switch sides to keep routing coherent.

## Notes and Areas

### Notes
- Disabled by default (`Settings > Enable notes`).
- Notes panel allows add, rename, focus, visibility per view group, text editing, delete.
- Notes are draggable on the canvas.
- Positions are stored per view and synchronized to later views until manually moved there.

### Areas
- Disabled by default (`Settings > Enable areas`).
- Areas are colored, resizable regions for visual grouping.
- Areas panel allows add, rename, focus, color, visibility per view group, delete.
- Areas render behind classes/edges and above the background.
- Position **and size** are stored per view and synchronized similarly to classes/notes.

## Import, save, and export

### Open / Save / Save As (`.mdlz`)
- Models are local files.
- No server-side storage.
- Creating a new model resets to conceptual view and resets the viewport.
- Opening or importing a model switches to conceptual view and runs fit view.

### Import
- **Java Modelizer** (`.mod`)
- **MySQL** (`.sql`)

Import behavior:
- unmatched attribute types are mapped to **Undefined** (`type: ''`) and reported in a warning dialog
- if imported file contains Notes, Areas, or Composite aggregations that are currently disabled, a warning toast is shown

MySQL importer notes:
- focused on MySQL DDL parsing
- foreign keys are imported as relationships
- composite foreign keys are ignored

### Export as PNG
- Exports current viewport content.
- Respects current view and visibility.
- Default Values overlay is included when visible.
- Accent bars can be included/excluded via Settings.

## View options

- **Show/Hide background**
- **Show/Hide accent colors**
- **Show/Hide fullscreen**: hides sidebar and info panel.
- **Show only view-specific settings / Show all the settings**:
  - limits attribute editor fields to view-relevant controls when enabled

## Shortcuts

- New model: `Ctrl/Cmd + N`
- Open model: `Ctrl/Cmd + O`
- Save model: `Ctrl/Cmd + S`
- Add class: `Ctrl+Alt+C` / `Ctrl+Opt+C`
- Add attribute to selected class: `Ctrl+Alt+A` / `Ctrl+Opt+A`
- Delete selection: `Delete` / `Backspace`

## Unsaved changes and persistence

- Dirty state is indicated with `*` next to model name.
- Browser unload warning appears if there are unsaved changes.
- UI preferences are stored in `localStorage`:
  - background
  - accent colors
  - constraint display mode
  - confirmation dialogs
  - PNG accent export
  - view-specific settings toggle
  - fullscreen
  - composition enabled
  - notes enabled
  - areas enabled

## Current defaults

- View: conceptual
- Constraint display: Show Not Null
- Confirmation dialogs: enabled
- Include accent colors in PNG export: enabled
- Composite aggregation: disabled
- Notes: disabled
- Areas: disabled

## Limitations

- No automated correctness checks.
- No automatic conversion from associations to relationships.
- Export format is PNG only.
