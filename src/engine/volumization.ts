export interface CycleRailPoint {
  day: number;
  anabolic: number;
  [key: string]: any;
}

export const computeVolumizationBonus = (day: number): number => {
  if (!Number.isFinite(day) || day < 0) {
    return 0;
  }

  if (day <= 14) {
    const progress = Math.max(0, Math.min(1, day / 14));
    return progress * 40;
  }

  if (day <= 28) {
    const taperProgress = (day - 14) / 14;
    return 40 * (1 - taperProgress) * 0.6;
  }

  if (day <= 56) {
    const phase2Progress = (day - 28) / 28;
    return 24 * (1 - phase2Progress);
  }

  return 0;
};

export const applyVolumizationEnvelope = <T extends CycleRailPoint>(
  points: T[] = [],
): Array<T & { volumizationBonus: number; totalMass: number }> => {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  return points.map((point) => {
    const volumizationBonus = computeVolumizationBonus(point.day);
    return {
      ...point,
      volumizationBonus,
      totalMass: (point.anabolic ?? 0) + volumizationBonus,
    };
  });
};
