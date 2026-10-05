const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const { startKafeFile } = require('./src/kafeRunner');
const { createRuntimeManager } = require('./src/runtimeManager');
const { TutorViewProvider } = require('./src/tutor/TutorViewProvider');
const { DeepSeekProvider, SECRET_KEY } = require('./src/tutor/providers/DeepSeekProvider');
const { SessionCoordinator } = require('./src/tutor/SessionCoordinator');
const { ContextComposer } = require('./src/tutor/ContextComposer');
const { LearningSession } = require('./src/tutor/LearningSession');
const { KnowledgeRetriever, KnowledgeUnavailable, KnowledgeIntegrityError } = require('./src/tutor/KnowledgeRetriever');
const { DevelopmentKnowledgePack } = require('./src/tutor/DevelopmentKnowledgePack');
const { ToolRouter } = require('./src/tutor/ToolRouter');
const { ProgressStore } = require('./src/tutor/ProgressStore');
const { CodeProposalProvider } = require('./src/tutor/CodeProposalProvider');
const { TutorHostActions } = require('./src/tutor/TutorHostActions');
const { isTutorMessage } = require('./src/tutor/TutorViewProvider');
const { metadataLineage } = require('./src/tutor/ToolRouter');
const { createTutorDiagnostics } = require('./src/tutor/TutorDiagnostics');
const { savedSourceHash } = require('./src/tutor/ActionEvidence');

const ANTLR_COMMAND = 'java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4';
const REQUIRED_PARSER = ['Kafe_GrammarLexer.py', 'Kafe_GrammarParser.py', 'Kafe_GrammarVisitor.py'];

function createProviderKeyHandlers({ vscode, secrets }) {
  return {
    async configure() {
      const key = await vscode.window.showInputBox({ title: 'KAFE: Configure Provider Key',
        prompt: 'Enter your DeepSeek API key', password: true, ignoreFocusOut: true });
      if (!key?.trim()) return { status: 'cancelled' };
      try { await secrets.store(SECRET_KEY, key.trim()); }
      catch { return { status: 'failed', code: 'credential_store_failed' }; }
      await vscode.window.showInformationMessage('DeepSeek API key saved in VS Code SecretStorage.');
      return { status: 'completed' };
    },
    async clear() {
      await secrets.delete(SECRET_KEY);
      await vscode.window.showInformationMessage('DeepSeek API key removed from VS Code SecretStorage.');
    },
  };
}

function createClearProgressHandler({ vscode, progressStore }) {
  let pending;
  return () => {
    if (pending) return pending;
    pending = (async () => {
      try {
        const choice = await vscode.window.showWarningMessage('Clear legacy KAFE Tutor progress records?',
          { modal: true }, 'Clear legacy progress');
        if (choice !== 'Clear legacy progress') return { status: 'cancelled' };
        await progressStore?.clear(); return { status: progressStore ? 'completed' : 'unavailable' };
      } catch { return { status: 'failed', code: 'legacy_clear_failed' }; }
    })().finally(() => { pending = undefined; });
    return pending;
  };
}

