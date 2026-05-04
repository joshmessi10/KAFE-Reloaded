const vscode = require('vscode');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('KAFE extension (Marketplace Version) is now active!');

    const getWorkspaceRoot = () => {
        return vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : null;
    };

    // Command to install dependencies (pip)
    let installDeps = vscode.commands.registerCommand('kafe.installDependencies', function () {
        const requirementsPath = context.asAbsolutePath(path.join('bin', 'interpreter', 'requirements.txt'));
        const terminal = vscode.window.createTerminal('KAFE Setup');
        terminal.show();
        
        // Use pip3 on Mac/Linux, pip on Windows
        const pipCmd = process.platform === 'win32' ? 'pip' : 'pip3';
        
        terminal.sendText(`${pipCmd} install -r "${requirementsPath}"`);
        vscode.window.showInformationMessage('Instalando dependencias de Python para KAFE...');
    });

    // Command to run the current file (The Friendly Way)
    let runFile = vscode.commands.registerCommand('kafe.runFile', function () {
        const activeEditor = vscode.window.activeTextEditor;

        if (activeEditor) {
            const filePath = activeEditor.document.fileName;
            const interpreterPath = context.asAbsolutePath(path.join('bin', 'interpreter', 'Kafe.py'));
            const interpreterDir = path.dirname(interpreterPath);
            
            // Detect platform
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
            
            // PROFESSIONAL WAY: Create terminal with environment variables already set
            // This is shell-agnostic (Works in CMD, PowerShell, Bash, etc.)
            const terminal = vscode.window.createTerminal({
                name: 'KAFE Execution',
                env: {
                    "PYTHONPATH": interpreterDir
                }
            });

            terminal.show();
            // Now the command is super simple and won't fail with '&&' errors
            terminal.sendText(`${pythonCmd} "${interpreterPath}" "${filePath}"`);
        } else {
            vscode.window.showErrorMessage('Abre un archivo .kf para ejecutarlo.');
        }
    });

    context.subscriptions.push(installDeps, runFile);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
