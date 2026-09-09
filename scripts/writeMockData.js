import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateMockDataFile } from './updateMockDataFile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempSyncFile = path.resolve(__dirname, '../src/data/.seller_sync.json');

try {
  let payload = {};

  if (process.env.SELLER_DATA) {
    payload = JSON.parse(process.env.SELLER_DATA);
  } else if (fs.existsSync(tempSyncFile)) {
    payload = JSON.parse(fs.readFileSync(tempSyncFile, 'utf8'));
  } else {
    console.log('No pending seller sync file or SELLER_DATA env found. Checked: ' + tempSyncFile);
    process.exit(0);
  }

  updateMockDataFile(payload);
  console.log('Successfully updated src/data/mockData.js with latest seller data!');
} catch (err) {
  console.error('Failed to write mock data:', err);
  process.exit(1);
}
