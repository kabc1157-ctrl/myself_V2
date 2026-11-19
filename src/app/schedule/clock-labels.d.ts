export type ClockLabel = {
  mode: "horizontal" | "radial" | "vertical" | "dot";
  x: number;
  y: number;
  rotate: number;
  lines: string[];
  fullLabel: string;
  fontSize: number;
  lineHeight: number;
};

export function layoutLabel(label: string, startHour: number, endHour: number, options?: { radius?: number; center?: number; baseFont?: number; radialFont?: number }): ClockLabel;
export function sectorPath(startHour: number, endHour: number, radius: number, center?: number): string;
export function textColorFor(fillColor: string): string;
