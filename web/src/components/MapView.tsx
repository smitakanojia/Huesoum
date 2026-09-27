import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { E } from '../state/store';

const STYLES = E.STYLES;

// Landscape map evidence panel built on MapLibre GL (P3 handover). Base and mask
// layers are added as image sources positioned by their lon/lat corners; outlines
// and detection boxes are GeoJSON sources. `ids` (when given) is the exact visible
// set for a before/after view; otherwise each layer's own `visible` flag is used.
export default function MapView({
  layers,
  ids,
}: {
  layers: any[];
  ids: string[] | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    if (!host.current || map.current) return;
    const m = new maplibregl.Map({
      container: host.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0d1a24' } }],
      },
      attributionControl: false,
      dragRotate: false,
      center: [E.GEO.lon0, E.GEO.lat0],
      zoom: 12,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const apply = () => {
      // remove previously added sources/layers
      const style = m.getStyle();
      (style.layers || []).forEach((l: any) => {
        if (l.id.startsWith('sq-')) m.getLayer(l.id) && m.removeLayer(l.id);
      });
      Object.keys(style.sources || {}).forEach((s) => {
        if (s.startsWith('sq-')) m.getSource(s) && m.removeSource(s);
      });

      const visible = layers.filter((l) => (ids ? ids.includes(l.layer_id) : l.visible));
      const rank = (l: any) =>
        l.kind === 'image' ? (l.style === 'base' ? 0 : 1) : (STYLES[l.style] || {}).render === 'boxes' ? 3 : 2;
      visible.sort((a, b) => rank(a) - rank(b));

      let bounds: maplibregl.LngLatBounds | null = null;
      for (const l of visible) {
        const sid = 'sq-' + l.layer_id;
        const st = STYLES[l.style] || {};
        if (l.kind === 'image' && l.corners) {
          m.addSource(sid, { type: 'image', url: E.absUrl(l.url), coordinates: l.corners });
          m.addLayer({ id: sid, type: 'raster', source: sid, paint: { 'raster-opacity': l.style === 'base' ? 1 : st.opacity ?? 0.6, 'raster-fade-duration': 0 } });
          if (l.style === 'base') {
            l.corners.forEach((c: [number, number]) => {
              bounds = bounds ? bounds.extend(c) : new maplibregl.LngLatBounds(c, c);
            });
          }
        } else if (l.kind === 'vector' && l.data) {
          m.addSource(sid, { type: 'geojson', data: l.data });
          const boxes = st.render === 'boxes';
          if (boxes) {
            m.addLayer({ id: sid + '-f', type: 'fill', source: sid, paint: { 'fill-color': st.color, 'fill-opacity': 0.12 } });
          }
          m.addLayer({
            id: sid,
            type: 'line',
            source: sid,
            paint: {
              'line-color': st.color,
              'line-width': st.width || 1.5,
              ...(st.dash ? { 'line-dasharray': st.dash } : {}),
            },
          });
        }
      }
      if (bounds && !fitted.current) {
        m.fitBounds(bounds, { padding: 28, duration: 0 });
        fitted.current = true;
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once('load', apply);
  }, [layers, ids]);

  return <div className="mv-host" ref={host} style={{ width: '100%', height: '100%' }} />;
}
