/** This script creates JSON files with plate information. */
import fs from 'fs/promises';

import {ArcadeSong, ArcadeSongsResponse} from './arcade-songs';
import {getSongNickname, normalizeSongName} from './song-name-helper';

interface SpecialPlateDefinition {
  versionNames: string[];
  outputFileSuffix: string;
  platePrefix: string;
  clearPlateName?: string;
  noSSSPlate?: boolean;
  stdRemasterSongs?: string[];
  dxRemasterSongs?: string[];
}

if (process.argv.length !== 4) {
  console.error(
    `Usage: node ${process.argv[1]} <arcade-songs-file> <output-directory>`
  );
  process.exit(1);
}

const REGIONS = ['jp', 'intl'];

const VERSIONS_TO_SKIP = ['maimai', 'maimai PLUS'];
const PRE_DX_VERSIONS = new Set([
  '真',
  '超',
  '檄',
  '橙',
  '暁',
  '桃',
  '櫻',
  '紫',
  '菫',
  '白',
  '雪',
  '輝',
  '舞',
]);

const ALL_REGION_REVIVED_SONGS = new Set(['前前前世']);
const INTL_REVIVED_SONGS = new Set([
  'Hand in Hand',
  'ダブルラリアット',
  'ハッピーシンセサイザ',
  '＊ハロー、プラネット。',
]);

function shouldSkipSong(
  song: ArcadeSong,
  region: string,
  platePrefix: string
): boolean {
  // Revived songs are not considered for plates.
  if (ALL_REGION_REVIVED_SONGS.has(song.title)) {
    return true;
  }
  if (song.title === 'ジングルベル' && platePrefix === '真') {
    return true;
  }
  if (region === 'intl' && PRE_DX_VERSIONS.has(platePrefix)) {
    return INTL_REVIVED_SONGS.has(song.title);
  }
  return false;
}

const SPECIAL_PLATES: SpecialPlateDefinition[] = [
  {
    versionNames: ['maimai', 'maimai PLUS'],
    outputFileSuffix: '0-1',
    platePrefix: '真',
    noSSSPlate: true,
  },
  {
    versionNames: [
      'maimai',
      'maimai PLUS',
      'GreeN',
      'GreeN PLUS',
      'ORANGE',
      'ORANGE PLUS',
      'PiNK',
      'PiNK PLUS',
      'MURASAKi',
      'MURASAKi PLUS',
      'MiLK',
      'MiLK PLUS',
      'FiNALE',
    ],
    outputFileSuffix: '0-12',
    platePrefix: '舞',
    clearPlateName: '覇者',
    stdRemasterSongs: [
      '39',
      'AMAZING MIGHTYYYY!!!!',
      'Alea jacta est!',
      'Bad Apple!! feat.nomico',
      'Beat Of Mind',
      'Blew Moon',
      'Burning Hearts ～炎のANGEL～',
      'CYBER Sparks',
      'City Escape: Act1',
      'Crush On You',
      'Danza zandA',
      'Endless World',
      'FFT',
      'Fragrance',
      'Future',
      'Garakuta Doll Play',
      'In Chaos',
      'Living Universe',
      'Lost Princess',
      'PANDORA PARADOXXX',
      'Panopticon',
      'QZKago Requiem',
      'Rooftop Run: Act1',
      'Save This World νMIX',
      'Schwarzschild',
      'Starlight Disco',
      'Sun Dance',
      'Tell Your World',
      'ZIGG-ZAGG',
      'the EmpErroR',
      'いーあるふぁんくらぶ',
      'からくりピエロ',
      'だんだん早くなる',
      'ってゐ！ ～えいえんてゐVer～',
      'はやくそれになりたい！',
      'ようこそジャパリパークへ',
      'アンチクロックワイズ',
      'インビジブル',
      'エピクロスの虹はもう見えない',
      'カゲロウデイズ',
      'ガラテアの螺旋',
      'キミとボクのミライ',
      'クレイジークレイジーダンサーズ',
      'サドマミホリック',
      'ジングルベル',
      'ナイトメア☆パーティーナイト',
      'ナイト・オブ・ナイツ',
      'ヒバナ',
      'ブリキノダンス',
      'マトリョシカ',
      'ロキ',
      'ロストワンの号哭',
      'ロミオとシンデレラ',
      'ワールズエンド・ダンスホール',
      '妄想感傷代償連盟',
      '患部で止まってすぐ溶ける～狂気の優曇華院',
      '明星ロケット',
      '最終鬼畜妹フランドール・S',
      '檄！帝国華撃団(改)',
      '洗脳',
      '立ち入り禁止',
      '結ンデ開イテ羅刹ト骸',
      '緋色のDance',
      '花と、雪と、ドラムンベース。',
      '若い力 -SEGA HARD GIRLS MIX-',
      '隠然',
      '雷切-RAIKIRI-',
    ],
  },
];

const inputFilePath = process.argv[2];
const outputDirPath = process.argv[3];

const outputDirPromise = fs.mkdir(outputDirPath, {recursive: true});

