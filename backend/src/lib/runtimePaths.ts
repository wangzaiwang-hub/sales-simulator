import fs from 'fs';
import path from 'path';

const existingPath = (candidates: string[]) => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  console.log('Warning: None of the paths exist:', candidates);
  return candidates[0];
};

const cwd = process.cwd();
export const resourceDir = existingPath([
  path.join(cwd, 'resource'),
  path.join(cwd, '../resource'),
  path.join(__dirname, '../../resource'),
  path.resolve('/home/railway/app/resource'),
  path.resolve('/app/resource'),
]);

export const resolveToolFile = (fileName: string) => {
  return existingPath([
    path.join(cwd, fileName),
    path.join(cwd, `../${fileName}`),
    path.resolve(`/home/railway/app/${fileName}`),
    path.resolve(`/app/${fileName}`),
  ]);
};
