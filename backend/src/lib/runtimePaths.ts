import fs from 'fs';
import path from 'path';

const existingPath = (candidates: string[]) => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
};

export const resourceDir = existingPath([
  path.resolve(process.cwd(), 'resource'),
  path.resolve(process.cwd(), '../resource'),
]);

export const resolveToolFile = (fileName: string) => {
  return existingPath([
    path.resolve(process.cwd(), fileName),
    path.resolve(process.cwd(), `../${fileName}`),
  ]);
};
