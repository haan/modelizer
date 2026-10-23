## Your first model

Start with a small example: a library with a **Reader** and a **Loan**. Build the conceptual model first, then add the details needed for the logical and physical views.

1. Choose **File → New**. Use the pencil beside the model name in the top bar to give your model a name.
2. In **Classes**, choose **Add class**, enter `Reader`, and confirm the name. Add a second class called `Loan`.
3. Expand Reader in the panel and choose **Add attribute**. Add `name` and `email`. Give Loan the attributes `borrowedAt` and `dueAt`.
4. Drag the classes apart on the canvas. Connect a handle on Reader to a handle on Loan to create an association.
5. Open **Relations**, rename the association to `borrows`, and set the roles and multiplicities at each end.
6. Choose **File → Save** to keep an editable `.mdlz` file. Use **Export PNG** when you need an image for a lesson or document.

> Modelizer leaves modeling decisions to you. It does not check whether a model is correct or automatically turn associations into relationships.

### Find your way around

Use the left sidebar to switch between **Classes / Tables**, **Relations**, and the three modeling views. Expand an item in a panel to edit its details. Its focus button brings it into view on the canvas.

The top menus separate **View** (what the diagram shows) from **Preferences** (how the editor behaves). Drag the information panel’s right edge if you need more room for names or forms.

## Edit classes and attributes

### Add and name an element

Choose **Add class** in conceptual view or **Add table** in logical or physical view. The new item opens for naming. Expand it to add attributes or columns; expand an attribute to edit its details.

The name is used in conceptual view. A separate **Logical name**, when filled in, is used in logical and physical views. Leaving it blank keeps the original name.

### Set types and constraints

In an attribute’s details, choose its **Type**, then fill in the parameters that appear, such as a maximum length or decimal precision. Set nullability, uniqueness, auto-increment, and a default value where needed.

Use **Preferences → Only show fields for current view** to simplify the forms. Conceptual view then hides logical names and physical details; physical view shows all fields.

### Organize the panel

Drag the grip beside a class or attribute to reorder it. Use the pencil to rename a class, the color swatch to choose its accent, and the trash button to remove it. Actions appear on hover or keyboard focus and remain visible while the item is expanded. The color swatch is available when **View → Accent colors** is enabled.

The **Visibility** checkboxes decide whether an element belongs in the conceptual view, the logical/physical views, or both. Hiding an element keeps it in the model.

## Connect classes and tables

### Create a conceptual association

1. Switch to **Conceptual** in the sidebar.
2. Drag from a class handle to a handle on another class.
3. Open **Relations** and expand the new association.
4. Give it a name and set each endpoint’s **Multiplicity** and **Role**. Use the class names in the form to identify the two ends.

Associations have no direction. Multiple associations can connect the same pair of classes.

### Connect a class to itself

Connect two handles on the same class to create a reflexive association. Set its two roles and multiplicities in Relations. Select the loop on the canvas and drag its handles to adjust its width and height. A class can have up to four reflexive associations.

### Attach an association class

Connect a class to the handle on an existing association. This creates the dashed associative connection. Its rename button is disabled: associative connections cannot be renamed independently.

### Use composite aggregation

Enable **Preferences → Enable composite aggregation**, then expand an ordinary association in Relations and select **Composite aggregation**. Its name, roles, multiplicities, and comment are kept.

This preference enables creation as well as display. Disabling it hides existing composite aggregations without deleting them. Reflexive associations cannot be changed into compositions.

### Create a logical or physical relationship

Switch to **Logical** or **Physical** and connect an attribute/column handle to another attribute/column handle. Relationships are directional: the **Relations** panel shows the source and destination tables and columns with an arrow.

Associations are not converted automatically. Create the relationships your model needs. A second relationship between the same two attributes is blocked, even in the opposite direction.

## Work across the three views

The three views show different aspects of the same model. Use the sidebar to move between them.

| View | What you work with |
| --- | --- |
| **Conceptual** | Classes, attributes, and associations. Focus on the domain and its meaning. |
| **Logical** | Tables and attribute relationships. Logical names are used when present. |
| **Physical** | Tables and relationships with column types, constraints, and default values. |

