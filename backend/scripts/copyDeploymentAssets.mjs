import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(process.cwd(), '..');
const backendRoot = process.cwd();

const copyTargets = [
  ['backend/tileset-editor.html', 'tileset-editor.html'],
  ['backend/map-editor.html', 'map-editor.html'],
  ['backend/map-test.html', 'map-test.html'],
  ['character-editor.html', 'character-editor.html'],
  ['character-customizer.html', 'character-customizer.html'],
  ['character-creator.html', 'character-creator.html'],
  ['test-character-assets.html', 'test-character-assets.html'],
  ['test-assets.html', 'test-assets.html'],
];

for (const [sourceRelativePath, targetRelativePath] of copyTargets) {
  const targetPath = path.join(backendRoot, targetRelativePath);
  
  // 如果目标已经存在，跳过
  if (fs.existsSync(targetPath)) {
    console.log(`Skipping ${targetRelativePath} (already exists)`);
    continue;
  }
  
  const sourcePath = path.join(projectRoot, sourceRelativePath);

  if (!fs.existsSync(sourcePath)) {
    console.log(`Skipping ${sourceRelativePath} (source not found)`);
    continue;
  }

  fs.cpSync(sourcePath, targetPath, {
    force: true,
    recursive: true,
  });
  
  console.log(`Copied ${sourceRelativePath} to ${targetRelativePath}`);
}

console.log('Prepared deployment assets for Railway.');
