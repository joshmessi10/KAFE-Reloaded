const fs = require('node:fs');
const path = require('node:path');
const { startKafeFile } = require('./src/kafeRunner');
const { createRuntimeManager } = require('./src/runtimeManager');
const { TutorViewProvider } = require('./src/tutor/TutorViewProvider');
const { DeepSeekProvider, SECRET_KEY } = require('./src/tutor/providers/DeepSeekProvider');
const { SessionCoordinator } = require('./src/tutor/SessionCoordinator');
const { ContextComposer } = require('./src/tutor/ContextComposer');
const { KnowledgeRetriever } = require('./src/tutor/KnowledgeRetriever');
const { DevelopmentKnowledgePack } = require('./src/tutor/DevelopmentKnowledgePack');
const { ToolRouter } = require('./src/tutor/ToolRouter');
const { ProgressStore } = require('./src/tutor/ProgressStore');
const { CodeProposalProvider } = require('./src/tutor/CodeProposalProvider');

const ANTLR_COMMAND = 'java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4';
const REQUIRED_PARSER = ['Kafe_GrammarLexer.py', 'Kafe_GrammarParser.py', 'Kafe_GrammarVisitor.py'];

function createProviderKeyHandlers({ vscode, secrets }) {
  return {
    async configure() {
      const key = await vscode.window.showInputBox({ title: 'KAFE: Configure Provider Key',
        prompt: 'Enter your DeepSeek API key', password: true, ignoreFocusOut: true });
      if (!key?.trim()) return;
      await secrets.store(SECRET_KEY, key.trim());
      await vscode.window.showInformationMessage('DeepSeek API key saved in VS Code SecretStorage.');
    },
    async clear() {
      await secrets.delete(SECRET_KEY);
      await vscode.window.showInformationMessage('DeepSeek API key removed from VS Code SecretStorage.');
    },
  };
}

function createClearProgressHandler({ coordinator, tutorView }) {
  return async () => {
    const result = await coordinator.handleLearnerMessage({ type: 'clearProgress' });
    tutorView.render(coordinator.state);
    return result;
  };
}

function createTutorHost({ vscode, extensionUri, secrets, workspaceState, runtimeManager,
  extensionMode, extensionPath, provider = new DeepSeekProvider({ secretStorage: secrets }) }) {
  const documentReader = { async readDocument(uri) {
    const document = await vscode.workspace.openTextDocument(uri);
    return { uri: document.uri, text: document.getText(), version: document.version };
  } };
  const pinnedRuntime = runtimeManager.manifest?.runtime;
  const developmentKnowledgePack = extensionMode !== undefined && extensionMode === vscode.ExtensionMode?.Development ?
    new DevelopmentKnowledgePack({ extensionPath, storageRoot: runtimeManager.storageRoot,
      runtimeVersion: pinnedRuntime?.version, knowledgePackVersion: pinnedRuntime?.knowledgePackVersion,
      sourceRevision: pinnedRuntime?.sourceRevision }) : undefined;
  const retrieveFromReadyPack = async (ready, sourceMode, query, relatedContext) => {
    if (!ready.runtimeVersion || !ready.knowledgePackVersion ||
      ready.runtimeVersion !== ready.knowledgePackVersion ||
      (pinnedRuntime?.version && ready.runtimeVersion !== pinnedRuntime.version) ||
      (pinnedRuntime?.knowledgePackVersion && ready.knowledgePackVersion !== pinnedRuntime.knowledgePackVersion)) {
      throw new Error('KAFE runtime and knowledge-pack versions are missing or mismatched.');
    }
    const knowledgeRoot = ready.knowledgeRoot || path.join(ready.runtimeRoot, 'knowledge-pack');
    const passages = await new KnowledgeRetriever({ knowledgeRoot,
      runtimeVersion: ready.runtimeVersion, knowledgePackVersion: ready.knowledgePackVersion,
      expectedRuntimeVersion: pinnedRuntime?.version || ready.runtimeVersion,
      expectedKnowledgePackVersion: pinnedRuntime?.knowledgePackVersion || ready.knowledgePackVersion,
      expectedContentSha256: sourceMode === 'development' ? ready.contentSha256 : undefined,
      expectedFileCount: sourceMode === 'development' ? ready.fileCount : undefined }).search(query, relatedContext);
    return passages.map(passage => ({ ...passage, sourceMode, runtimeVersion: ready.runtimeVersion,
      knowledgePackVersion: ready.knowledgePackVersion }));
  };
  const knowledgeRetriever = { async search(query, relatedContext) {
    const ready = await runtimeManager.getReadyRuntime();
    if (ready.status === 'ready') {
      if (ready.runtimeMode !== 'managed') throw new Error('A managed KAFE knowledge pack is required for tutor context.');
      return retrieveFromReadyPack(ready, 'managed', query, relatedContext);
    }
    if (developmentKnowledgePack) {
      const developmentReady = await developmentKnowledgePack.getReadyPack();
      return retrieveFromReadyPack(developmentReady, 'development', query, relatedContext);
    }
    throw new Error('A managed KAFE knowledge pack is required for tutor context.');
  } };
  const proposalProvider = new CodeProposalProvider({ vscode });
  const coordinator = new SessionCoordinator({ provider,
    progressStore: workspaceState ? new ProgressStore({ workspaceState }) : undefined,
    proposalProvider,
    contextComposer: new ContextComposer({ documentReader, knowledgeRetriever }),
    toolRouter: new ToolRouter({ documentReader, knowledgeRetriever }),
    getContext: () => {
      const document = vscode.window.activeTextEditor?.document;
      const activeUri = document?.uri;
      const activeFolder = activeUri?.scheme === 'file' ? vscode.workspace.getWorkspaceFolder?.(activeUri) : undefined;
      const selectedUris = [];
      const seen = new Set(activeUri && typeof activeUri.toString === 'function' ? [activeUri.toString()] : []);
      if (activeFolder?.uri && typeof activeFolder.uri.toString === 'function') {
        for (const editor of vscode.window.visibleTextEditors || []) {
          const candidate = editor?.document;
          const uri = candidate?.uri;
          if (candidate?.languageId !== 'kafe' || uri?.scheme !== 'file' ||
            typeof uri.toString !== 'function' || !uri.toString().toLowerCase().endsWith('.kf') ||
            seen.has(uri.toString()) ||
            vscode.workspace.getWorkspaceFolder?.(uri)?.uri?.toString() !== activeFolder.uri.toString()) continue;
          selectedUris.push(uri);
          seen.add(uri.toString());
        }
      }
      return { activeDocument: document?.languageId === 'kafe' && document.uri?.scheme === 'file' ?
        { uri: document.uri, text: document.getText(), version: document.version } : undefined,
      selectedUris };
    },
  });
  coordinator.restoreProgress();
  const tutorView = new TutorViewProvider({ vscode, extensionUri, getState: () => coordinator.state, onMessage: async message => {
    try {
      const turn = await coordinator.handleLearnerMessage(message);
      const feedback = turn?.text || '';
      if (message.type === 'confirmMilestones') {
        coordinator.state.milestoneStatus = feedback;
        coordinator.state.interactionStatus = '';
      } else {
        const shownInConversation = (message.type === 'sendMessage' && message.phase === undefined) ||
          (message.type === 'retryMessage' && turn?.kind !== 'error');
        coordinator.state.interactionStatus = turn?.kind === 'error' || !shownInConversation ? feedback : '';
      }
    } catch {
      const feedback = 'The tutor could not complete the request. Please review the context and try again.';
      if (message.type === 'confirmMilestones') coordinator.state.milestoneStatus = feedback;
      else coordinator.state.interactionStatus = feedback;
    }
    tutorView.render(coordinator.state);
  } });
  return { tutorView, coordinator, proposalProvider };
}

