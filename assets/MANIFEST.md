# Imagery assets

The landing and auth pages use **public-domain Landsat 5 TM** imagery (USGS / NASA),
processed into false-colour composites for this page. In the current build these are
embedded as base64 inside the app (ported from the prototype) so the demo is fully
self-contained and needs no network.

All **analysis results and thumbnails in the workspace are synthetic** (fixture spec
F3.7), generated in the browser, and labelled as synthetic wherever they appear.

## To swap in your own / higher-resolution imagery for production

Replace the embedded images in `web/src/core/engine.ts` (the `IMG` object) — or,
preferably, move them to files under `web/public/assets/` and reference them by URL —
with appropriately licensed imagery. Recommended sources:

| Slot        | Suggested content                              | Source (public domain / open) |
|-------------|------------------------------------------------|-------------------------------|
| `hero`      | Indian urban + lakes + farmland, wide          | USGS EarthExplorer (Landsat), Bhoonidhi |
| `banner`    | Wide regional mosaic                           | Sentinel-2 (Copernicus, CC BY) |
| `login`     | Coastal / lake city scene                      | USGS / NASA |
| `queries`   | Reservoirs / water bodies                      | USGS / NASA |
| `single`    | Green corridor + lakes                         | USGS / NASA |
| `field_*`   | One scene per application domain               | mix of the above |

Keep the on-page credit line and this manifest accurate. Do not hotlink third-party
imagery; download and self-host with attribution. Do not present any imagery as an
official ISRO product.
