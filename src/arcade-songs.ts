import {ChartType, SongProperties} from './models';
import {normalizeSongName} from './song-name-helper';

interface ArcadeSongsResponse {
  songs: ArcadeSong[];
  versions: ArcadeSongVersion[];
}

interface ArcadeSongVersion {
  version: string;
  abbr: string;
}

interface ArcadeSong {
  songId: string;
  category: string;
  title: string;
  version: string;
  sheets: ArcadeSongSheet[];
}

interface ArcadeSongSheet {
  type: 'std' | 'dx' | 'utage';
  difficulty: 'basic' | 'advanced' | 'expert' | 'master' | 'remaster';
  levelValue: number;
  internalLevel: string | null;
  internalLevelValue: number;
}

const ALLOWED_CHART_TYPES = ['std', 'dx'];

/**
 * Parse song properties from an ArcadeSong object.
 */
function parseArcadeSong(
  song: ArcadeSong,
  versions: string[]
): SongProperties[] {
  const debutVer = versions.indexOf(song.version);
  if (debutVer < 0) {
    console.warn(`Cannot find debut version for ${song.title}.`, song);
    return [];
  }
  const propsList: SongProperties[] = [];
  ALLOWED_CHART_TYPES.forEach(chartType => {
    const sheetList = song.sheets.filter(s => s.type == chartType);
    if (sheetList.length === 0) {
      return;
    }
    if (sheetList.length < 4) {
      console.warn(
        `Sheet data for ${song.title} (${chartType}) is incomplete.`,
        sheetList
      );
      return;
    } else {
      console.assert(
        sheetList[0].difficulty === 'basic' &&
          sheetList[1].difficulty === 'advanced' &&
          sheetList[2].difficulty === 'expert' &&
          sheetList[3].difficulty === 'master',
        `Sheets are not ordered by difficulty`
      );
    }
    const props: SongProperties = {
      name: normalizeSongName(song.title),
      genre: song.category,
      dx: chartType === 'dx' ? ChartType.DX : ChartType.STANDARD,
      debut: debutVer,
      lv: sheetList.map(sheet =>
        sheet.internalLevel ? sheet.internalLevelValue : -sheet.levelValue
      ),
    };
    propsList.push(props);
  });
  return propsList;
}

export function parseArcadeSongsResponse(rawContext: string): SongProperties[] {
  const response: ArcadeSongsResponse = JSON.parse(rawContext);
  const versions = response.versions.map(v => v.version);
  return response.songs.reduce(
    (songs, song) => songs.concat(parseArcadeSong(song, versions)),
    [] as SongProperties[]
  );
}
