# Flint build companion

A desktop/laptop construction guide for the **rowing-only** Flint, based on the supplied Ross Lillistone plans and assembly manual.

## Public app

GitHub Pages: https://analyticsinaction.github.io/flint-build-companion/

The public edition includes the interactive model, 15-stage guide, compartment study and part finder. Source references remain visible, but the purchased PDFs, DXF and source images are excluded from both the repository and deployment. The local edition retains its original PDF links.

## Open locally

Double-click **Open Flint.cmd** in this folder. It starts the compiled app on this computer at http://127.0.0.1:3000 and opens the browser. Node.js and the installed dependencies in this folder are required. The launcher reuses an already-running Flint server and refuses to replace another app on that port.

The app has 15 stages: materials, panel cutting, frame preparation, bottom unfolding, initial bulkheads, side wrapping, alignment, inside bonding, exterior work, gunwales, corner reinforcement, pre-closure checks, closing, rowing fit-out, finishing.

- Play, pause, change speed, scrub or jump between stages.
- Optional automatic pauses at alignment and pre-closure checks.
- Orbit, pan, zoom, camera presets and fullscreen.
- Search and select components; focus, isolate, hide or fade the hull.
- Lift/separate parts for inspection.
- Stage instructions, reading checkboxes and direct PDF-page links.
- Original source documents are served only by the local edition.

Checks are in-memory reading aids, not records of completed boatbuilding. Reloading resets them.

## Geometry and scope

`app/geometry.ts` records the 4,456 mm inside-planking length and section/station measurements from plan pages 3 and 6–9. Curves between stations are interpolated. The bow closure, transom placement, framing bevels, small hardware and fitted tops are illustrative. These are not manufacturing surfaces or a structural analysis.

`app/flat-panels.json` contains 101 cross-sections sampled from each of two connected hull-panel outlines in the supplied DXF. The visualisation treats coordinate units as millimetres; it has not established a production cutting file or reconciled every DXF dimension. `scripts/prepare-flat-panels.py` reproduces the samples from the review extraction. The resampled outline morphs into a separate assembled approximation; it is not a physically validated developability simulation.

The unfolding animation compresses the stitch-and-glue process. It cannot predict material strain, glue cure, buoyancy or launch readiness. The model contains no mast, sail, rudder, daggerboard or engine. Inspection fittings, oarlock sockets and timber details are representative.

Keep the original drawing pack as the construction authority. The guide highlights unresolved glass-weight/overlap units and seat-joint reinforcement wording. The original seat and tank-top patterns require fitting on the real hull.

## Development

```powershell
npm run dev -- --hostname 127.0.0.1
npm run typecheck
npm test
npm run build
npm start
```

The project uses the Sites/Vinext React starter and Three.js. The original local build is preserved; a separate Vite entry point publishes a static public edition to GitHub Pages. Preserve the supplied plan attribution and source files. The PDFs state that purchasing the plans authorises building one boat.

## Verification

- TypeScript check.
- Production build.
- Seven numerical/content tests: closure inspection/cover order, station interpolation, hull section bounds, seat spans, source page/file links, rowing-only component data and DXF sample integrity.
- HTTP checks of the running page, model modules and source assets.

Browser interaction and visual review were performed for the compartment demonstration: opening, four view controls, replay through completion, pause holding its progress, plain geometry, part details, isolation and focus without leaving the study, hide/show, and exiting back to the build sequence. The compact layout was inspected at a measured 1367 by 767 CSS pixels with no horizontal page overflow. WebMCP hooks are feature-detected for compatible browsers; registration was observed, while tool execution has not been verified. A browser that lacks WebGL shows an error and retains the written guide.

## Local server

`Start-Flint.ps1` launches a hidden production process bound to 127.0.0.1. Logs and the process ID are written under `.local/`. Close it with the accompanying `Stop-Flint.ps1`, which checks that the saved process belongs to this app before stopping it.

## Compartment closure demonstration

Use **Explore compartment closure** in the header, or **Explore the closure** in stages 12-13. The four views explain interior inspection, underside stiffeners, lowering the tops and reviewing compartment access. An 18-second illustrative playback has pause, replay and a scrubbable progress slider; Guide camera can be switched off for free exploration. The camera concentrates on the aft compartment while all top assemblies use the same closure progress.

The detail study is independent of the 15-stage build timeline. Stage navigation and Play build leave the study. It does not record workshop completion or represent glue cure time. Inspection covers appear only after the tops are seated.

Plywood tops retain their 6 mm modeled thickness and now have a thin edge stripe for readability, not a specified laminate count. Representative underside stiffeners were corrected to 38 mm across and 16 mm deep with their upper face against the plywood. Workshop lighting, contact shadows and a Plain geometry switch support inspection. Hull surfaces, fitted outlines, joints and hardware remain illustrative; no Blender scene, film, physical bending simulation or fabrication model was added.

## GitHub Pages deployment

`npm ci`, `npm run test:public`, and `npm run build:pages` build the public edition into `dist-pages/`. Its entry point uses the same React page and Three.js viewer as the local app. Relative asset paths support a GitHub project subdirectory. No server, API keys, accounts or paid services are required at runtime.

The GitHub Actions workflow publishes on pushes to `main`. The source and asset exclusion check runs before deployment. Original designer materials in `public/sources/`, local recording files, caches and installed video tools are ignored. To use the local PDF links after cloning, supply your own purchased manual and plans at the expected local paths.