### Carry a layout forward

Arrange the conceptual model first. In logical view, use **Sync** to copy positions and area sizes from conceptual view. In physical view, Sync copies them from logical view. Sync is unavailable in conceptual view because there is no previous phase.

Layouts can differ between views. Use Sync when you want to copy the previous phase’s arrangement again.

### Choose the notation

Use **View → Operations compartment** to show or hide the empty UML operations compartment beneath class attributes.

Use **View → Nullability notation** to choose how nullability is shown: **Null** marks nullable attributes with `N`; **Not Null** marks required attributes with `NN`; **Null as ?** appends `?` to nullable types in physical view.

In physical view, a `*` after an attribute name marks a default value. The values appear below the diagram.

## Make the diagram readable

### Start with placement

Drag classes and tables to give their connections room. Leave extra space for long association names, roles, and multiplicities. Use a panel item’s focus button to find an element in a large model.

For a classroom discussion, **View → Fullscreen** hides the sidebar and information panel. Background grid and accent colors can also be toggled in View. **Preferences → Dark mode** changes the editor’s appearance; PNG exports use light styling.

### Choose a line style

Expand an association or relationship in **Relations** and choose **Line style**:

- **Orthogonal** routes the line with right-angle bends and is a useful starting point.
- **Straight** connects the endpoints directly.
- **Manual** lets you place the bends yourself.

For a manual line, double-click a segment to add a routing handle, then drag it into place. **Alt + click** a handle to remove it (**Option + click** on macOS).

### Untangle crowded connections

For parallel associations, try orthogonal routing first and leave room between the classes for labels. Move the classes or use manual routing if several labels compete for the same space. Selected reflexive loops have their own width and height handles.

Modelizer does not guarantee that every label avoids every other element. Very dense models may need wider spacing, a different line style, or a layout tailored to the view.

## Add notes and drawings

### Leave an explanation in the model

Enable **View → Notes**, then use the **Notes** panel to add a note and edit its text. Drag the note into place. Its visibility settings let you choose the views in which it appears.

### Group related elements

Enable **View → Areas**, then add an area from the **Areas** panel. Give it a name and color, and move or resize it on the canvas to surround a group. Areas sit behind the model; their position and size can differ between views.

### Draw during a discussion

1. Enable **View → Annotations** to show the drawing toolbar.
2. Choose **Pen**, **Marker**, or **Text**, or open **Shapes** for arrows, lines, rectangles, and ellipses.
3. Use the color swatch beneath the tools to adjust color, stroke width, and other settings.
4. Return to **Pointer** to interact with the model. Hold **Space** and drag to pan temporarily while using a drawing tool.

Hold **Shift** while drawing a shape to constrain its angle or proportions, or while using Marker for a straight highlight. Annotations belong to the current view and are saved with the model.

### Edit or remove a mark

Choose **Select annotation**, then select a mark to move, resize, recolor, duplicate, or delete it. Drag a line or arrow’s endpoints independently. Double-click a text annotation to edit it; its side handles adjust wrapping width.

The ink eraser affects only pen and marker strokes. Select text and shapes to delete them. **More annotation actions → Clear current view** removes the current view’s annotations after confirmation and can be undone.

Use **Hide annotations** to conceal marks temporarily. The laser pointer is useful for pointing things out: its trail fades and is never saved or exported.

## Save, import and export

### Keep an editable copy

Choose **File → Save** to save a `.mdlz` file containing the model, its layouts, notes, areas, and annotations. **Save As** creates another copy. The `*` beside the model name means there are unsaved changes.

Models are local files; there is no server-side model storage. Save before closing the browser. Editor preferences are remembered in this browser separately from your model.

### Open a model

Choose **File → Open**, or drop one `.mdlz` file onto Modelizer. Opening a file switches to conceptual view and fits the model into view. An invalid file leaves the current model intact.

