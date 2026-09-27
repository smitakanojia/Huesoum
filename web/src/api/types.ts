/* Placeholder for the generated API types.
 *
 * Per the P3 handover (FE-00), the real types are generated from the running
 * server's OpenAPI document and MUST NOT be hand-edited:
 *
 *     npm run gen:api   # openapi-typescript http://localhost:8000/openapi.json -o src/api/types.ts
 *
 * Until the server is running, the app uses the contract shapes described in the
 * Master Document (F3.3) as plain TypeScript below. These mirror JobResult,
 * FusionResult, Trace and Layer and are replaced wholesale by the generated file.
 */

export interface Layer {
  layer_id: string;
  name: string;
  kind: 'image' | 'vector';
  url: string;
  corners: [number, number][] | null;
  style: string;
  visible: boolean;
  data?: any;
}

export interface TraceStep {
  step_id: string;
  tool: string;
  model_id: string;
  status: string;
  summary: string;
  params: Record<string, any>;
  runtime_s: number;
  source: 'fake' | 'cache' | 'real';
}

export interface Trace {
  job_id: string;
  question: string;
  task: string;
  parsed_query: Record<string, any>;
  sensor_profile: any;
  plan: any[];
  steps: TraceStep[];
  skipped: string[];
  adapter_id: string | null;
  versions: Record<string, string>;
  resolved_from_turn?: string | null;
}

export interface FusionResult {
  answer: string;
  confidence: number;
  confidence_label: 'High' | 'Medium' | 'Low' | 'Conflict';
  reasons: string[];
  conflicts: { between: [string, string]; description: string }[];
  facts: Record<string, number | string>;
  model_description: string | null;
  display_masks: Record<string, any>;
  display_detections: Record<string, any>;
}

export interface JobResult {
  job_id: string;
  status: 'done' | 'failed' | 'needs_input' | 'queued' | 'running';
  message?: string | null;
  fusion: FusionResult | null;
  trace: Trace | null;
  layers: Layer[];
  downloads: Record<string, string>;
}

export interface Example {
  example_id: string;
  title: string;
  story: string;
  question: string;
  description: string;
  input_mode: string;
  kind: string;
  domain?: string;
  variant?: string;
}
