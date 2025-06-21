/** Sort all plate info JSON files under a given path. Items in arrays will be sorted */
import fs from 'fs';
import path from 'path';

if (process.argv.length !== 3) {
  console.error(`Usage: node ${process.argv[1]} <directory>`);
  process.exit(1);
}

// Directory containing JSON files
const directoryPath = process.argv[2];

// Function to process JSON files
async function processJsonFiles() {
  try {
    // List all files in the directory
    const files = fs.readdirSync(directoryPath);

    // Filter JSON files
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(directoryPath, file);

      // Read the JSON file
      console.log(`Reading file: ${filePath}`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // Make changes to the JSON data (example: add a timestamp)
      const updatedData: Record<string, any> = {};
      if (jsonData.version_name) {
        updatedData.version_name = jsonData.version_name;
      }
      if (jsonData.plate_name) {
        updatedData.plate_name = jsonData.plate_name;
      }
      if (jsonData.std_songs) {
        updatedData.std_songs = jsonData.std_songs.sort();
      } else {
        updatedData.std_songs = [];
      }
      if (jsonData.dx_songs) {
        updatedData.dx_songs = jsonData.dx_songs.sort();
      } else {
        updatedData.dx_songs = [];
      }
      if (
        jsonData.std_remaster_songs &&
        jsonData.std_remaster_songs.length > 0
      ) {
        updatedData.std_remaster_songs = jsonData.std_remaster_songs.sort();
      }
      if (jsonData.dx_remaster_songs && jsonData.dx_remaster_songs.length > 0) {
        updatedData.dx_remaster_songs = jsonData.dx_remaster_songs.sort();
      }
      // Write the updated JSON back to the file
      fs.writeFileSync(
        filePath,
        JSON.stringify(updatedData, null, 2) + '\n',
        'utf8'
      );
      console.log(`Updated file: ${file}`);
    }
  } catch (error) {
    console.error('Error processing JSON files:', error);
  }
}

// Run the function
processJsonFiles();