function createRunFileHandler({ vscode, runtimeManager, fs: fileSystem = fs, path: paths = path,
  startKafeFile: run = startKafeFile, onRunResult = () => {} }) {
  let runSequence = 0;
  return async function runFile() {
    const editor = vscode.window.activeTextEditor;
    if (!vscode.workspace.isTrusted) {
      await vscode.window.showErrorMessage('Trust this workspace before running KAFE code.');
      return;
    }
    if (!editor || editor.document.languageId !== 'kafe' ||
      !editor.document.uri.fsPath.toLowerCase().endsWith('.kf')) {
      await vscode.window.showInformationMessage('Open a KAFE .kf file to run it.');
      return;
    }
    const document = editor.document;
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!folder) {
      await vscode.window.showErrorMessage('Open this KAFE file inside a workspace folder before running it.');
      return;
    }
    if (document.isDirty) {
      const choice = await vscode.window.showWarningMessage('Save this KAFE file before running it?', 'Save', 'Cancel');
      if (choice !== 'Save') return;
      if (!await document.save() || document.isDirty) {
        await vscode.window.showErrorMessage('The KAFE file was not saved. Run cancelled.');
        return;
      }
    }
    let runtime;
    try {
      runtime = await runtimeManager.resolveWorkspace(folder.uri.fsPath);
    } catch (error) {
      await vscode.window.showErrorMessage(`Unable to resolve the KAFE runtime: ${error.message}`);
      return;
    }
    if (runtime.status !== 'ready') {
      await vscode.window.showInformationMessage(runtime.message ?? 'The KAFE runtime is not ready. Run KAFE: Install Runtime after the pinned release is published.');
      return;
    }
    const runtimeRoot = runtime.runtimeRoot;
    const missingParser = REQUIRED_PARSER.filter(name => !fileSystem.existsSync(paths.join(runtimeRoot, 'src', name)));
    if (missingParser.length) {
      await vscode.window.showErrorMessage(`Missing generated parser files: ${missingParser.join(', ')}. From src/, run: ${ANTLR_COMMAND}`);
      return;
    }

    const onDidWrite = new vscode.EventEmitter();
    const onDidClose = new vscode.EventEmitter();
    let activeRun;
    let terminalClosed = false;
    let startedSequence;
    const pty = {
      onDidWrite: onDidWrite.event,
      onDidClose: onDidClose.event,
      open() {
        if (terminalClosed || activeRun) return;
        const write = text => onDidWrite.fire(text.replace(/\r?\n/g, '\r\n'));
        if (!vscode.workspace.isTrusted) {
          write('[Trust this workspace before running KAFE code.]\n');
          onDidClose.fire();
          terminalClosed = true;
          return;
        }
        try {
          startedSequence = ++runSequence;
          activeRun = run({
            filePath: document.uri.fsPath,
            runtimeRoot,
            runtimeMode: runtime.runtimeMode,
            uvPath: runtime.uvPath,
            env: runtime.uvEnvironment,
            onStdout: write, onStderr: write,
          });
          activeRun.completion.then(result => {
            if (terminalClosed) return;
            onRunResult({ ...result, runtimeMode: runtime.runtimeMode,
              runtimeVersion: runtime.runtimeMode === 'contributor' ? null : runtime.runtimeVersion,
              knowledgePackVersion: runtime.runtimeMode === 'contributor' ? null : runtime.knowledgePackVersion,
              sourceUri: document.uri.toString(), runSequence: startedSequence });
            if (result.outputTruncated) write('\n[Output evidence truncated at 1 MiB; terminal output was streamed in full.]\n');
            write(`\n[KAFE exited with code ${result.exitCode === null ? 'unknown' : result.exitCode}.]\n`);
            onDidClose.fire(result.exitCode === null ? undefined : result.exitCode);
            terminalClosed = true;
          }).catch(error => {
            write(`\n[KAFE run failed: ${error.message}]\n`);
            onDidClose.fire();
            terminalClosed = true;
          });
        } catch (error) {
          write(`\n[Unable to start KAFE: ${error.message}]\n`);
          onDidClose.fire();
          terminalClosed = true;
        }
      },
      handleInput(data) { if (activeRun) activeRun.sendInput(data.replace(/\r/g, '\n')); },
      close() {
        terminalClosed = true;
        if (activeRun) activeRun.cancel();
        onDidWrite.dispose();
        onDidClose.dispose();
      },
    };
    const terminal = vscode.window.createTerminal({ name: 'KAFE Run', pty });
    terminal.show();
  };
}

