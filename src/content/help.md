Modelizer is a lightweight database modeling tool for teaching conceptual, logical, and physical modeling.
It is intentionally **not** a smart assistant:
- it does **not validate** your model
- it does **not auto-correct** modeling choices
- it does **not auto-generate** relationships from associations

## Recommended workflow

1. Create a model (`File > New`).
2. Add classes and attributes in the **Classes** panel.
3. Build associations in **Conceptual** view.
4. Build attribute relationships in **Logical** or **Physical** view.
5. Save as `.mdlz`.
6. Export the current view as PNG when needed.

## Interface overview

### Top menu
- **File**: New, Open, Save, Save As, Import (Java Modelizer / MySQL), Export as PNG.
- **Edit**: Undo and Redo recorded modeling changes.
- **Settings**: toggle composite aggregation, conceptual operations compartment, confirmation dialogs, PNG accent colors, Notes, Areas, and Annotations.
- **View**: background, accent colors, fullscreen, view-specific settings toggle, constraint display mode.
- **Help**: opens this dialog plus the About tab.

### Header
- The model name appears in the center of the header.
- Hover the model name and use the edit button to rename it.
- A `*` next to the model name means there are unsaved changes.

### Left sidebar
- Quick actions: New, Open, Save, Export.
- Panels: Classes/Tables, Refs, optional Notes, optional Areas.
- Views: Conceptual, Logical, Physical.
- Sync button: copy positions and area sizes from the previous modeling phase (disabled in conceptual view).

### Information panel
- The information panel shows the active sidebar panel.
- Drag the panel's right edge to resize it.
- Focus buttons in list items center the corresponding class, association, relationship, note, or area on the canvas.

## Views

### Conceptual
- Shows classes and associations.
- Relationships are hidden.
- Attribute handles are hidden.
- Optional operations compartment can be shown with `Settings > Enable operations compartment`.

### Logical
- Shows tables and relationships.
- Associations are hidden.
- Attribute handles are visible.
- Attribute logical names are used when present.

### Physical
- Shows tables and relationships with full column type and constraint details.
- Attribute logical names are used when present.
- Default values overlay appears when at least one visible attribute has a default value.

## Classes, tables, attributes, and columns

### Classes and tables
- Add from **Classes > Add class** in conceptual view, or **Tables > Add table** in logical/physical views.
- New classes are auto-selected and opened for editing.
- Names are generated as `Class1`, `Class2`, ... (counting classes only).
- You can reorder, rename, focus, recolor, set per-view visibility, and delete classes/tables.
- `Ctrl+Alt+C` (`Ctrl+Opt+C` on macOS): add class/table.

### Attributes and columns
- Add from the class/table header button.
- New attributes are opened for editing.
- `Ctrl+Alt+A` (`Ctrl+Opt+A` on macOS): add attribute/column to the currently selected class/table.
- You can reorder attributes/columns by dragging their handles.
- Attribute editor supports:
  - name
  - per-view visibility (Conceptual, Logical/Physical)
  - logical name
  - constraints: N, UQ, AI
  - type + parameters (`varchar`, `decimal`, `enum`, etc.)
  - default value
  - delete

### View-specific settings
- Enable with `View > Show only view-specific settings`.
- In conceptual view, logical name and physical-only fields are hidden.
- In logical view, physical-only fields are hidden.
- In physical view, all attribute/column settings are shown.

### Constraint display mode
- `View > Constraints > Show Null`: nullable attributes show `N`.
- `View > Constraints > Show Not Null` (default): non-nullable attributes show `NN`.
- `View > Constraints > Show Null as ?`: nullable attributes append `?` to type in physical class/table rendering.

In physical class/table rendering, attributes with a default value are marked with `*` after the name.

## Associations and relationships

### Associations (Conceptual view)
Create associations by connecting class handles.

Supported:
- association
- reflexive association (up to 4 per class)
- associative association (class connected to an association)
- composition (when enabled in Settings)

Association details in **Refs** support:
- name
- multiplicity at each end
- role at each end
- comment
- focus and delete

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
- Uses association data (name, multiplicities, roles, comments) and keeps it when toggled.
- Hidden from conceptual canvas and Refs when composition setting is disabled.
- Reflexive associations cannot be toggled to composition.

### Relationships (Logical/Physical views)
- Create relationships by connecting attribute/column handles.
- Duplicate relationships between the same two attributes are blocked (direction ignored).
- While moving classes/tables in logical/physical, relationship handles auto-switch sides to keep routing coherent.
- Relationship details in **Refs** show source/target tables and columns, style, focus, and delete.
- Relationship edges support these styles in **Refs > Style**:
  - **Straight**: direct line between endpoints.
  - **Orthogonal**: auto-routed right-angle line.
  - **Manual**: user-routed polyline with rounded bends and direct endpoint segments (no stubs).
- Manual routing interactions:
  - Double-click an edge segment: add a handle.
  - Drag a handle: move that routing point.
  - `Alt + click` a handle (`Option + click` on macOS): remove it.

