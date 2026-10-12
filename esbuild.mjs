import { buildWithEsbuild } from '@tunnelhub/sdk/building';

await buildWithEsbuild({
  workingDir: process.cwd(),
  filesToCopy: [{ from: './patches/**/*', to: './patches' }],
});
