const glob = require('glob');
const zip = require('@tybys/cross-zip');
const path = require('path');
const esbuildCopy = require('esbuild-plugin-copy');
const pkg = require('./package.json');
const yaml = require('js-yaml');
const fs = require('fs');

const tunnelhubYml = fs.readFileSync('./tunnelhub.yml').toString('utf8');
const tunnelhubConfig = yaml.load(tunnelhubYml);

let externals = undefined;
if (tunnelhubConfig.configuration.runtimeEngine === 'ECS_FARGATE') {
    externals = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
}

const targetNodeVersion = 'node24';

require('esbuild').build({
    entryPoints: glob.sync('./src/**/*.ts'),
    bundle: true,
    minify: true,
    platform: 'node',
    target: targetNodeVersion,
    sourcemap: true,
    external: externals,
    outdir: './build',
    plugins: [
        esbuildCopy.copy({
            assets: {
                from: [
                    './tunnelhub.yml',
                    './package.json',
                    './Dockerfile',
                    './pnpm-lock.yaml',
                    './pnpm-workspace.yaml',
                ],
                to: [''],
            },
        }),
    ],
}).then(result => {
    if (result.errors.length === 0) {
        const inPath = path.join(__dirname, 'build/');
        const outPath = path.join(__dirname, 'dist', 'artifact.zip');

        if (!fs.existsSync(path.join(__dirname, 'dist'))) {
            fs.mkdirSync(path.join(__dirname, 'dist'));
        }

        fs.cpSync(path.join(__dirname, 'patches'), path.join(inPath, 'patches'), {recursive: true});
        zip.zipSync(inPath, outPath, false);
    }
}).catch(() => process.exit(1));