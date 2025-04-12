import fs from 'fs/promises';

import {parseArcadeSongsResponse} from './arcade-songs';

if (process.argv.length !== 4) {
  console.error(
    `Usage: node ${process.argv[1]} <arcade-songs-file> <output-file>`
  );
  process.exit(1);
}

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];

fs.readFile(inputFilePath, {encoding: 'utf-8'})
  .then(fileContent => {
    const songs = parseArcadeSongsResponse(fileContent);
    const outputText =
      '[\n  ' + songs.map(song => JSON.stringify(song)).join(',\n  ') + '\n]';
    return fs.writeFile(outputFilePath, outputText, 'utf-8');
  })
  .catch(error => {
    console.error('Error:', error);
  });
