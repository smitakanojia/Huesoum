// View-layer constants and small helpers, ported from the prototype's UI region
// (the parts below the engine cut). These drive the React shell, the pipeline
// animation and the result before/after control.
import { groundedIds } from './engine';

export const NAV: [string, string][] = [
  ['', 'nav_analysis'],
  ['history', 'nav_history'],
  ['registry', 'nav_registry'],
  ['trace', 'nav_trace'],
];

export const STAGES = [
  { id: 'input', label: 'Input check', sub: 'GeoTIFF and TIFF' },
  { id: 'sensor', label: 'Sensor profile', sub: 'Modality and metadata' },
  { id: 'query', label: 'Query understanding', sub: 'Language to task' },
  { id: 'plan', label: 'Task planning', sub: 'Select tools' },
  { id: 'analysis', label: 'Specialist analysis', sub: 'Run the tools' },
  { id: 'fusion', label: 'Evidence fusion', sub: 'Measure and verify' },
  { id: 'result', label: 'Verified answer', sub: 'Answer, confidence, map' },
];

export const AGENTIC_STAGES = [
  { label: 'Query', sub: 'Natural-language question' },
  { label: 'Understanding', sub: 'Parsed into a task' },
  { label: 'Validation', sub: 'Inputs checked against the task' },
  { label: 'Tool selection', sub: 'Registry, permitted parameters' },
  { label: 'Specialist analysis', sub: 'Tools run in sequence' },
  { label: 'Evidence validation', sub: 'Sources cross-checked' },
  { label: 'Fusion', sub: 'Confidence, conflicts resolved' },
  { label: 'Grounded response', sub: 'Answer tied to evidence' },
];

export const TASK_MAP: Record<string, string[]> = {
  CHANGE_GROUNDING: ['CHANGE', 'GROUND'],
  CHANGE_VQA: ['CHANGE', 'VQA'],
  CHANGE_DESCRIBE: ['CHANGE', 'DESC'],
  GROUNDING: ['GROUND'],
  COUNT: ['COUNT'],
  VQA: ['VQA'],
  CAPTION: ['DESC'],
  OPTICAL_SAR: ['FUSION'],
};

export const TOOL_LABEL: Record<string, string> = {
  rs_vlm: 'RS-VLM',
  detector: 'Detector',
  change_map: 'Change model',
  change_diff: 'Change by differencing',
  sar_water: 'SAR water',
  sar_builtup: 'SAR built-up',
  water_mask: 'Water index',
  index_mask: 'Spectral index',
  select_region: 'Region selection',
};

// Before / after configuration for a result's map (ported from baConfig).
export function baConfig(r: any) {
  const L = r.layers.map((l: any) => l.layer_id);
  const over = L.filter((i: string) => !i.startsWith('base_') && i !== 'ndvi');
  if (L.includes('base_T1') && L.includes('base_T2'))
    return {
      names: ['T1', 'T2', 'Grounded'],
      sets: [['base_T1'], ['base_T2'], ['base_T2'].concat(groundedIds(r))],
      slide: { left: ['base_T1'], right: ['base_T2'], labels: ['T1', 'T2'] },
      slideName: 'Compare T1 and T2',
    };
  if (L.includes('base_optical') && L.includes('base_sar'))
    return {
      names: ['Optical', 'Radar', 'Combined'],
      sets: [['base_optical'], ['base_sar'], ['base_optical'].concat(over)],
      slide: { left: ['base_optical'], right: ['base_sar'], labels: ['Optical', 'Radar (SAR)'] },
      slideName: 'Compare optical and radar',
    };
  return null;
}
