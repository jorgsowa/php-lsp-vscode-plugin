#!/usr/bin/env node
/**
 * Downloads the php-lsp binary for the given VS Code target platform and
 * places it at bin/php-lsp (or bin/php-lsp.exe on Windows).
 *
 * Usage:
 *   node scripts/download-binary.mjs --target darwin-arm64
 *   node scripts/download-binary.mjs --target linux-x64
 *   node scripts/download-binary.mjs          # auto-detects current platform
 *
 * The TARGET env variable is also accepted (set automatically by vsce).
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(ROOT, 'bin');
const RELEASES_API = 'https://api.github.com/repos/jorgsowa/php-lsp/releases/latest';

// Map VS Code target → php-lsp release asset name
const ASSET_MAP = {
    'darwin-arm64':  'php-lsp-aarch64-apple-darwin.tar.gz',
    'darwin-x64':    'php-lsp-x86_64-apple-darwin.tar.gz',
    'linux-arm64':   'php-lsp-aarch64-unknown-linux-gnu.tar.gz',
    'linux-x64':     'php-lsp-x86_64-unknown-linux-gnu.tar.gz',
    'win32-x64':     'php-lsp-x86_64-pc-windows-msvc.zip',
};

function detectTarget() {
    const platform = process.platform === 'win32' ? 'win32'
        : process.platform === 'darwin' ? 'darwin'
        : 'linux';
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    return `${platform}-${arch}`;
}

function parseTarget() {
    // 1. --target <value> CLI arg
    const idx = process.argv.indexOf('--target');
    if (idx !== -1 && process.argv[idx + 1]) {
        return process.argv[idx + 1];
    }
    // 2. TARGET env var (set by vsce during packaging)
    if (process.env.TARGET) {
        return process.env.TARGET;
    }
    // 3. Auto-detect
    return detectTarget();
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const opts = { headers: { 'User-Agent': 'vscode-php-lsp', 'Accept': 'application/vnd.github+json' } };
        https.get(url, opts, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchJson(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        }).on('error', reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const get = (u) => {
            https.get(u, { headers: { 'User-Agent': 'vscode-php-lsp' } }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) { get(res.headers.location); return; }
                if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} for ${u}`)); return; }
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
            }).on('error', reject);
        };
        get(url);
    });
}

function extract(archivePath, destDir, binaryName) {
    fs.mkdirSync(destDir, { recursive: true });
    if (archivePath.endsWith('.zip')) {
        const r = spawnSync('unzip', ['-o', archivePath, binaryName, '-d', destDir], { stdio: 'inherit' });
        if (r.status !== 0) { throw new Error('unzip failed'); }
    } else {
        const r = spawnSync('tar', ['-xzf', archivePath, '-C', destDir, binaryName], { stdio: 'inherit' });
        if (r.status !== 0) { throw new Error('tar failed'); }
    }
}

async function main() {
    const target = parseTarget();
    const assetName = ASSET_MAP[target];

    if (!assetName) {
        console.error(`Unsupported target: ${target}`);
        console.error(`Supported targets: ${Object.keys(ASSET_MAP).join(', ')}`);
        process.exit(1);
    }

    const binaryName = target.startsWith('win32') ? 'php-lsp.exe' : 'php-lsp';
    const destPath = path.join(BIN_DIR, binaryName);

    console.log(`Target: ${target}`);
    console.log(`Asset:  ${assetName}`);

    console.log('Fetching latest release info...');
    const release = await fetchJson(RELEASES_API);
    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset) {
        console.error(`Asset "${assetName}" not found in release ${release.tag_name}`);
        process.exit(1);
    }

    console.log(`Downloading ${assetName} (${release.tag_name})...`);
    fs.mkdirSync(BIN_DIR, { recursive: true });
    const archivePath = path.join(BIN_DIR, assetName);
    await downloadFile(asset.browser_download_url, archivePath);

    console.log('Extracting binary...');
    extract(archivePath, BIN_DIR, binaryName);
    fs.unlinkSync(archivePath);

    if (!fs.existsSync(destPath)) {
        console.error(`Binary not found at ${destPath} after extraction`);
        process.exit(1);
    }

    if (!target.startsWith('win32')) {
        fs.chmodSync(destPath, 0o755);
    }

    console.log(`Binary ready: ${destPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
