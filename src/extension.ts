import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as child_process from 'child_process';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

const RELEASES_API = 'https://api.github.com/repos/jorgsowa/php-lsp/releases/latest';
const BINARY_NAME = process.platform === 'win32' ? 'php-lsp.exe' : 'php-lsp';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    outputChannel = vscode.window.createOutputChannel('PHP LSP');
    context.subscriptions.push(outputChannel);

    context.subscriptions.push(
        vscode.commands.registerCommand('php-lsp.restart', () => restartServer(context)),
        vscode.commands.registerCommand('php-lsp.showOutput', () => outputChannel.show()),
    );

    await startServer(context);
}

export async function deactivate(): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
    }
}

async function startServer(context: vscode.ExtensionContext): Promise<void> {
    const serverPath = await resolveServerPath(context);
    if (!serverPath) {
        return;
    }

    const serverOptions: ServerOptions = {
        command: serverPath,
        transport: TransportKind.stdio,
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'php' }],
        outputChannel,
        initializationOptions: getInitializationOptions(),
    };

    client = new LanguageClient('php-lsp', 'PHP LSP', serverOptions, clientOptions);

    try {
        await client.start();
        outputChannel.appendLine(`PHP LSP server started (${serverPath})`);
    } catch (err) {
        outputChannel.appendLine(`Failed to start PHP LSP server: ${err}`);
        vscode.window.showErrorMessage(`PHP LSP: Failed to start server. Check the output channel for details.`);
    }
}

async function restartServer(context: vscode.ExtensionContext): Promise<void> {
    if (client) {
        outputChannel.appendLine('Restarting PHP LSP server...');
        await client.stop();
        client = undefined;
    }
    await startServer(context);
}

function getInitializationOptions(): Record<string, unknown> {
    const cfg = vscode.workspace.getConfiguration('php-lsp');
    return {
        phpVersion: cfg.get<string>('phpVersion', '8.3'),
        excludePaths: cfg.get<string[]>('excludePaths', []),
        diagnostics: {
            enabled: cfg.get<boolean>('diagnostics.enabled', true),
            undefinedVariables: cfg.get<boolean>('diagnostics.undefinedVariables', true),
            undefinedFunctions: cfg.get<boolean>('diagnostics.undefinedFunctions', true),
            undefinedClasses: cfg.get<boolean>('diagnostics.undefinedClasses', true),
            arityErrors: cfg.get<boolean>('diagnostics.arityErrors', true),
            typeErrors: cfg.get<boolean>('diagnostics.typeErrors', true),
            deprecatedCalls: cfg.get<boolean>('diagnostics.deprecatedCalls', true),
            duplicateDeclarations: cfg.get<boolean>('diagnostics.duplicateDeclarations', true),
        },
    };
}

async function resolveServerPath(context: vscode.ExtensionContext): Promise<string | undefined> {
    // 1. Explicit user override
    const configured = vscode.workspace.getConfiguration('php-lsp').get<string>('serverPath', '');
    if (configured) {
        if (!fs.existsSync(configured)) {
            vscode.window.showErrorMessage(`PHP LSP: Binary not found at configured path: ${configured}`);
            return undefined;
        }
        return configured;
    }

    // 2. Bundled binary (shipped inside the .vsix)
    const bundled = path.join(context.extensionPath, 'bin', BINARY_NAME);
    if (fs.existsSync(bundled)) {
        return bundled;
    }

    // 3. Binary on PATH (e.g. installed via cargo or brew)
    const onPath = findOnPath();
    if (onPath) {
        return onPath;
    }

    // 4. Previously auto-downloaded binary
    const storedBinary = path.join(context.globalStorageUri.fsPath, BINARY_NAME);
    if (fs.existsSync(storedBinary)) {
        return storedBinary;
    }

    // 5. Offer to download
    const choice = await vscode.window.showInformationMessage(
        'PHP LSP: The php-lsp binary was not found. Would you like to download it automatically?',
        'Download',
        'Set Path Manually',
        'Cancel',
    );

    if (choice === 'Download') {
        return downloadBinary(context);
    } else if (choice === 'Set Path Manually') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'php-lsp.serverPath');
    }

    return undefined;
}

