Modelizer is a lightweight database modeling tool created for teaching the database modeling process. It is intentionally **not** a "smart" modeling assistant:
- it **does not validate** your model
- it **does not correct** decisions
- it **does not auto-generate relationships** from associations  
It simply helps you **draw and document** your model quickly and clearly.

## Typical workflow (recommended)

1. **Create a new model** (`File > New`)
2. **Add classes** and place them on the canvas
3. Add **attributes** (names, types, constraints, default values)
4. In **Conceptual view**, create **associations** and set **multiplicities**
5. Switch to **Logical / Physical view** and create **relationships**
6. **Save** the model file (`File > Save`)
7. **Export as PNG** when you need a diagram for a report or submission

## Views: Conceptual, Logical, Physical

Modelizer provides three views of the same model. You can switch views using the sidebar.

### Conceptual view

Use this view to focus on **structure and meaning**.
- Classes
- Associations (including reflexive and associative associations)
- Multiplicities

### Logical view

Use this view when you transition to database logic.
- Classes
- Relationships (attribute-to-attribute)

### Physical view

Use this view for database-ready details.
- Classes
- Relationships
- Attribute types
- Constraints
- Default values

## Create and edit classes

### Add a class
- Open the **Classes** panel
- Click **Add class**
- Drag the class on the canvas to position it
- Adding a class in logical or physical view has it hidden by default in conceptual view.

### Rename a class
- Rename it directly inside the **Classes** panel

### Delete a class
- Select the class and delete it from the panel (Confirmation dialogs can be enabled/disabled in **Settings**.)

## Add and edit attributes

Attributes are managed inside the **Classes** panel. Adding an attribute in logical or physical view has it hidden by default in conceptual view.

For each attribute, you can define:

### Name
The attribute name as shown in the current view.

### Visibility
Define in what view this attribute should be visible.

### Logical name
Define an alternate name for this attribute in logical/physical view.

### Constraints
Constraints are available as toggles:
- **Null** (nullable / not nullable depending on your display mode)
- **Unique**
- **Auto Increment**

How "Null" is shown can be configured in the **View** menu (for example `N`, `NN`, or as `?` on the type).

### Type
Pick a type or leave it as **Undefined**.

Some types allow additional parameters:
- `varchar(n)` → Max Length  
- `decimal(p,s)` → Precision and Scale  
- `enum(...)` → Comma-separated enumeration values

### Default value
Optional. If at least one attribute has a default value, Modelizer shows a **Default Values** panel (and includes it in PNG exports).

## Create associations (Conceptual view)

Associations are created in **Conceptual view** by connecting classes on the canvas.

Modelizer supports:
- **Association** (between two classes)
- **Reflexive association** (a class connected to itself)
- **Associative association** (a class connected to an association)
- **Composite aggregation** (a strong dependency between two classes)

After creating an association, open the **Refs** panel to edit:
- association name (if used)
- multiplicities
- roles / labels (if needed)

## Create relationships (Logical / Physical view)

Relationships are created in **Logical** or **Physical** view by connecting **attributes**.

Use the **Refs** panel to review and delete relationships cleanly.

## Keeping layouts consistent between views (Sync)

Classes sync their positions automatically as long as they haven't been moved manually.

Logical and Physical views include a **Sync** option in the sidebar.

Use it when you want to copy the positions from the previous view so that your diagrams stay aligned across the modeling process.

## Save, open, export

### Save / Open (`.mdlz`)
Saving creates a model file on your computer.

There is **no server-side storage**:
- nothing is uploaded automatically
- models must be saved/downloaded manually

### Export as PNG
`File > Export as PNG` exports the **current view** as an image.

Notes:
- the export includes what you currently see (view + visibility settings)
- the Default Values panel is included when it is visible
- export format is currently **PNG only**

## Settings that matter

### Confirmation dialogs
Enable/disable confirmations when deleting things (classes, attributes, associations, relationships).

### Composite aggregation (optional)
If enabled, you can convert associations into composition edges from the Associations panel.

### PNG export colors
You can choose whether accent colors should be included in PNG exports.

### Local settings storage
User settings are stored in the browser using **localStorage**.  
(Models are **not** stored there — only your preferences.)

## Teacher tools (optional)

### Anti-cheat panel
If enabled, Modelizer can display internal identifiers and tamper status (based on the model file data).  
This is meant as a classroom tool and may be hidden in normal usage.

## Keyboard shortcuts

- New model: **Ctrl/Cmd + N**
- Open: **Ctrl/Cmd + O**
- Save: **Ctrl/Cmd + S**
- Delete selected class/edge: **Delete**

## Things to keep in mind

- Modelizer will not tell you whether your model is "correct".
- Associations and relationships are intentionally separate concepts in Modelizer.
- Export is currently PNG only.
- Always save your `.mdlz` file if you want to continue later.
