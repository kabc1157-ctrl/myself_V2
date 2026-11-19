export function average(values: number[]) {
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
}

export function completionRate(total: number, completed: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

export function representativeEmotion(entries: Array<{ emotion_emoji: string; emotion_score: number }>) {
  const mean = average(entries.map((entry) => entry.emotion_score));
  if (mean === null) return null;
  return entries.reduce((best, entry) => Math.abs(entry.emotion_score - mean) < Math.abs(best.emotion_score - mean) ? entry : best).emotion_emoji;
}
