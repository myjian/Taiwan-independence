/** Script to create magic */
import fs from 'fs/promises';

import {ArcadeSongsResponse, parseArcadeSongsResponse} from './arcade-songs';
import {parseOtogeDbData} from './otoge-db';

if (process.argv.length !== 6) {
  console.error(
    `Usage: node ${process.argv[1]} <arcade-songs-file> <otoge-db> <otoge-db-intl> <output-file>`
  );
  process.exit(1);
}

const inputFilePath = process.argv[2];
const otogeDbFilePath = process.argv[3];
const otogeDbIntlFilePath = process.argv[4];
const outputFilePath = process.argv[5];

fs.readFile(inputFilePath, {encoding: 'utf-8'})
  .then(async fileContent => {
    const jpOverride = parseOtogeDbData(
      await fs.readFile(otogeDbFilePath, {encoding: 'utf-8'})
    );
    const intlOverride = parseOtogeDbData(
      await fs.readFile(otogeDbIntlFilePath, {encoding: 'utf-8'})
    );
    const response: ArcadeSongsResponse = JSON.parse(fileContent);
    const songs = parseArcadeSongsResponse(response, jpOverride, intlOverride);
    const outputText =
      '[\n  ' + songs.map(song => JSON.stringify(song)).join(',\n  ') + '\n]';
    return fs.writeFile(outputFilePath, outputText, 'utf-8');
  })
  .catch(error => {
    console.error('Error:', error);
  });
