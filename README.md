# Modelizer

Modelizer is a lightweight database modeling tool developed for teaching the database modeling process (initially for courses in Luxembourg).

Online version: https://modelizer.haan.lu/  
Download: GitHub Releases

## Run locally (Windows)

1. Download the latest release from the GitHub Releases page.
2. Unzip it anywhere on your computer.
3. Double-click `modelizer.bat`
4. Open your browser at http://localhost:8080

The release includes a tiny local webserver based on miniserve:
https://github.com/svenstaro/miniserve

## Supported modeling elements

Modelizer supports:
- different modeling levels:
  - conceptual model (CDM)
  - logical model (LDM)
  - physical model (PDM)
- classes
- associations
- associative associations
- reflexive associations
- multiplicities
- attributes
- attribute types
- default values
- constraints: Null, Unique, Auto Increment

## What Modelizer does (and does not do)

Modelizer is intentionally a teaching tool that simplifies drawing and defining models.
It contains no validation logic and does not generate relationships automatically from associations.
It does not help you make the "right" modeling decisions — you do.

## Export & storage

- Export format: PNG
- Models must be downloaded manually (no server-side storage)
- Settings are stored in browser localStorage

## Acknowledgments

- ChartDB (interface design inspiration): https://github.com/chartdb/chartdb/
- Java Modelizer by Bob Fisch: https://modelizer.fisch.lu/
- miniserve (local webserver used in the release bundle): https://github.com/svenstaro/miniserve