function findOnPath(): string | undefined {
    try {
        const result = child_process.execSync(
            process.platform === 'win32' ? 'where php-lsp' : 'which php-lsp',
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
        ).trim().split('\n')[0].trim();
        if (result && fs.existsSync(result)) {
            return result;
        }
    } catch {
        // not on PATH
    }
    return undefined;
}

async function downloadBinary(context: vscode.ExtensionContext): Promise<string | undefined> {
    return vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'PHP LSP: Downloading server binary...',
            cancellable: false,
        },
        async (progress) => {
            try {
                progress.report({ message: 'Fetching latest release info...' });
                const releaseInfo = await fetchJson(RELEASES_API);
                const assetName = getPlatformAssetName();
                if (!assetName) {
                    vscode.window.showErrorMessage('PHP LSP: Unsupported platform for auto-download. Please install manually.');
                    return undefined;
                }

                const asset = releaseInfo.assets.find((a: { name: string }) => a.name === assetName);
                if (!asset) {
                    vscode.window.showErrorMessage(`PHP LSP: Could not find release asset "${assetName}". Please install manually.`);
                    return undefined;
                }

                progress.report({ message: `Downloading ${assetName}...` });
                const storageDir = context.globalStorageUri.fsPath;
                fs.mkdirSync(storageDir, { recursive: true });

                const archivePath = path.join(storageDir, assetName);
                await downloadFile(asset.browser_download_url, archivePath);

                progress.report({ message: 'Extracting binary...' });
                const binaryPath = path.join(storageDir, BINARY_NAME);
                await extractBinary(archivePath, binaryPath, storageDir);

                if (!fs.existsSync(binaryPath)) {
                    vscode.window.showErrorMessage('PHP LSP: Extraction failed. Please install manually.');
                    return undefined;
                }

                outputChannel.appendLine(`Downloaded php-lsp to ${binaryPath}`);
                vscode.window.showInformationMessage(`PHP LSP: Server downloaded successfully (${releaseInfo.tag_name}).`);
                return binaryPath;
            } catch (err) {
                outputChannel.appendLine(`Download failed: ${err}`);
                vscode.window.showErrorMessage(`PHP LSP: Download failed. Check the output channel for details.`);
                return undefined;
            }
        },
    );
}

function getPlatformAssetName(): string | undefined {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'darwin' && arch === 'arm64') return 'php-lsp-aarch64-apple-darwin.tar.gz';
    if (platform === 'darwin' && arch === 'x64') return 'php-lsp-x86_64-apple-darwin.tar.gz';
    if (platform === 'linux' && arch === 'arm64') return 'php-lsp-aarch64-unknown-linux-gnu.tar.gz';
    if (platform === 'linux' && arch === 'x64') return 'php-lsp-x86_64-unknown-linux-gnu.tar.gz';
    if (platform === 'win32' && arch === 'x64') return 'php-lsp-x86_64-pc-windows-msvc.zip';

    return undefined;
}

async function extractBinary(archivePath: string, binaryPath: string, extractDir: string): Promise<void> {
    if (archivePath.endsWith('.zip')) {
        await runCommand('unzip', ['-o', archivePath, BINARY_NAME, '-d', extractDir]);
    } else {
        await runCommand('tar', ['-xzf', archivePath, '-C', extractDir, BINARY_NAME]);
    }
    if (process.platform !== 'win32' && fs.existsSync(binaryPath)) {
        fs.chmodSync(binaryPath, 0o755);
    }
    try { fs.unlinkSync(archivePath); } catch { /* ignore cleanup errors */ }
}

function runCommand(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const proc = child_process.spawn(cmd, args, { stdio: 'inherit' });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${cmd} exited with code ${code}`));
        });
        proc.on('error', reject);
    });
}

function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const handleResponse = (res: import('http').IncomingMessage) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                https.get(res.headers.location!, handleResponse).on('error', reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => file.close(() => resolve()));
        };
        https.get(url, { headers: { 'User-Agent': 'vscode-php-lsp' } }, handleResponse).on('error', reject);
    });
}

function fetchJson(url: string): Promise<Record<string, unknown> & { assets: Array<{ name: string; browser_download_url: string }>; tag_name: string }> {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'vscode-php-lsp', 'Accept': 'application/vnd.github+json' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}
