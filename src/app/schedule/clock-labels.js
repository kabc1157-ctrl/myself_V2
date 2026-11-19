const TAU = Math.PI * 2;

const normalizeHour = (hour) => ((hour % 24) + 24) % 24;

const pointAt = (hour, radius, center) => {
  const angle = (normalizeHour(hour) / 24) * TAU - Math.PI / 2;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
};

export function sectorPath(startHour, endHour, radius, center = 161) {
  const end = endHour <= startHour ? endHour + 24 : endHour;
  const start = pointAt(startHour, radius, center);
  const finish = pointAt(end, radius, center);
  const largeArc = end - startHour > 12 ? 1 : 0;
  return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${finish.x} ${finish.y} Z`;
}

const truncate = (value, max) => {
  const chars = Array.from(value.trim() || "일정");
  if (chars.length <= max) return chars.join("");
  const limit = Math.max(1, max - 1);
  const kept = chars.filter((_, index) => index < limit).join("");
  return `${kept}…`;
};

const angleDelta = (value, target) => Math.atan2(Math.sin(value - target), Math.cos(value - target));

const pointFitsSector = (x, y, center, radius, startAngle, endAngle) => {
  const dx = x - center;
  const dy = y - center;
  if (Math.hypot(dx, dy) > radius) return false;
  const angle = Math.atan2(dy, dx);
  const span = endAngle - startAngle;
  return angleDelta(angle, startAngle + span / 2) >= -span / 2 && angleDelta(angle, startAngle + span / 2) <= span / 2;
};

const textBoxFitsSector = ({ x, y, width, height, center, radius, startAngle, endAngle, padding }) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const safeRadius = radius - padding;
  return [
    [x - halfWidth, y - halfHeight],
    [x + halfWidth, y - halfHeight],
    [x - halfWidth, y + halfHeight],
    [x + halfWidth, y + halfHeight],
  ].every(([cornerX, cornerY]) => pointFitsSector(cornerX, cornerY, center, safeRadius, startAngle, endAngle));
};

export function layoutLabel(label, startHour, endHour, options = {}) {
  const {
    radius = 113,
    center = 161,
    baseFont = 13,
    radialFont = 12,
  } = options;
  const end = endHour <= startHour ? endHour + 24 : endHour;
  const duration = Math.max(0, end - startHour);
  const angleSpan = Math.min(duration, 24) * TAU / 24;
  const midHour = startHour + duration / 2;
  const angle = (normalizeHour(midHour) / 24) * 360 - 90;
  const rad = angle * Math.PI / 180;
  const mode = duration <= 0.5 ? "dot" : duration <= 1 ? "radial" : "horizontal";
  const usableWidth = Math.max(18, 2 * radius * Math.sin(Math.min(Math.PI / 2, angleSpan / 2)) * 0.72);
  const usableHeight = Math.max(18, radius * Math.min(1.4, angleSpan) * 0.72);
  const r = mode === "horizontal" ? radius * 0.56 : mode === "radial" ? radius * 0.58 : radius * 0.68;
  const x = center + Math.cos(rad) * r;
  const y = center + Math.sin(rad) * r;
  const readableAngle = ((angle + 180) % 360) - 180;
  const rotate = readableAngle > 90 || readableAngle < -90 ? angle + 180 : angle;
  const fullLabel = label.trim() || "일정";
  if (mode === "dot") return { mode, x, y, rotate, lines: [], fullLabel, fontSize: radialFont, lineHeight: 1.15 };
  if (mode === "horizontal") {
    const words = fullLabel.split(/\s+/).filter(Boolean);
    const startAngle = (normalizeHour(startHour) / 24) * TAU - Math.PI / 2;
    const endAngle = startAngle + angleSpan;
    const candidates = [];
    for (let lineCount = 1; lineCount <= Math.min(4, Math.max(1, words.length)); lineCount += 1) {
      const lines = [];
      if (lineCount === 1) {
        lines.push(fullLabel);
      } else {
        let line = "";
        words.forEach((word) => {
          const remaining = words.length - (lines.length + 1);
          const candidate = line ? `${line} ${word}` : word;
          if (line && lines.length < lineCount - 1 && candidate.length > Math.ceil(fullLabel.length / lineCount) && remaining >= lineCount - lines.length - 1) {
            lines.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });
        if (line) lines.push(line);
      }
      candidates.push(lines);
    }
    for (const lines of candidates.reverse()) {
      for (let fontSize = Math.min(16, baseFont); fontSize >= 12; fontSize -= 0.5) {
        const lineHeight = fontSize * 1.15;
        const width = Math.max(...lines.map((value) => value.length)) * fontSize * 0.58;
        const height = lines.length * lineHeight;
        const labelRadius = radius * (lines.length === 1 ? 0.42 : 0.58);
        const labelX = center + Math.cos(rad) * labelRadius;
        const labelY = center + Math.sin(rad) * labelRadius;
        if (textBoxFitsSector({ x: labelX, y: labelY, width, height, center, radius, startAngle, endAngle, padding: 8 })) {
          return { mode: lines.length === 1 ? "horizontal" : "vertical", x: labelX, y: labelY, rotate: 0, lines, fullLabel, fontSize, lineHeight: 1.15 };
        }
      }
    }
    return { mode: "dot", x, y, rotate, lines: [], fullLabel, fontSize: radialFont, lineHeight: 1.15 };
  }
  const text = truncate(fullLabel, Math.max(4, Math.floor(usableWidth / Math.max(8, radialFont * 0.58))));
  return { mode, x, y, rotate, lines: [text], fullLabel, fontSize: Math.max(12, Math.min(14, radialFont)), lineHeight: 1.15 };
}

export function textColorFor(fillColor) {
  const hex = String(fillColor).replace("#", "");
  if (hex.length !== 6) return "#586486";
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 185 ? "#586486" : "#756A60";
}