function activate(context) {
  const vscode = require('vscode');
  const runtimeManager = createRuntimeManager({
    storageRoot: context.globalStorageUri.fsPath,
    confirmDownload: async ({ runtimeVersion, uvVersion }) => {
      const selected = await vscode.window.showWarningMessage(
        `Download the pinned KAFE ${runtimeVersion} runtime and uv ${uvVersion} into this VS Code profile?`,
        { modal: true },
        'Download',
      );
      return selected === 'Download';
    },
  });
  const { tutorView, coordinator, proposalProvider } = createTutorHost({ vscode, extensionUri: context.extensionUri,
    secrets: context.secrets, workspaceState: context.workspaceState, runtimeManager,
    extensionMode: context.extensionMode, extensionPath: context.extensionPath });
  const keyHandlers = createProviderKeyHandlers({ vscode, secrets: context.secrets });
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('kafeTutorView', tutorView),
    vscode.workspace.registerTextDocumentContentProvider('kafe-proposal', proposalProvider),
    vscode.commands.registerCommand('kafe.runFile', createRunFileHandler({ vscode, runtimeManager,
      onRunResult: result => { coordinator.recordRunResult(result); tutorView.render(coordinator.state); } })),
    vscode.commands.registerCommand('kafe.installRuntime', async () => {
      if (!vscode.workspace.isTrusted) {
        const message = 'Trust this workspace before installing the KAFE runtime.';
        await vscode.window.showErrorMessage(message);
        return { status: 'blocked', message };
      }
      const result = await runtimeManager.installRuntime();
      if (result.status === 'ready') {
        await vscode.window.showInformationMessage(`KAFE runtime ${result.runtimeVersion} is ready.`);
      } else if (result.status !== 'cancelled') {
        const show = result.status === 'unavailable' ? vscode.window.showInformationMessage : vscode.window.showErrorMessage;
        await show(result.message);
      }
      return result;
    }),
    vscode.commands.registerCommand('kafe.openTutor', () =>
      vscode.commands.executeCommand('workbench.view.extension.kafeTutor')),
    vscode.commands.registerCommand('kafe.configureProvider', keyHandlers.configure),
    vscode.commands.registerCommand('kafe.clearProviderKey', keyHandlers.clear),
    vscode.commands.registerCommand('kafe.clearTutorProgress', createClearProgressHandler({ coordinator, tutorView })),
  );
}

function deactivate() {}

module.exports = { activate, deactivate, createRunFileHandler, createProviderKeyHandlers,
  createClearProgressHandler, createTutorHost, ANTLR_COMMAND };
