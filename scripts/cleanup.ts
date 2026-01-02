import fs from 'fs';
import path from 'path';

/**
 * Cleanup Script
 * 
 * Usage: npx tsx scripts/cleanup.ts [directory] [--dry-run]
 * Default directory: ./src
 * Default mode: Real deletion (unless --dry-run is passed)
 */

const targetDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'src';
const isDryRun = process.argv.includes('--dry-run');

console.log(`Starting cleanup in: ${targetDir}`);
if (isDryRun) console.log('DRY RUN MODE: No files will be deleted.');

function isPageFile(filename: string): boolean {
  return /^page\.(tsx|jsx|ts|js)$/.test(filename);
}

function isEmptyFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.trim().length === 0;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

function cleanDirectory(dir: string): boolean {
  if (!fs.existsSync(dir)) return true;

  let isEmpty = true;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively clean subdirectories
      // If the subdirectory becomes empty (returns true), we consider this item "gone" for the parent's emptiness check
      const subDirEmpty = cleanDirectory(fullPath);
      if (subDirEmpty) {
        console.log(`[Folder] ${isDryRun ? 'Would delete' : 'Deleting'}: ${fullPath}`);
        if (!isDryRun) {
            try {
                fs.rmdirSync(fullPath);
            } catch (e) {
                console.error(`Failed to remove dir ${fullPath}`, e);
                isEmpty = false;
            }
        }
      } else {
        isEmpty = false;
      }
    } else {
      // It's a file
      if (isPageFile(item) && isEmptyFile(fullPath)) {
        console.log(`[Page]p  ${isDryRun ? 'Would delete' : 'Deleting'}: ${fullPath}`);
        if (!isDryRun) {
            try {
                fs.unlinkSync(fullPath);
            } catch (e) {
                console.error(`Failed to delete file ${fullPath}`, e);
                isEmpty = false; // File remains, so dir is not empty
            }
        }
      } else {
        // Non-empty file or non-page file found, so this directory is not empty
        isEmpty = false;
      }
    }
  }

  return isEmpty;
}

// Start the cleanup
cleanDirectory(targetDir);

console.log('Cleanup finished.');
