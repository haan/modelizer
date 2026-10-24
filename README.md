# Modelizer

Modelizer is a lightweight database modeling tool for teaching and discussing the database modeling process, originally developed for courses in Luxembourg.

[Use Modelizer online](https://www.modelizer.lu/) · [Download for Windows](https://github.com/haan/modelizer/releases) · [Docker image](https://hub.docker.com/r/haanlaurent/modelizer)

## Model in three views

| View | Purpose |
| --- | --- |
| **Conceptual** | Describe the domain with classes, attributes, associations, roles, and multiplicities. |
| **Logical** | Define tables and relationships between attributes, using logical names where needed. |
| **Physical** | Specify column types, nullability, uniqueness, auto-increment, and default values. |

Conceptual models support parallel, reflexive, and associative associations, as well as composite aggregation. Enable **Preferences → Enable composite aggregation** to create and display composite aggregations.

Modelizer leaves modeling decisions to the learner. It does not validate modeling correctness or automatically generate relationships from associations.

## Get started

1. Open Modelizer and choose **File → New**.
2. In conceptual view, add classes and attributes from the **Classes** panel.
3. Connect class handles to create associations, then edit their names, roles, and multiplicities in **Relations**.
4. Switch to logical or physical view to define relationships between attributes or columns and add implementation details.
5. Save an editable `.mdlz` file. Export a PNG when you need an image to share.

Open **Help** in the application for task-based instructions, troubleshooting, and keyboard shortcuts. The [same guide is available in this repository](src/content/help.md).

## Save, import, and share

**Save and reopen models.** Use **File → Save** or **Save As** to keep a `.mdlz` file containing the model, layouts, notes, areas, and annotations. Reopen it with **File → Open** or by dropping one file onto the application. Depending on browser support and file permissions, Save writes back to the chosen file, prompts for a location, or downloads a copy.

Models are stored in local files, with no server-side model storage. The `*` beside the model name indicates unsaved changes. Editor preferences are remembered separately in the browser. Current saves use file format version 2; version 1 files still open, but older Modelizer versions cannot open version 2 files.

**Import existing designs.** Import Java Modelizer (`.mod`) or MySQL (`.sql`) files through **File → Import**. Review the result: unsupported types are reported and mapped to Undefined, unsupported Java Modelizer links may be skipped, and composite MySQL foreign keys are ignored.

**Export an image.** **Export PNG** previews the full current view and lets you choose whether to include notes, areas, annotations, and accent colors. Choose standard or high resolution, a white or transparent background, margins, and a filename. Export settings do not change the model. Keep a `.mdlz` file as your editable copy; PNG is for sharing and presentation.

## Teach and discuss

Use **View → Notes** for explanations and **View → Areas** to group related elements. Enable **View → Annotations** to draw with a pen or marker, add text and shapes, or point things out with a temporary laser. Annotations are saved separately for each modeling view; laser effects are never saved or exported.

Use **View** to adjust diagram content, notation, the background grid, accent colors, and fullscreen display. **Preferences** controls editor behavior and dark mode. PNG exports use light styling while preserving user-selected class, area, and annotation colors.

## Run locally on Windows

1. Download the release ZIP from [GitHub Releases](https://github.com/haan/modelizer/releases).
2. Unzip it anywhere on your computer.
3. Double-click `modelizer.bat` to start the local server and open your browser.
4. If the browser does not open automatically, visit [localhost:8080](http://localhost:8080).

The release includes a small local webserver based on [miniserve](https://github.com/svenstaro/miniserve). Close the server window when you are finished.

## Run with Docker

Run the latest published [Docker image](https://hub.docker.com/r/haanlaurent/modelizer):

```bash
docker run --rm -p 8080:80 haanlaurent/modelizer:latest
```

Open [localhost:8080](http://localhost:8080). To use a specific release, replace `latest` with its published version tag.

To build and run the image from this repository:

```bash
docker build -t modelizer:local .
docker run --rm -p 8080:80 modelizer:local
```

## Development

Use **Node.js 26.12.1 or a later 26.x release** and npm. This minimum includes the Brotli decoder security fix for CVE-2026-111497. The repository pins its development version in [.nvmrc](.nvmrc).

From the repository root, install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

Run lint and unit tests:

```bash
npm test
```

Build and preview the production app:

```bash
npm run build:ci
npm run preview
```

`build:ci` writes the web app to `dist/`. Use `npm run build` when you also want to refresh `bundle/app/dist/` for the Windows release bundle.

The [examples folder](examples/) contains five conceptual smoke-test models of increasing complexity. Follow the [smoke-test guide](examples/README.txt) for manual checks; the largest model is an intentional readability stress test, not a claim that every layout already renders perfectly.

## Acknowledgments

- [Java Modelizer](https://modelizer.fisch.lu/) by Bob Fisch — Modelizer’s predecessor.
- [ChartDB](https://github.com/chartdb/chartdb/) — interface design inspiration.
- [miniserve](https://github.com/svenstaro/miniserve) — the local webserver used in the Windows release bundle.