function addSongToSet(songs: Set<string>, song: ArcadeSong) {
  const nickname = getSongNickname(
    normalizeSongName(song.title),
    song.category
  );
  songs.add(nickname);
}

fs.readFile(inputFilePath, {encoding: 'utf-8'})
  .then(async fileContent => {
    // make sure the output directory is created.
    await outputDirPromise;

    const response: ArcadeSongsResponse = JSON.parse(fileContent);
    for (const region of REGIONS) {
      response.versions.forEach(async (version, versionIdx) => {
        if (VERSIONS_TO_SKIP.includes(version.version)) {
          // Skip versions that don't have associated plate.
          return;
        }
        // If we don't know the plate prefix, use question mark.
        const platePrefix = version.abbr.includes('(')
          ? version.abbr.charAt(version.abbr.indexOf('(') + 1)
          : '？';
        console.log(
          `Collecting plate info for ${region} ${version.version} (${platePrefix})`
        );
        const dxSongs = new Set<string>();
        const stdSongs = new Set<string>();
        response.songs.forEach(song => {
          if (shouldSkipSong(song, region, platePrefix)) {
            return;
          }
          song.sheets.forEach(sheet => {
            const sheetVersion =
              sheet.regionOverrides[region]?.version ||
              sheet.version ||
              song.version;
            if (sheet.regions[region] && sheetVersion === version.version) {
              if (sheet.type === 'dx') {
                addSongToSet(dxSongs, song);
              } else if (sheet.type === 'std') {
                addSongToSet(stdSongs, song);
              }
            }
          });
        });
        const plateNames = {
          FC: platePrefix + '極',
          SSS: platePrefix + '将',
          AP: platePrefix + '神',
          FSD: platePrefix + '舞舞',
        };
        const plateInfo = {
          version_name: version.version,
          plate_name: plateNames,
          std_songs: Array.from(stdSongs).sort(),
          dx_songs: Array.from(dxSongs).sort(),
        };
        const outputFilePath = `${outputDirPath}/${region}${versionIdx}.json`;
        console.log(
          `Writing plate info for ${region} ${version.version} to ${outputFilePath}`
        );
        await fs.writeFile(
          outputFilePath,
          JSON.stringify(plateInfo, null, 2) + '\n',
          'utf-8'
        );
      });
    }
    for (const specialPlate of SPECIAL_PLATES) {
      for (const region of REGIONS) {
        console.log(
          `Collecting special plate info for ${region} ${specialPlate.platePrefix}`
        );
        const dxSongs = new Set<string>();
        const dxRemasterSongs = new Set<string>();
        const stdSongs = new Set<string>();
        const stdRemasterSongs = new Set<string>();
        response.songs.forEach(song => {
          if (shouldSkipSong(song, region, specialPlate.platePrefix)) {
            return;
          }
          song.sheets.forEach(sheet => {
            const sheetVersion =
              sheet.regionOverrides[region]?.version || sheet.version;
            if (
              sheet.regions[region] &&
              specialPlate.versionNames.includes(sheetVersion)
            ) {
              if (sheet.difficulty !== 'remaster') {
                if (sheet.type === 'dx') {
                  addSongToSet(dxSongs, song);
                } else if (sheet.type === 'std') {
                  addSongToSet(stdSongs, song);
                }
              } else if (
                sheet.type === 'std' &&
                specialPlate.stdRemasterSongs?.includes(song.title)
              ) {
                addSongToSet(stdRemasterSongs, song);
              } else if (
                sheet.type === 'dx' &&
                specialPlate.dxRemasterSongs?.includes(song.title)
              ) {
                addSongToSet(dxRemasterSongs, song);
              }
            }
          });
        });
        const plateNames: Record<string, string> = {
          FC: specialPlate.platePrefix + '極',
          AP: specialPlate.platePrefix + '神',
          FSD: specialPlate.platePrefix + '舞舞',
        };
        if (!specialPlate.noSSSPlate) {
          plateNames.SSS = specialPlate.platePrefix + '将';
        }
        if (specialPlate.clearPlateName) {
          plateNames.CLEAR = specialPlate.clearPlateName;
        }
        const firstVersionName = specialPlate.versionNames[0];
        const lastVersionName =
          specialPlate.versionNames[specialPlate.versionNames.length - 1];
        const plateInfo: Record<string, any> = {
          version_name: `${firstVersionName} - ${lastVersionName}`,
          plate_name: plateNames,
          std_songs: Array.from(stdSongs).sort(),
          dx_songs: Array.from(dxSongs).sort(),
        };
        if (stdRemasterSongs.size > 0) {
          plateInfo.std_remaster_songs = Array.from(stdRemasterSongs).sort();
        }
        if (dxRemasterSongs.size > 0) {
          plateInfo.dx_remaster_songs = Array.from(dxRemasterSongs).sort();
        }
        const outputFilePath = `${outputDirPath}/${region}${specialPlate.outputFileSuffix}.json`;
        console.log(
          `Writing special plate info for ${region} to ${outputFilePath}`
        );
        await fs.writeFile(
          outputFilePath,
          JSON.stringify(plateInfo, null, 2) + '\n',
          'utf-8'
        );
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