If a file contains notes, areas, annotations, or composite aggregations that your settings hide, a dialog offers to reveal them. Enabling composite aggregation also makes it available for creation.

Some browsers can save back to an opened or dropped file. Others prompt for a location or download a copy. Current models use format version 2; version 1 files still open, but older Modelizer versions cannot open version 2 files.

### Bring in an existing design

Use **File → Import** for Java Modelizer (`.mod`) or MySQL (`.sql`) files. Review the result after importing. Unrecognized attribute types become **Undefined** and are reported in a warning.

Java Modelizer import keeps supported classes, attributes, positions, and connections. Unsupported or incomplete links may be skipped. MySQL import reads table definitions and foreign keys; composite foreign keys are ignored.

### Export an image

1. Switch to the view you want to share, then choose **Export PNG** from File or the sidebar.
2. In the preview, choose whether to include notes, areas, and annotations. These options appear when the current view contains those items, even if they are hidden on the canvas.
3. Choose **Standard (1×)** or **High (2×)** resolution. Open **More options** to set a white or transparent background, margins, and filename.
4. Wait for the preview to update, then choose **Download PNG**.

The export fits the included content regardless of your current zoom or pan. It omits the grid, editor controls, and laser effects. A transparency checkerboard is only a preview aid. Export settings do not change the model or its canvas settings.

## Solve common problems

### I cannot find a class or connection

Check the active view first: conceptual view shows associations; logical and physical views show relationships. Check the element’s **Visibility** settings, then use its focus button in the panel to locate it.

For missing notes, areas, or drawings, check **View**. For composite aggregations, check **Preferences → Enable composite aggregation**.

### An editing field or color button is missing

**Preferences → Only show fields for current view** hides fields that do not apply to the active view. Switch views or disable that preference. Color buttons are hidden when **View → Accent colors** is off.

### Dragging draws instead of moving the model

Choose **Pointer** in the annotation toolbar. Other drawing tools capture canvas input. **Esc** cancels the current gesture or selection first; press it again to return to Pointer if needed.

### I made a mistake

Use **Edit → Undo** and **Edit → Redo**. Annotation edits share the model’s history. **Preferences → Confirm before deleting** adds a confirmation before deleting model elements.

### A PNG is missing something

Check the active view and the preview’s inclusion options. Hidden notes, areas, and annotations can be included without showing them on the editor canvas. Use **Try again** if the preview reports an export error.

### My changes were not saved

Look for the `*` beside the model name. Use **Save**, and check whether the browser asks for file permission or downloads a new copy. A PNG is an image, not an editable backup; keep a `.mdlz` file as well.

## Keyboard shortcuts

Use **Cmd** instead of **Ctrl** for the shortcuts shown as Ctrl/Cmd. On macOS, **Option** is the Alt key.

| Action | Shortcut |
| --- | --- |
| New model | `Ctrl/Cmd + N` |
| Open model | `Ctrl/Cmd + O` |
| Save model | `Ctrl/Cmd + S` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` |
| Add class or table | `Ctrl + Alt + C` |
| Add attribute or column to the selected class/table | `Ctrl + Alt + A` |
| Delete selection | `Delete` / `Backspace` |

### Annotation tools

With annotations visible and while not typing: **V** selects Pointer, **S** Select annotation, **P** Pen, **M** Marker, **T** Text, **E** Ink eraser, and **L** Laser.

| Action | Shortcut |
| --- | --- |
| Temporarily pan with a drawing tool active | Hold `Space` and drag |
| Select a focused annotation | `Tab` to a mark, then `Enter` |
| Nudge a selected annotation | Arrow keys; hold `Shift` for 10-unit steps |
| Duplicate a selected annotation | `Ctrl/Cmd + D` |
| Edit selected text | `Enter` |
| Confirm text / insert a new line | `Enter` / `Shift + Enter` |
| Cancel text editing | `Esc` |
| Cancel a gesture or clear selection, then return to Pointer | `Esc` |

### Manual lines

Double-click a segment to add a routing handle. Drag a handle to move it; **Alt + click** (**Option + click** on macOS) removes it.
