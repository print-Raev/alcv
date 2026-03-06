import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const FOLDER_PATH = './permit.files';
const OUTPUT_FILE = './master_permits.json';

function processPermits() {
  try {
    // Get all .xlsx files from the folder
    const files = fs.readdirSync(FOLDER_PATH).filter(file => file.endsWith('.xlsx'));

    if (files.length === 0) {
      console.log('No .xlsx files found in the folder.');
      return;
    }

    console.log(`Found ${files.length} .xlsx file(s):`, files);

    let allPermits = [];

    // Process each file
    for (const file of files) {
      const filePath = path.join(FOLDER_PATH, file);
      console.log(`Processing ${file}...`);

      // Read the workbook
      const workbook = XLSX.readFile(filePath);

      // Assume the first sheet contains the data
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Found ${jsonData.length} permits in ${file}`);

      // Add to the master array
      allPermits = allPermits.concat(jsonData);
    }

    // Write to master_permits.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPermits, null, 2));
    console.log(`\n✅ Successfully combined ${allPermits.length} permits into ${OUTPUT_FILE}`);

    // Validation: Print final count
    console.log(`\n📊 VALIDATION SUMMARY:`);
    console.log(`Total .xlsx files processed: ${files.length}`);
    console.log(`Total permits extracted: ${allPermits.length}`);
    console.log(`Expected target: ~2,000 permits`);

    if (allPermits.length >= 2000) {
      console.log(`🎉 Target reached! You have ${allPermits.length} permits.`);
    } else {
      console.log(`⚠️  Below target. You have ${allPermits.length} permits (expected ~2,000).`);
    }

  } catch (error) {
    console.error('❌ Error processing permits:', error);
  }
}

// Run the function
processPermits();