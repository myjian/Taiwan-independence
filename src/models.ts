export const enum ChartType {
  STANDARD = 0,
  DX = 1,
  UTAGE = 2,
}

export interface SongProperties {
  dx: ChartType;
  name: string;
  genre: string;
  ico?: string;
  debut: number; // from 0 to latest version number
  lv: ReadonlyArray<number>;
}
