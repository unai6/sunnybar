/**
 * SunlightStatus Value Object
 * Represents whether a location is sunny or shaded
 */
export enum SunlightStatusType {
  SUNNY = 'SUNNY',
  PARTIALLY_SUNNY = 'PARTIALLY_SUNNY',
  SHADED = 'SHADED',
  NIGHT = 'NIGHT',
  UNKNOWN = 'UNKNOWN'
}

export interface SunlightStatusProps {
  status: SunlightStatusType;
  confidence: number;  // 0-1, how confident we are in the assessment
  reason?: string;
}

export class SunlightStatus {
  private constructor(
    public readonly status: SunlightStatusType,
    public readonly confidence: number,
    public readonly reason?: string
  ) {}

  static create(props: SunlightStatusProps): SunlightStatus {
    const confidence = Math.max(0, Math.min(1, props.confidence))
    return new SunlightStatus(props.status, confidence, props.reason)
  }

  static sunny(confidence: number = 1, reason?: string): SunlightStatus {
    return SunlightStatus.create({ status: SunlightStatusType.SUNNY, confidence, reason })
  }

  static shaded(confidence: number = 1, reason?: string): SunlightStatus {
    return SunlightStatus.create({ status: SunlightStatusType.SHADED, confidence, reason })
  }

  static partiallySunny(confidence: number = 0.5, reason?: string): SunlightStatus {
    return SunlightStatus.create({ status: SunlightStatusType.PARTIALLY_SUNNY, confidence, reason })
  }

  static night(): SunlightStatus {
    return SunlightStatus.create({
      status: SunlightStatusType.NIGHT,
      confidence: 1,
      reason: 'Sun is below the horizon'
    })
  }

  static unknown(reason?: string): SunlightStatus {
    return SunlightStatus.create({
      status: SunlightStatusType.UNKNOWN,
      confidence: 0,
      reason: reason || 'Unable to determine sunlight status'
    })
  }

  isSunny(): boolean {
    return this.status === SunlightStatusType.SUNNY ||
           this.status === SunlightStatusType.PARTIALLY_SUNNY
  }

  isShaded(): boolean {
    return this.status === SunlightStatusType.SHADED
  }

  isNight(): boolean {
    return this.status === SunlightStatusType.NIGHT
  }
}
