import {SongProperties} from './models';
import {normalizeSongName} from './song-name-helper';

interface OtogeDbSong {
  title: string;
  catcode: string;
  image_url: string;
  // dx_lev_exp is used to check whether a song has DX chart
  lev_exp: string;
  // dx_lev_exp is used to check whether a song has DX chart
  dx_lev_exp: string;
  dx_lev_bas_i: string | undefined;
  dx_lev_adv_i: string | undefined;
  dx_lev_exp_i: string | undefined;
  dx_lev_mas_i: string | undefined;
  dx_lev_remas_i: string | undefined;
  lev_bas_i: string;
  lev_adv_i: string;
  lev_exp_i: string;
  lev_mas_i: string;
  lev_remas_i: string;
}

function getIco(song: OtogeDbSong): string | undefined {
  if (song.image_url) {
    // If there is file extension, remove it.
    // Otherwise, return the whole string.
    return song.image_url.split('.')[0];
  }
  return undefined;
}

function parseLevel(rawLv: string | undefined): number {
  if (!rawLv) {
    return 0;
  }
  const lv = parseFloat(rawLv);
  if (isNaN(lv)) {
    console.warn(`Invalid level: ${rawLv}`);
    return 0;
  }
  return lv;
}

function getStdLevels(song: OtogeDbSong): number[] | undefined {
  if (!song.lev_exp) {
    return undefined;
  }
  return [
    song.lev_bas_i,
    song.lev_adv_i,
    song.lev_exp_i,
    song.lev_mas_i,
    song.lev_remas_i,
  ].map(i => parseLevel(i));
}

function getDxLevels(song: OtogeDbSong): number[] | undefined {
  if (!song.dx_lev_exp) {
    return undefined;
  }
  return [
    song.dx_lev_bas_i,
    song.dx_lev_adv_i,
    song.dx_lev_exp_i,
    song.dx_lev_mas_i,
    song.dx_lev_remas_i,
  ].map(i => parseLevel(i));
}

export function parseOtogeDbData(
  rawContext: string
): Map<string, SongProperties[]> {
  const songs: OtogeDbSong[] = JSON.parse(rawContext);
  const override = new Map<string, SongProperties[]>();
  songs.forEach(song => {
    const name = normalizeSongName(song.title);
    const genre = song.catcode;
    const ico = getIco(song);
    const levelsByChartType = [getStdLevels(song), getDxLevels(song)];
    if (!override.has(name)) {
      override.set(name, []);
    }
    levelsByChartType.forEach((levels, chartType) => {
      // We add props even when levels is undefined.
      // This allows us to set the ico for every song.
      const props: SongProperties = {
        name,
        genre,
        // debut is unused.
        debut: 0,
        dx: chartType,
        lv: levels || [],
        ico,
      };
      override.get(name)?.push(props);
    });
  });
  return override;
}