function createTutorHost({ vscode, extensionUri, secrets, workspaceState, runtimeManager,
  extensionMode, extensionPath, provider = new DeepSeekProvider({ secretStorage: secrets }),
  runFile: injectedRunFile, configureProvider: injectedConfigure, getReadiness: injectedReadiness }) {
  const diagnostics = createTutorDiagnostics(vscode.window);
  const safeError = code => Object.assign(new Error(code === 'trust_unavailable' ? 'Trusted workspace context is unavailable.' : 'KAFE knowledge is unavailable.'), { code });
  const parseUri = uri => typeof uri === 'string' ? vscode.Uri.parse(uri) : uri;
  let sourceRevision = 0;
  let hostDisposed = false;
  const unavailableSources = new Set();
  const advanceSource = () => { sourceRevision++; };
  const folderId = folder => folder?.uri?.toString?.() || folder?.uri?.fsPath;
  const authorize = uri => {
    try {
      uri = parseUri(uri);
      if (unavailableSources.has(uri?.toString?.()) || !vscode.workspace.isTrusted || uri?.scheme !== 'file' || typeof uri.fsPath !== 'string' || path.extname(uri.fsPath).toLowerCase() !== '.kf') return false;
      const folder = vscode.workspace.getWorkspaceFolder?.(uri);
      if (!folder?.uri?.fsPath) return false;
      const relative = path.relative(folder.uri.fsPath, uri.fsPath);
      if (!relative || path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) return false;
      const active = vscode.window.activeTextEditor?.document;
      const activeFolder = active?.uri?.scheme === 'file' ? vscode.workspace.getWorkspaceFolder?.(active.uri) : null;
      return !activeFolder || folderId(activeFolder) === folderId(folder);
    } catch { return false; }
  };
  const documentReader = {
    validateUri: uri => authorize(uri),
    readSavedIdentity: uri => authorize(uri) ? savedSourceHash(fs, parseUri(uri).fsPath) : null,
    displayLabel: uri => {
      const target = parseUri(uri), folder = vscode.workspace.getWorkspaceFolder?.(target);
      if (!folder?.uri?.fsPath) return target.toString();
      const relative = path.relative(folder.uri.fsPath, target.fsPath).split(path.sep).join('/');
      if (!relative || relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)) return target.toString();
      return (vscode.workspace.workspaceFolders?.length > 1 ? `${folder.name || path.basename(folder.uri.fsPath)}/` : '') + relative;
    },
    async readDocument(uri) {
      if (!authorize(uri)) throw safeError('trust_unavailable');
      const document = await vscode.workspace.openTextDocument(parseUri(uri));
      if (!authorize(document.uri) || document.uri.toString() !== uri.toString() || document.languageId !== 'kafe') throw safeError('trust_unavailable');
      return { uri: document.uri, text: document.getText(), version: document.version };
    },
  };
  const pinnedRuntime = runtimeManager.manifest?.runtime;
  const developmentKnowledgePack = extensionMode !== undefined && extensionMode === vscode.ExtensionMode?.Development ?
    new DevelopmentKnowledgePack({ extensionPath, storageRoot: runtimeManager.storageRoot,
      runtimeVersion: pinnedRuntime?.version, knowledgePackVersion: pinnedRuntime?.knowledgePackVersion,
      sourceRevision: pinnedRuntime?.sourceRevision }) : undefined;
  /** @returns {Promise<{status:'ready',metadata:object}|{status:'unavailable',code:string}>} */
  const resolveKnowledge = async () => {
    if (!vscode.workspace.isTrusted) return { status: 'unavailable', code: 'trust_unavailable' };
    let ready;
    try { ready = await runtimeManager.getReadyKnowledgePack?.(); }
    catch { return { status: 'unavailable', code: 'knowledge_integrity_failed' }; }
    let sourceMode = 'managed';
    if (ready?.status !== 'ready') {
      if (!developmentKnowledgePack) return { status: 'unavailable', code: ready?.code || 'knowledge_missing' };
      try { ready = await developmentKnowledgePack.getReadyPack(); }
      catch { return { status: 'unavailable', code: 'knowledge_unavailable' }; }
      sourceMode = 'development';
    }
    if (!vscode.workspace.isTrusted) return { status: 'unavailable', code: 'trust_unavailable' };
    if (!ready.runtimeVersion || ready.runtimeVersion !== ready.knowledgePackVersion ||
      (pinnedRuntime?.version && ready.runtimeVersion !== pinnedRuntime.version) ||
      (pinnedRuntime?.knowledgePackVersion && ready.knowledgePackVersion !== pinnedRuntime.knowledgePackVersion)) {
      return { status: 'unavailable', code: 'knowledge_integrity_failed' };
    }
    const knowledgeRoot = ready.knowledgeRoot || path.join(ready.runtimeRoot, 'knowledge-pack');
    const metadata = { sourceMode, runtimeVersion: ready.runtimeVersion, knowledgePackVersion: ready.knowledgePackVersion,
      knowledgeRoot, packIdentity: ready.packIdentity || knowledgeRoot,
      expectedContentSha256: sourceMode === 'development' ? ready.contentSha256 : ready.expectedContentSha256,
      expectedFileCount: sourceMode === 'development' ? ready.fileCount : ready.expectedFileCount,
      ...(sourceMode === 'managed' ? { archiveSha256: pinnedRuntime?.archiveSha256 } : {}) };
    if (!/^[a-f0-9]{64}$/.test(metadata.expectedContentSha256 || '') ||
      !Number.isSafeInteger(metadata.expectedFileCount) || metadata.expectedFileCount < 1) {
      return { status: 'unavailable', code: 'knowledge_integrity_failed' };
    }
    // The pack owner proves actual current filesystem/configuration inputs synchronously.
    // Cached async metadata alone cannot authorize a native edit after an awaited read.
    const capturedRuntime = structuredClone(runtimeManager.manifest?.runtime);
    const authority = ready.authority && typeof ready.authority.isCurrent === 'function' ? Object.freeze({ isCurrent: () =>
      !hostDisposed && vscode.workspace.isTrusted === true && isDeepStrictEqual(runtimeManager.manifest?.runtime, capturedRuntime) && ready.authority.isCurrent() === true }) : null;
    return { status: 'ready', metadata, authority };
  };
  const knowledgeRetriever = {
    async getKnowledgeLineage() {
      const availability = await resolveKnowledge();
      return availability.status === 'ready' ? metadataLineage(availability.metadata) : null;
    },
    async search(query, relatedContext) {
      const captured = await resolveKnowledge();
      if (captured.status !== 'ready') throw new KnowledgeUnavailable(captured.code);
      const { metadata } = captured;
      let passages;
      try {
        passages = await new KnowledgeRetriever({ knowledgeRoot: metadata.knowledgeRoot,
          runtimeVersion: metadata.runtimeVersion, knowledgePackVersion: metadata.knowledgePackVersion,
          expectedRuntimeVersion: pinnedRuntime?.version || metadata.runtimeVersion,
          expectedKnowledgePackVersion: pinnedRuntime?.knowledgePackVersion || metadata.knowledgePackVersion,
          expectedContentSha256: metadata.expectedContentSha256,
          expectedFileCount: metadata.expectedFileCount }).search(query, relatedContext);
      } catch (error) {
        if (error instanceof KnowledgeIntegrityError ||
          ['ENOENT', 'ENOTDIR', 'EACCES', 'EPERM', 'ELOOP', 'ESTALE', 'EIO'].includes(error?.code)) {
          throw new KnowledgeUnavailable('knowledge_integrity_failed');
        }
        throw error;
      }
      const after = await resolveKnowledge();
      if (after.status !== 'ready' || metadataLineage(after.metadata) !== metadataLineage(metadata)) {
        throw new KnowledgeUnavailable(after.status === 'ready' ? 'knowledge_integrity_failed' : after.code);
      }
      return passages.map(passage => ({ ...passage, ...metadata }));
    },
  };
  const proposalProvider = new CodeProposalProvider({ vscode, authorizeUri: authorize });
  const progressStore = workspaceState ? new ProgressStore({ workspaceState }) : undefined;
  const getContext = () => {
    if (!vscode.workspace.isTrusted) return { restricted: true, candidateUris: [] };
    const document = vscode.window.activeTextEditor?.document;
    const activeDocument = document?.languageId === 'kafe' && authorize(document.uri) ?
      { uri: document.uri, text: document.getText(), version: document.version } : undefined;
    const candidateUris = [];
    const seen = new Set(activeDocument ? [activeDocument.uri.toString()] : []);
    for (const editor of vscode.window.visibleTextEditors || []) {
      const candidate = editor.document;
      if (!activeDocument || candidate?.languageId !== 'kafe' || !authorize(candidate.uri) || seen.has(candidate.uri.toString())) continue;
      candidateUris.push(candidate.uri); seen.add(candidate.uri.toString());
    }
    return { restricted: false, activeDocument, candidateUris };
  };
  const coordinator = new SessionCoordinator({ provider, proposalProvider, learningSession: new LearningSession(), getKnowledgeAvailability: resolveKnowledge, getSourceRevision: () => getSourceRevision(),
    diagnostic: record => diagnostics.record(record),
    contextComposer: new ContextComposer({ documentReader, knowledgeRetriever }),
    toolRouter: new ToolRouter({ documentReader, knowledgeRetriever }), getContext,
    getWorkspaceRelativeSourcePath: sourceUri => {
      try {
        const uri = parseUri(sourceUri);
        if (uri.scheme !== 'file' || path.extname(uri.fsPath).toLowerCase() !== '.kf') return null;
        const folder = vscode.workspace.getWorkspaceFolder?.(uri);
        if (!folder?.uri?.fsPath) return null;
        const relative = path.relative(folder.uri.fsPath, uri.fsPath);
        return relative && !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`) ? relative.split(path.sep).join('/') : null;
      } catch { return null; }
    },
  });
  let actions;
  const runFile = injectedRunFile || createRunFileHandler({ vscode, runtimeManager,
    getRunOwner: ({ sourceUri }) => actions.captureRunOwner(sourceUri),
    onRunState: event => actions.recordRunState(event), onRunResult: result => actions.recordRunResult(result) });
  const keyHandlers = createProviderKeyHandlers({ vscode, secrets });
  const getReadiness = injectedReadiness || (async () => {
    const keyPresent = Boolean(await secrets.get?.(SECRET_KEY));
    let knowledgeReady = false;
    if (vscode.workspace.isTrusted) knowledgeReady = (await resolveKnowledge()).status === 'ready';
    let runtimeStatus = runtimeManager.manifest?.runtime?.releasePublished === false ? 'unavailable' : 'missing';
    if (vscode.workspace.isTrusted) {
      try {
        const runtime = await runtimeManager.getReadyRuntime?.();
        if (runtime?.status === 'ready') runtimeStatus = 'ready';
        else if (runtime?.status === 'missing') runtimeStatus = 'missing';
        else if (['unsupported', 'unavailable'].includes(runtime?.status)) runtimeStatus = 'unavailable';
      } catch { /* unavailable runtime metadata cannot claim execution readiness */ }
    }
    const document = vscode.window.activeTextEditor?.document;
    return { keyPresent, trusted: vscode.workspace.isTrusted === true, knowledgeReady,
      runtimeStatus,
      ...(document?.languageId === 'kafe' && authorize(document.uri) ? { targetUri: document.uri.toString(), targetLabel: documentReader.displayLabel(document.uri) } : {}) };
  });
  actions = new TutorHostActions({ session: coordinator.session, controller: coordinator.controller, coordinator,
    proposalProvider, runtimeManager, configureProvider: injectedConfigure || keyHandlers.configure,
    runFile, getReadiness, authorizeRunTarget: authorize });
  // Native choices only: the webview can open this route but supplies no preference patch.
  const openLearningPreferences = async () => {
    const { sessionId, generation } = coordinator.snapshot();
    const current = () => !hostDisposed && coordinator.snapshot().sessionId === sessionId && coordinator.snapshot().generation === generation;
    const labels = { mode: 'Guided learning', frequency: 'Decision frequency', reasoningStyle: 'Reasoning style', codingPreference: 'Code preparation', familiarity: 'Self-reported familiarity' };
    const choices = { mode: [['guided', 'Guided learning'], ['paused', 'Pause teaching']], frequency: [['light', 'Light'], ['normal', 'Normal'], ['frequent', 'Frequent']], reasoningStyle: [['open-ended', 'Open-ended'], ['multiple-choice', 'Multiple choice'], ['mixed', 'Mixed']], codingPreference: [['ai', 'AI prepares agreed code'], ['mixed', 'Mixed preparation'], ['hands-on', 'Learner prepares code']], familiarity: [['unknown', 'Unknown'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']] };
    const preferences = coordinator.learningSession.snapshot().preferences;
    const section = await vscode.window.showQuickPick(Object.entries(labels).map(([key, label]) => ({ key, label, description: preferences[key] })), { title: 'KAFE learning preferences', placeHolder: 'Memory-only preferences; changes during a response take effect after it settles.' });
    if (!current()) return { status: 'stale' };
    if (!section || !Object.hasOwn(choices, section.key)) return { status: 'cancelled' };
    const picked = await vscode.window.showQuickPick(choices[section.key].map(([value, label]) => ({ value, label, description: value === preferences[section.key] ? 'Current' : undefined })), { title: labels[section.key], placeHolder: 'Learning preferences do not authorize file edits or Run.' });
    if (!current()) return { status: 'stale' };
    if (!picked || !choices[section.key].some(([value]) => value === picked.value)) return { status: 'cancelled' };
    return coordinator.handleLearnerMessage({ type: 'setLearningPreferences', preferences: { [section.key]: picked.value } });
  };
  const onMessage = async message => {
    if (!isTutorMessage(message, coordinator.session)) return { status: 'stale' };
    try {
      if (message.type === 'invokeAction') return await actions.dispatch(message);
      if (message.type === 'setDraft') return await coordinator.handleLearnerMessage({ type: 'setDraft', text: message.text });
      if (message.type === 'submitMessage') return await actions.submitMessage(message);
      if (message.type === 'stopTurn') return await coordinator.handleLearnerMessage({ type: 'stopTurn', turnId: message.turnId, turnGeneration: message.turnGeneration });
      if (message.type === 'setSourceIncluded') return await coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: message.sourceId, included: message.included, contextRevision: message.contextRevision });
      if (message.type === 'openLearningPreferences') return await openLearningPreferences();
      if (message.type === 'revealSource') {
        const state = coordinator.snapshot(), source = [state.context.activeSource, ...state.context.sources].find(s => s?.id === message.sourceId && s.included);
        if (!source || state.context.restricted || message.contextRevision !== state.context.revision || !authorize(parseUri(source.uri))) return { status: 'stale' };
        await vscode.window.showTextDocument(parseUri(source.uri), { preview: true, preserveFocus: true });
        return { status: 'completed' };
      }
    } catch { coordinator.turn('error', 'The host action could not complete.'); return { status: 'failed' }; }
  };
  const tutorView = new TutorViewProvider({ vscode, extensionUri, conversationSession: coordinator,
    diagnostic: record => diagnostics.record(record),
    onMessage });
  // Source authority is independent of chat/draft revisions and never resets with a conversation.
  let observedTrust = vscode.workspace.isTrusted === true;
  let observedActive = vscode.window.activeTextEditor?.document?.uri?.toString() || null;
  const observedVersions = new Map();
  const observedAuthorization = new Map();
  const admitted = uri => {
    const id = uri?.toString?.();
    return !!id && (id === vscode.window.activeTextEditor?.document?.uri?.toString() || id === coordinator.snapshot().context.activeSource?.uri ||
      coordinator.snapshot().context.sources.some(s => s.included && s.uri === id) ||
      [...coordinator.includedSourceUris.values()].some(u => u.toString() === id));
  };
  const getSourceRevision = () => {
    if (hostDisposed) return Number.isSafeInteger(sourceRevision) ? sourceRevision : null;
    const trusted = vscode.workspace.isTrusted === true;
    const active = vscode.window.activeTextEditor?.document;
    const activeId = active?.uri?.toString() || null;
    if (trusted !== observedTrust || activeId !== observedActive) {
      observedTrust = trusted; observedActive = activeId; advanceSource();
    }
    // Version sampling also covers events queued behind host work. It reads no optional bytes.
    for (const document of new Set([active, ...(vscode.workspace.textDocuments || []),
      ...(vscode.window.visibleTextEditors || []).map(e => e.document)])) {
      if (!document || (!admitted(document.uri) && document !== active)) continue;
      const id = document.uri.toString(), version = document.version;
      if (observedVersions.has(id) && observedVersions.get(id) !== version) advanceSource();
      observedVersions.set(id, version);
    }
    for (const id of new Set([coordinator.snapshot().context.activeSource?.uri,
      ...coordinator.snapshot().context.sources.filter(s => s.included).map(s => s.uri)].filter(Boolean))) {
      const authorized = authorize(id);
      if (observedAuthorization.has(id) && observedAuthorization.get(id) !== authorized) advanceSource();
      observedAuthorization.set(id, authorized);
    }
    return Number.isSafeInteger(sourceRevision) ? sourceRevision : null;
  };
  const subscriptions = [];
  const refresh = () => { if (!hostDisposed) void actions.refreshContext().catch(() => {}); };
  const revoke = uri => {
    const id = uri?.toString?.();
    if (!id) return;
    coordinator.controller.revokeSource(id);
    if (proposalProvider.pending?.sourceId === id) proposalProvider.clear();
  };
  const sourceEvent = (uri, deleted = false) => {
    if (hostDisposed) return;
    if (deleted) {
      unavailableSources.add(uri.toString());
      coordinator.session.invalidateActions(a => a.type === 'runFile' && a.args.targetUri === uri.toString());
    }
    // A settled proposal may outlive the context that produced it. Observe all of
    // its dependencies for revocation without admitting them to the current request.
    if (!admitted(uri) && proposalProvider.pending?.sourceId !== uri?.toString?.() &&
      !coordinator.controller.pendingProposal?.fileUris.includes(uri?.toString?.()) &&
      !coordinator.controller.checkpointFileUris().includes(uri?.toString?.())) return;
    advanceSource();
    if (deleted) unavailableSources.add(uri.toString());
    revoke(uri); refresh();
  };
  const authorizationEvent = () => {
    if (hostDisposed) return;
    advanceSource(); getSourceRevision();
    const uris = new Set([coordinator.snapshot().context.activeSource?.uri,
      ...coordinator.snapshot().context.sources.filter(s => s.included).map(s => s.uri),
      ...coordinator.session.historyPairs().flatMap(pair => pair.dependencies.fileUris),
      ...(coordinator.controller.pendingProposal?.fileUris || []), ...coordinator.controller.checkpointFileUris(), proposalProvider.pending?.sourceId].filter(Boolean));
    for (const uri of uris) if (!authorize(uri)) revoke(parseUri(uri));
    coordinator.session.invalidateActions(a => a.type === 'runFile' && !authorize(a.args.targetUri));
    coordinator.controller.invalidate('context-changed'); refresh();
  };
  const listen = (owner, name, callback) => { if (owner[name]) subscriptions.push(owner[name](callback)); };
  listen(vscode.window, 'onDidChangeActiveTextEditor', authorizationEvent);
  listen(vscode.window, 'onDidChangeVisibleTextEditors', refresh);
  listen(vscode.workspace, 'onDidChangeWorkspaceFolders', authorizationEvent);
  listen(vscode.workspace, 'onDidGrantWorkspaceTrust', authorizationEvent);
  listen(vscode.workspace, 'onDidChangeTextDocument', event => sourceEvent(event.document?.uri));
  listen(vscode.workspace, 'onDidOpenTextDocument', document => { unavailableSources.delete(document.uri.toString()); sourceEvent(document.uri); });
  listen(vscode.workspace, 'onDidCloseTextDocument', document => sourceEvent(document.uri));
  const watcher = vscode.workspace.createFileSystemWatcher?.('**/*.kf');
  if (watcher) {
    subscriptions.push(watcher);
    subscriptions.push(watcher.onDidChange(uri => sourceEvent(uri)));
    subscriptions.push(watcher.onDidCreate(uri => { unavailableSources.delete(uri.toString()); sourceEvent(uri); refresh(); }));
    subscriptions.push(watcher.onDidDelete(uri => sourceEvent(uri, true)));
  }
  const readiness = actions.refreshContext();
  return { tutorView, coordinator, proposalProvider, progressStore, actions, runFile, keyHandlers, readiness, openLearningPreferences,
    resolveKnowledge, knowledgeRetriever,
    dispose() { hostDisposed = true; actions.dispose(); coordinator.dispose(); tutorView.dispose(); diagnostics.dispose(); for (const subscription of subscriptions) subscription.dispose(); } };
}

function createRunFileHandler({ vscode, runtimeManager, fs: fileSystem = fs, path: paths = path,
  startKafeFile: run = startKafeFile, onRunResult = () => {}, onRunState = () => {},
  getRunOwner = () => ({ isCurrent: () => true }) }) {
  let runSequence = 0;
  return async function runFile({ targetUri, runOwner } = {}) {
    const editor = vscode.window.activeTextEditor;
    let sourceUri = targetUri ?? editor?.document?.uri?.toString();
    let documentVersion, startedSequence, launchIdentity = null;
    const owner = runOwner || getRunOwner({ sourceUri });
    const current = () => owner?.isCurrent?.() === true;
    const ownerData = owner?.requestId ? { sessionId: owner.sessionId, generation: owner.generation, requestId: owner.requestId } : undefined;
    const state = (status, extra = {}) => {
      if (current()) try { onRunState({ status, ...(sourceUri ? { sourceUri } : {}),
        ...(documentVersion !== undefined ? { documentVersion } : {}),
        ...(startedSequence !== undefined ? { runSequence: startedSequence } : {}),
        ...(ownerData ? { owner: ownerData } : {}), ...extra }); } catch { /* Evidence observers cannot alter native execution. */ }
    };
    const finish = (status, code) => { state(status); return { status, ...(code ? { code } : {}) }; };
    if (!current()) return finish('cancelled');
    if (!vscode.workspace.isTrusted) {
      await vscode.window.showErrorMessage('Trust this workspace before running KAFE code.');
      return finish('unavailable', 'trust_unavailable');
    }
    let document;
    try {
      if (targetUri !== undefined) {
        if (typeof targetUri !== 'string') return finish('unavailable', 'target_unavailable');
        const target = vscode.Uri.parse(targetUri);
        if (target.scheme !== 'file' || target.toString() !== targetUri || path.extname(target.fsPath).toLowerCase() !== '.kf' || !vscode.workspace.getWorkspaceFolder(target)) return finish('unavailable', 'target_unavailable');
        document = await vscode.workspace.openTextDocument(target);
      } else document = editor?.document;
    }
    catch { return finish('unavailable', 'target_unavailable'); }
    if (!current()) return finish('cancelled');
    if (!document || document.languageId !== 'kafe' || document.uri?.scheme !== 'file' ||
      !document.uri.fsPath.toLowerCase().endsWith('.kf') || (targetUri !== undefined && document.uri.toString() !== targetUri)) {
      await vscode.window.showInformationMessage('Open a KAFE .kf file to run it.');
      return finish('unavailable', 'target_unavailable');
    }
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!folder) {
      await vscode.window.showErrorMessage('Open this KAFE file inside a workspace folder before running it.');
      return finish('unavailable', 'target_unavailable');
    }
    if (document.isDirty) {
      const choice = await vscode.window.showWarningMessage('Save this KAFE file before running it?', 'Save', 'Cancel');
      if (!current()) return finish('cancelled');
      if (choice !== 'Save') return finish('cancelled');
      const saved = await document.save();
      if (!current()) return finish('cancelled');
      if (!saved || document.isDirty) {
        await vscode.window.showErrorMessage('The KAFE file was not saved. Run cancelled.');
        return finish('cancelled');
      }
    }
    let runtime;
    try {
      runtime = await runtimeManager.resolveWorkspace(folder.uri.fsPath);
    } catch (error) {
      if (!current()) return finish('cancelled');
      await vscode.window.showErrorMessage(`Unable to resolve the KAFE runtime: ${error.message}`);
      return finish('failed');
    }
    if (!current()) return finish('cancelled');
    if (runtime.status !== 'ready') {
      await vscode.window.showInformationMessage(runtime.message ?? 'The KAFE runtime is not ready. Run KAFE: Install Runtime after the pinned release is published.');
      const code = runtime.runtimeMode === 'contributor' ? 'contributor_runtime_unavailable' :
        runtime.status === 'unsupported' ? 'runtime_unsupported' :
          ['missing', 'unavailable'].includes(runtime.status) ? 'runtime_unavailable' : undefined;
      return finish('unavailable', code);
    }
    const runtimeRoot = runtime.runtimeRoot;
    const missingParser = REQUIRED_PARSER.filter(name => !fileSystem.existsSync(paths.join(runtimeRoot, 'src', name)));
    if (missingParser.length) {
      await vscode.window.showErrorMessage(`Missing generated parser files: ${missingParser.join(', ')}. From src/, run: ${ANTLR_COMMAND}`);
      return finish('unavailable');
    }

    const onDidWrite = new vscode.EventEmitter();
    const onDidClose = new vscode.EventEmitter();
    let activeRun;
    let terminalClosed = false;
    let terminal;
    sourceUri = document.uri.toString();
    documentVersion = document.version;
    const pty = {
      onDidWrite: onDidWrite.event,
      onDidClose: onDidClose.event,
      open() {
        if (terminalClosed || activeRun) return;
        const write = text => onDidWrite.fire(text.replace(/\r?\n/g, '\r\n'));
        if (!current() || !vscode.workspace.isTrusted || document.isDirty || document.uri.toString() !== sourceUri || document.version !== documentVersion || document.languageId !== 'kafe' || !vscode.workspace.getWorkspaceFolder(document.uri)) {
          state('cancelled');
          write('[KAFE run cancelled before launch: context is no longer current.]\n');
          onDidClose.fire();
          terminalClosed = true;
          return;
        }
        try {
          startedSequence = ++runSequence;
          state('running', { terminal });
          launchIdentity = savedSourceHash(fileSystem, document.uri.fsPath);
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
            const sourceIdentity = { launch: launchIdentity, completion: savedSourceHash(fileSystem, document.uri.fsPath) };
            if (current()) try { onRunResult({ ...result, runtimeMode: runtime.runtimeMode,
              runtimeVersion: runtime.runtimeMode === 'contributor' ? null : runtime.runtimeVersion,
              knowledgePackVersion: runtime.runtimeMode === 'contributor' ? null : runtime.knowledgePackVersion,
              sourceUri, runSequence: startedSequence, sourceIdentity, ...(ownerData ? { owner: ownerData } : {}) }); } catch { /* Retain the actual terminal outcome. */ }
            if (result.outputTruncated) write('\n[Output evidence truncated at 1 MiB; terminal output was streamed in full.]\n');
            write(`\n[KAFE exited with code ${result.exitCode === null ? 'unknown' : result.exitCode}.]\n`);
            terminalClosed = true;
            onDidClose.fire(result.exitCode === null ? undefined : result.exitCode);
          }).catch(error => {
            if (terminalClosed) return;
            state('failed');
            write(`\n[KAFE run failed: ${error.message}]\n`);
            terminalClosed = true;
            onDidClose.fire();
          });
        } catch (error) {
          state('failed');
          write(`\n[Unable to start KAFE: ${error.message}]\n`);
          onDidClose.fire();
          terminalClosed = true;
        }
      },
      handleInput(data) { if (activeRun) activeRun.sendInput(data.replace(/\r/g, '\n')); },
      close() {
        if (!terminalClosed) state('cancelled');
        terminalClosed = true;
        if (activeRun) activeRun.cancel();
        onDidWrite.dispose();
        onDidClose.dispose();
      },
    };
    if (!current() || !vscode.workspace.isTrusted || document.isDirty) return finish('cancelled');
    terminal = vscode.window.createTerminal({ name: 'KAFE Run', pty });
    terminal.show();
    return { status: 'completed' };
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
  const host = createTutorHost({ vscode, extensionUri: context.extensionUri,
    secrets: context.secrets, workspaceState: context.workspaceState, runtimeManager,
    extensionMode: context.extensionMode, extensionPath: context.extensionPath });
  const { tutorView, proposalProvider, progressStore, runFile, keyHandlers, coordinator } = host;
  context.subscriptions.push(
    host,
    vscode.window.registerWebviewViewProvider('kafeTutorView', tutorView),
    vscode.workspace.registerTextDocumentContentProvider('kafe-proposal', proposalProvider),
    vscode.commands.registerCommand('kafe.runFile', () => runFile()),
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
    vscode.commands.registerCommand('kafe.clearTutorProgress', createClearProgressHandler({ vscode, progressStore })),
    vscode.commands.registerCommand('kafe.newConversation', () => coordinator.newConversation()),
    vscode.commands.registerCommand('kafe.learningPreferences', () => host.openLearningPreferences()),
  );
}

function deactivate() {}

module.exports = { activate, deactivate, createRunFileHandler, createProviderKeyHandlers,
  createClearProgressHandler, createTutorHost, ANTLR_COMMAND };
