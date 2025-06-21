import {ChartType, RegionOverride, SongProperties} from './models';
import {normalizeSongName} from './song-name-helper';

export interface ArcadeSongsResponse {
  songs: ArcadeSong[];
  versions: ArcadeSongVersion[];
}

interface ArcadeSongVersion {
  version: string;
  abbr: string;
}

export interface ArcadeSong {
  songId: string;
  category: string;
  title: string;
  version: string;
  sheets: ArcadeSongSheet[];
}

interface ArcadeSongSheetRegionOverride {
  version?: string;
}

interface ArcadeSongSheet {
  type: 'std' | 'dx' | 'utage';
  difficulty: 'basic' | 'advanced' | 'expert' | 'master' | 'remaster';
  levelValue: number;
  internalLevel: string | null;
  internalLevelValue: number;
  // Valid keys of regions are 'jp', 'intl', and 'cn'.
  regions: Record<string, boolean>;
  regionOverrides: Record<string, Partial<ArcadeSongSheetRegionOverride>>;
  version: string;
}

const ALLOWED_CHART_TYPES = ['std', 'dx'];
const DIFFICULTIES = ['basic', 'advanced', 'expert', 'master', 'remaster'];

function compareSongsByDifficulty(
  a: ArcadeSongSheet,
  b: ArcadeSongSheet
): number {
  const aIndex = DIFFICULTIES.indexOf(a.difficulty);
  const bIndex = DIFFICULTIES.indexOf(b.difficulty);
  if (aIndex < 0 || bIndex < 0) {
    console.warn(
      `Invalid difficulty: ${a.difficulty} or ${b.difficulty}.`,
      a,
      b
    );
    return 0;
  }
  return aIndex - bIndex;
}

function getChartType(chartType: string): ChartType {
  switch (chartType) {
    case 'dx':
      return ChartType.DX;
    default:
      return ChartType.STANDARD;
  }
}

function getSongPropsOverride(
  song: ArcadeSong,
  sheet: ArcadeSongSheet,
  overrideMap: Map<String, SongProperties[]>
): SongProperties[] {
  return (overrideMap.get(normalizeSongName(song.title)) || []).filter(
    override => {
      if (override.name === 'Link') {
        // We use "icon" (niconico.substring(1, 5)) to identify the song
        // It works for for both "Niconico" and "niconico".
        const isSongNico = song.category.includes('icon');
        const isOverrideNico = override.genre.includes('icon');
        if (isSongNico !== isOverrideNico) {
          return false;
        }
      }
      return getChartType(sheet.type) === override.dx;
    }
  );
}

function createRegionOverrides(
  song: ArcadeSong,
  sheet: ArcadeSongSheet,
  versions: string[],
  overrideByRegion: Record<string, Map<string, SongProperties[]>>
): Record<string, RegionOverride> | undefined {
  return Object.entries(overrideByRegion).reduce((acc, entry) => {
    const [region, overrideMap] = entry;
    const overrideList = getSongPropsOverride(song, sheet, overrideMap);
    const lvOverride = overrideList[0]?.lv || [];
    const versionOverride = sheet.regionOverrides[region]?.version || '';
    const versionInRegion = versions.indexOf(versionOverride);
    if (versionInRegion < 0 && lvOverride.length === 0) {
      // There is no override for this region.
      return acc;
    }
    const regionOverride: RegionOverride =
      versionInRegion >= 0 && lvOverride.length > 0
        ? {debut: versionInRegion, lv: lvOverride}
        : versionInRegion >= 0
        ? {debut: versionInRegion}
        : {lv: lvOverride};
    if (!acc) {
      return {[region]: regionOverride};
    } else {
      acc[region] = regionOverride;
      return acc;
    }
  }, undefined as Record<string, RegionOverride> | undefined);
}

/**
 * Parse song properties from an ArcadeSong object.
 */
function parseArcadeSong(
  song: ArcadeSong,
  versions: string[],
  jpOverrideBySongTitle: Map<string, SongProperties[]>,
  intlOverrideBySongTitle: Map<string, SongProperties[]>
): SongProperties[] {
  const propsList: SongProperties[] = [];
  ALLOWED_CHART_TYPES.forEach(chartType => {
    const sheetList = song.sheets
      .filter(s => s.type == chartType)
      .sort(compareSongsByDifficulty);
    if (sheetList.length === 0) {
      return;
    }
    if (sheetList.length < 4) {
      console.warn(
        `Sheet of ${song.title} (${chartType}) is incomplete.`,
        sheetList
      );
      return;
    }
    const debutVer = versions.indexOf(sheetList[0].version || song.version);
    if (debutVer < 0) {
      console.warn(`Cannot find debut version for ${song.title}.`, song);
      return [];
    }
    const jpOverride = getSongPropsOverride(
      song,
      sheetList[0],
      jpOverrideBySongTitle
    )[0];
    const lv = sheetList.map((sheet, idx) => {
      if (sheet.internalLevel) {
        return sheet.internalLevelValue;
      }
      if (jpOverride?.lv[idx] > 0) {
        if (sheet.levelValue !== jpOverride.lv[idx]) {
          console.log(
            `Song ${song.title} (${chartType}) has a level override:`,
            `${sheet.difficulty} ${sheet.levelValue} -> ${jpOverride.lv[idx]}`
          );
        }
        return jpOverride.lv[idx];
      }
      return -sheet.levelValue;
    });
    const props: SongProperties = {
      debut: debutVer,
      genre: song.category,
      name: normalizeSongName(song.title),
      dx: getChartType(chartType),
      lv,
      regionOverrides: createRegionOverrides(song, sheetList[0], versions, {
        intl: intlOverrideBySongTitle,
      }),
      ico: jpOverride?.ico,
    };
    propsList.push(props);
  });
  return propsList;
}

export function parseArcadeSongsResponse(
  response: ArcadeSongsResponse,
  jpOverride: Map<string, SongProperties[]>,
  intlOverride: Map<string, SongProperties[]>
): SongProperties[] {
  const versions = response.versions.map(v => v.version);
  return response.songs.reduce(
    (songs, song) =>
      songs.concat(parseArcadeSong(song, versions, jpOverride, intlOverride)),
    [] as SongProperties[]
  );
}