## Notes, Areas, and Annotations

### Notes
- Disabled by default (`Settings > Enable notes`).
- Notes panel allows add, rename, focus, visibility per view group, text editing, and delete.
- Notes are draggable on the canvas.
- Positions are stored per view and synchronized to later views until manually moved there.

### Areas
- Disabled by default (`Settings > Enable areas`).
- Areas are colored, resizable regions for visual grouping.
- Areas panel allows add, rename, focus, color, visibility per view group, and delete.
- Areas render behind classes/edges and above the background.
- Position and size are stored per view and synchronized similarly to classes/notes.

### Annotations
- Disabled by default (`Settings > Enable annotations`).
- Annotations are stored separately for conceptual, logical, and physical views.
- Tools: pointer, pen, marker, text, eraser, clear current view.
- Pen and marker support color and thickness; marker also supports opacity.
- Text supports color, font size, selection, drag repositioning, double-click editing, and delete.
- Eraser supports whole-stroke and partial erase modes.
- Hold `Space` while an annotation tool is active to temporarily pan the diagram.
- Annotation tool settings are stored in `localStorage`.

## Import, save, and export

### Open / Save / Save As (`.mdlz`)
- Models are local files.
- No server-side storage.
- `.mdlz` saves model name, classes/tables, attributes/columns, associations, relationships, notes, areas, and annotations.
- Creating a new model resets to conceptual view and resets the viewport.
- Opening or importing a model switches to conceptual view and runs fit view.

### Import
- **Java Modelizer** (`.mod`)
- **MySQL** (`.sql`)

Import behavior:
- unmatched attribute types are mapped to **Undefined** (`type: ''`) and reported in a warning dialog
- if imported/opened content contains Notes, Areas, Composite aggregations, or Annotations that are currently disabled, a warning toast is shown

Java Modelizer importer notes:
- imports tables/classes, fields/attributes, positions, visibility, associations, associative associations, reflexive associations, and relationships where they can be matched
- scales and shifts imported positions into the Modelizer canvas
- ignores unsupported or incomplete links

MySQL importer notes:
- focused on MySQL DDL parsing
- imports tables, columns, common data types, defaults, nullability, unique/primary key markers, and auto-increment
- foreign keys are imported as relationships
- composite foreign keys are ignored

### Export as PNG
- Exports the full active view with a white background.
- Respects current view and visibility.
- Includes visible annotations when annotations are enabled.
- Includes the Default Values overlay when visible.
- Excludes React Flow controls, annotation toolbox, app toasts, and canvas background grid.
- Accent bars can be included/excluded via Settings.
- Export filename uses the model name and active view.

## View options

- **Show/Hide background**
- **Show/Hide accent colors**
- **Show/Hide fullscreen**: hides sidebar and information panel.
- **Show only view-specific settings / Show all the settings**
- **Constraints**: choose how nullable and non-nullable attributes are displayed.

## Shortcuts

- New model: `Ctrl/Cmd + N`
- Open model: `Ctrl/Cmd + O`
- Save model: `Ctrl/Cmd + S`
- Undo: `Ctrl/Cmd + Z`
- Redo: `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z`
- Add class/table: `Ctrl+Alt+C` / `Ctrl+Opt+C`
- Add attribute/column to selected class/table: `Ctrl+Alt+A` / `Ctrl+Opt+A`
- Delete selection: `Delete` / `Backspace`
- Annotation tools when annotations are enabled: `V` pointer, `P` pen, `M` marker, `T` text, `E` eraser
- Text annotation selected: `Enter` edits selected text, `Delete` / `Backspace` deletes it
- Text annotation editor: `Enter` commits, `Shift+Enter` inserts a newline, `Esc` cancels
- Annotation mode: `Esc` clears active annotation text selection/editing first, then returns to pointer
- Annotation mode: hold `Space` and drag to temporarily pan the diagram

## Unsaved changes and persistence

- Dirty state is indicated with `*` next to model name.
- Browser unload warning appears if there are unsaved changes.
- UI preferences are stored in `localStorage`:
  - background
  - accent colors
  - operations compartment
  - constraint display mode
  - confirmation dialogs
  - PNG accent export
  - view-specific settings toggle
  - fullscreen
  - composition enabled
  - notes enabled
  - areas enabled
  - annotations enabled
  - annotation tool settings

## Current defaults

- View: conceptual
- Background: enabled
- Accent colors: enabled
- Conceptual operations compartment: disabled
- Constraint display: Show Not Null
- Confirmation dialogs: enabled
- Include accent colors in PNG export: enabled
- View-specific settings only: disabled
- Fullscreen: disabled
- Composite aggregation: disabled
- Notes: disabled
- Areas: disabled
- Annotations: disabled

## Limitations

- No automated correctness checks.
- No automatic conversion from associations to relationships.
- Export format is PNG only.
- MySQL import ignores composite foreign keys.
