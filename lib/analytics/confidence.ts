export type ConfidenceLevel =
  | "High"
  | "Medium"
  | "Low"
  | "Insufficient";

export type ConfidenceResult = {
  score: number;
  confidence: ConfidenceLevel;
  reasons: string[];
};

/*
|--------------------------------------------------------------------------
| TCGMVP Confidence Engine
|--------------------------------------------------------------------------
|
| Confidence measures the quality of available market evidence,
| not whether the investment itself is good or bad.
|
| High confidence means:
| - sufficient recent sales
| - reliable pricing
| - adequate listing depth
| - meaningful historical data
|
| Low confidence simply means conclusions should be interpreted
| with greater caution.
|
*/