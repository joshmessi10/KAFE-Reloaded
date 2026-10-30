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
const { ConversationManager } = require('./src/tutor/ConversationManager');
const { createConversationCommands } = require('./src/tutor/ConversationCommands');

const conversationManagers = new Set();

const ANTLR_COMMAND = 'java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4';
const REQUIRED_PARSER = ['Kafe_GrammarLexer.py', 'Kafe_GrammarParser.py', 'Kafe_GrammarVisitor.py'];

function createProviderKeyHandlers({ vscode, secrets }) {
  let generation = 0, disposed = false, pending, writes = Promise.resolve();
  const mutate = action => {
    const result = writes.then(action);
    writes = result.catch(() => {});
    return result;
  };
  return {
    configure() {
      if (disposed) return Promise.resolve({ status: 'cancelled' });
      if (pending) return pending;
      const owner = ++generation, current = () => !disposed && generation === owner;
      pending = (async () => {
        const key = await vscode.window.showInputBox({ title: 'KAFE: Configure Provider Key',
          prompt: 'Enter your DeepSeek API key', password: true, ignoreFocusOut: true });
        if (!current() || !key?.trim()) return { status: 'cancelled' };
        try { await mutate(async () => { if (current()) await secrets.store(SECRET_KEY, key.trim()); }); }
        catch { return current() ? { status: 'failed', code: 'credential_store_failed' } : { status: 'cancelled' }; }
        if (!current()) return { status: 'cancelled' };
        void Promise.resolve(vscode.window.showInformationMessage('DeepSeek API key saved in VS Code SecretStorage.')).catch(() => {});
        return { status: 'completed' };
      })().finally(() => { pending = undefined; });
      return pending;
    },
    async clear() {
      if (disposed) return { status: 'cancelled' };
      const owner = ++generation;
      try { await mutate(async () => { if (!disposed) await secrets.delete(SECRET_KEY); }); }
      catch { return { status: 'failed', code: 'credential_store_failed' }; }
      if (disposed || generation !== owner) return { status: 'cancelled' };
      void Promise.resolve(vscode.window.showInformationMessage('DeepSeek API key removed from VS Code SecretStorage.')).catch(() => {});
      return { status: 'completed' };
    },
    dispose() { disposed = true; generation++; },
  };
}

function createClearProgressHandler({ vscode, progressStore }) {
  let pending;
  return () => {
    if (pending) return pending;
    pending = (async () => {
      try {
        const choice = await vscode.window.showWarningMessage('Clear legacy KAFE Tutor progress records?',
          { modal: true, detail: 'Saved conversations, the current draft and provider keys are kept.' }, 'Clear legacy progress');
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
      const folders = vscode.workspace.workspaceFolders || [];
      const name = folder.name || path.basename(folder.uri.fsPath);
      // Repeated names or embedded path separators make root qualification ambiguous.
      if (/[\\/]/.test(name) || folders.filter(other => (other.name || path.basename(other.uri.fsPath)) === name).length > 1) return target.toString();
      return (folders.length > 1 ? `${name}/` : '') + relative;
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
  const coordinator = new SessionCoordinator({ provider, proposalProvider, learningSession: new LearningSession(), getKnowledgeAvailability: resolveKnowledge, getSourceRevision: () => getSourceRevision(), isSourceAuthorized: uri => authorize(uri),
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
  const nativeKeyHandlers = createProviderKeyHandlers({ vscode, secrets });
  let keyAvailabilityRevision = 0, runtimeAvailabilityRevision = 0, keyConfiguration;
  let runtimeSetup, runtimeSetupEpoch = 0;
  // Presentation facts are independent of request/Run authorization and never refreshed by drafts or tokens.
  const refreshProviderKeyAvailability = async () => {
    if (hostDisposed) return;
    const owner = ++keyAvailabilityRevision;
    let providerKey = 'unavailable';
    try { if (typeof secrets.get === 'function') providerKey = await secrets.get(SECRET_KEY) ? 'present' : 'missing'; } catch {}
    if (!hostDisposed && owner === keyAvailabilityRevision) tutorView.setHostMetadata({ providerKey });
  };
  const refreshTutorAvailability = async () => {
    if (hostDisposed) return;
    const owner = ++runtimeAvailabilityRevision;
    const trusted = vscode.workspace.isTrusted === true;
    await Promise.all([
      refreshProviderKeyAvailability(),
      (async () => {
        let runtime = 'unavailable';
        if (trusted && runtimeSetup) return;
        if (trusted) try {
          const ready = await runtimeManager.getReadyRuntime?.();
          if (['preparing', 'ready', 'failed'].includes(ready?.status)) runtime = ready.status;
        } catch {}
        if (!hostDisposed && owner === runtimeAvailabilityRevision) tutorView.setHostMetadata({ runtime: vscode.workspace.isTrusted === true && trusted ? runtime : 'unavailable' });
      })(),
    ]);
  };
  // Native setup is global to the host. Notifications are detached from the flight:
  // choosing Retry in its own outcome must start fresh work, never await itself.
  const prepareRuntime = ({ origin } = {}) => {
    if (hostDisposed) return Promise.resolve({ status: 'cancelled' });
    if (!['activation', 'manual', 'retry'].includes(origin)) return Promise.resolve({ status: 'error', code: 'runtime_setup_failed' });
    if (runtimeSetup) return runtimeSetup;
    const owner = ++runtimeSetupEpoch;
    ++runtimeAvailabilityRevision;
    const current = () => !hostDisposed && owner === runtimeSetupEpoch && vscode.workspace.isTrusted === true;
    const messages = {
      ready: 'KAFE runtime is ready for Run.',
      unsupported: 'KAFE runtime setup is not supported on this platform.',
      unavailable: 'KAFE runtime setup is unavailable. Check that the published runtime is available, then retry setup.',
      cancelled: 'KAFE runtime setup was cancelled. You can retry setup when ready.',
      error: 'KAFE runtime setup could not complete. Retry setup to install or repair it.',
      blocked: 'Trust this workspace before installing the KAFE runtime.',
    };
    const stages = { checking: 'Checking runtime setup…', confirming: 'Preparing runtime setup…',
      downloading: 'Downloading runtime and uv…', validating: 'Validating runtime components…',
      extracting: 'Extracting runtime components…', syncing: 'Configuring runtime dependencies…',
      verifying: 'Verifying KAFE and private Python…', ready: 'Runtime setup ready.' };
    let skipped = false;
    const work = async () => {
      if (!vscode.workspace.isTrusted) return { status: 'blocked', message: messages.blocked };
      if (origin === 'activation') {
        const ready = await runtimeManager.getReadyRuntime();
        if (!current()) return { status: 'cancelled' };
        if (ready?.status === 'ready') { skipped = true; return ready; }
        if (!runtimeManager.manifest?.runtime?.releasePublished) { skipped = true; return { status: 'unavailable' }; }
      }
      if (!current()) return { status: 'cancelled' };
      if (runtimeManager.manifest?.runtime?.releasePublished === false) return { status: 'unavailable' };
      tutorView.setHostMetadata({ runtime: 'preparing' });
      const install = progress => {
        if (!current()) return { status: 'cancelled' };
        if (runtimeManager.manifest?.runtime?.releasePublished === false) return { status: 'unavailable' };
        progress?.report({ message: stages.checking });
        return runtimeManager.installRuntime({ onProgress: ({ stage }) => {
          if (current() && runtimeSetup === flight && typeof stage === 'string' && Object.hasOwn(stages, stage)) progress?.report({ message: stages[stage] });
        } });
      };
      return typeof vscode.window.withProgress === 'function' ? vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification, title: 'KAFE: Preparing runtime', cancellable: false,
      }, install) : install();
    };
    const flight = Promise.resolve().then(work).catch(() => ({ status: 'error', code: 'runtime_setup_failed' })).then(raw => {
      const result = typeof raw?.status === 'string' && Object.hasOwn(messages, raw.status) ? raw : { status: 'error', code: 'runtime_setup_failed' };
      if (runtimeSetup === flight) runtimeSetup = undefined;
      ++runtimeAvailabilityRevision;
      if (hostDisposed || owner !== runtimeSetupEpoch) return { status: 'cancelled' };
      if (!vscode.workspace.isTrusted && result.status !== 'blocked') {
        tutorView.setHostMetadata({ runtime: 'unavailable' }); return { status: 'cancelled' };
      }
      tutorView.setHostMetadata({ runtime: result.status === 'ready' ? 'ready' : result.status === 'error' ? 'failed' : 'unavailable' });
      if (!skipped) {
        const key = tutorView.hostMetadata.providerKey;
        const chat = key === 'present' ? 'Tutor key is configured. Send a message when you are ready.' :
          key === 'missing' ? 'Configure Tutor to chat. Your draft stays here.' : 'Tutor configuration has not been confirmed. Your draft stays here.';
        const show = result.status === 'error' ? 'showErrorMessage' : result.status === 'unsupported' ? 'showWarningMessage' : 'showInformationMessage';
        const choices = ['error', 'unavailable', 'cancelled'].includes(result.status) ? ['Retry setup', 'Details'] : result.status === 'unsupported' ? ['Details'] : [];
        const reason = result.status === 'error' && typeof result.userMessage === 'string' ? ` ${result.userMessage}` : '';
        try {
          void Promise.resolve(vscode.window[show]?.(`${messages[result.status]}${reason} ${chat}`, ...choices)).then(choice => {
            if (!current()) return;
            if (choice === 'Retry setup') void prepareRuntime({ origin: 'retry' });
            if (choice === 'Details') void Promise.resolve(vscode.window.showInformationMessage?.(messages[result.status],
              { modal: true, detail: `${reason.trim() || 'No additional setup category was available.'}\n\nRuntime preparation installs the pinned KAFE runtime for explicit Run. It does not send your draft or run a learner program. Use KAFE: Install Runtime to try again.` })).catch(() => {});
          }).catch(() => {});
        } catch { /* Native notification availability cannot change the setup outcome. */ }
      }
      return result;
    });
    runtimeSetup = flight;
    return flight;
  };
  const keyHandlers = {
    configure() {
      if (hostDisposed) return Promise.resolve({ status: 'cancelled' });
      if (keyConfiguration) return keyConfiguration;
      ++keyAvailabilityRevision;
      keyConfiguration = (async () => {
        let result;
        try { result = await (injectedConfigure || nativeKeyHandlers.configure)(); }
        catch { result = { status: 'failed', code: 'credential_store_failed' }; }
        // Mutation errors describe the operation; only fresh readback determines key presence.
        await refreshProviderKeyAvailability();
        return result || { status: 'unavailable' };
      })().finally(() => { keyConfiguration = undefined; });
      return keyConfiguration;
    },
    async clear() {
      if (hostDisposed) return { status: 'cancelled' };
      ++keyAvailabilityRevision;
      const result = await nativeKeyHandlers.clear();
      await refreshProviderKeyAvailability();
      return result;
    },
  };
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
    proposalProvider, runtimeManager, prepareRuntime, configureProvider: keyHandlers.configure,
    runFile, getReadiness, authorizeRunTarget: authorize, displayTargetLabel: documentReader.displayLabel });
  const toggleTeachingPause = () => coordinator.handleLearnerMessage({ type: 'toggleTeachingPause' });
  const onMessage = async message => {
    if (!isTutorMessage(message, coordinator.session)) return { status: 'stale' };
    if (conversations.transitioning && message.type !== 'setDraft') return { status: 'busy' };
    try {
      if (message.type === 'configureProvider') return await keyHandlers.configure();
      if (message.type === 'retryRuntimeSetup') return await prepareRuntime({ origin: 'retry' });
      if (message.type === 'invokeAction') return await actions.dispatch(message);
      if (message.type === 'setDraft') return await coordinator.handleLearnerMessage({ type: 'setDraft', text: message.text });
      if (message.type === 'submitMessage') return await actions.submitMessage(message);
      if (message.type === 'stopTurn') return await coordinator.handleLearnerMessage({ type: 'stopTurn', turnId: message.turnId, turnGeneration: message.turnGeneration });
      if (message.type === 'setSourceIncluded') return await coordinator.handleLearnerMessage({ type: 'setSourceIncluded', sourceId: message.sourceId, included: message.included, contextRevision: message.contextRevision });
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
      if (trusted !== observedTrust) { ++runtimeSetupEpoch; ++runtimeAvailabilityRevision; }
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
  const sourceEvent = (uri, deleted = false) => {
    if (hostDisposed) return;
    const id = uri?.toString?.();
    if (!id) return;
    const activeSourceUri = vscode.window.activeTextEditor?.document?.uri?.toString() || null;
    if (deleted) unavailableSources.add(id);
    const relevant = coordinator.isSourceChangeRelevant(id, { activeSourceUri });
    // Publish observed freshness before domain revocation can notify reentrant display observers.
    if (relevant) advanceSource();
    coordinator.sourceChanged(id, { deleted, activeSourceUri });
    if (relevant) refresh();
  };
  const authorizationEvent = () => {
    if (hostDisposed) return;
    advanceSource(); getSourceRevision();
    coordinator.authorizationChanged(); refresh();
  };
  const listen = (owner, name, callback) => { if (owner[name]) subscriptions.push(owner[name](callback)); };
  listen(secrets, 'onDidChange', event => { if (event.key === SECRET_KEY) void refreshTutorAvailability(); });
  listen(vscode.window, 'onDidChangeActiveTextEditor', authorizationEvent);
  listen(vscode.window, 'onDidChangeVisibleTextEditors', refresh);
  listen(vscode.workspace, 'onDidChangeWorkspaceFolders', authorizationEvent);
  listen(vscode.workspace, 'onDidGrantWorkspaceTrust', () => { authorizationEvent(); void refreshTutorAvailability(); });
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
  const conversations = new ConversationManager({ coordinator, workspaceState,
    onError: message => vscode.window.showErrorMessage?.(message),
    onChanged: ({ title }) => tutorView.setConversationTitle(title) });
  conversationManagers.add(conversations);
  const conversationCommands = createConversationCommands({ vscode, manager: conversations, refreshContext: () => actions.refreshContext() });
  const readiness = Promise.all([actions.refreshContext(), refreshTutorAvailability()]).then(() => undefined);
  return { tutorView, coordinator, proposalProvider, progressStore, actions, runFile, keyHandlers, readiness, toggleTeachingPause,
    resolveKnowledge, knowledgeRetriever, conversations, conversationCommands, refreshTutorAvailability, prepareRuntime,
    dispose() { hostDisposed = true; ++keyAvailabilityRevision; ++runtimeAvailabilityRevision; nativeKeyHandlers.dispose();
      void conversations.dispose().finally(() => conversationManagers.delete(conversations));
      actions.dispose(); coordinator.dispose(); tutorView.dispose(); diagnostics.dispose(); for (const subscription of subscriptions) subscription.dispose(); } };
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
      const code = runtime.runtimeMode === 'contributor' ? 'contributor_runtime_unavailable' :
        runtime.status === 'unsupported' ? 'runtime_unsupported' :
          ['missing', 'unavailable'].includes(runtime.status) ? 'runtime_unavailable' : undefined;
      if (code === 'runtime_unavailable' && typeof vscode.commands?.executeCommand === 'function') {
        const choice = await vscode.window.showInformationMessage(
          runtime.message ?? 'The KAFE runtime is not installed yet.',
          'Install Runtime',
          'Cancel',
        );
        if (choice === 'Install Runtime') {
          await vscode.commands.executeCommand('kafe.installRuntime');
        }
      } else {
        await vscode.window.showInformationMessage(runtime.message ?? 'The KAFE runtime is not ready. Run KAFE: Install Runtime to install or repair it.');
      }
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
    let runFinished = false;
    let terminal;
    sourceUri = document.uri.toString();
    documentVersion = document.version;
    const pty = {
      onDidWrite: onDidWrite.event,
      onDidClose: onDidClose.event,
      open() {
        if (terminalClosed || runFinished || activeRun) return;
        const write = text => onDidWrite.fire(text.replace(/\r?\n/g, '\r\n'));
        if (!current() || !vscode.workspace.isTrusted || document.isDirty || document.uri.toString() !== sourceUri || document.version !== documentVersion || document.languageId !== 'kafe' || !vscode.workspace.getWorkspaceFolder(document.uri)) {
          state('cancelled');
          write('[KAFE run cancelled before launch: context is no longer current.]\n');
          runFinished = true;
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
            // Keep the terminal buffer visible until the learner closes it.
            runFinished = true;
          }).catch(error => {
            if (terminalClosed) return;
            state('failed');
            write(`\n[KAFE run failed: ${error.message}]\n`);
            runFinished = true;
          });
        } catch (error) {
          state('failed');
          write(`\n[Unable to start KAFE: ${error.message}]\n`);
          runFinished = true;
        }
      },
      handleInput(data) { if (activeRun && !runFinished && !terminalClosed) activeRun.sendInput(data.replace(/\r/g, '\n')); },
      close() {
        if (terminalClosed) return;
        if (!runFinished) state('cancelled');
        terminalClosed = true;
        if (activeRun && !runFinished) activeRun.cancel();
        onDidWrite.dispose();
        onDidClose.dispose();
      },
    };
    if (!current() || !vscode.workspace.isTrusted || document.isDirty) return finish('cancelled');
    terminal = vscode.window.createTerminal({ name: 'KAFE Run', pty });
    // Running a file is an execution action: keep its stdout/stderr in the
    // integrated Terminal and put keyboard focus there, never in the Tutor view.
    terminal.show(false);
    return { status: 'completed' };
  };
}

function activate(context) {
  const vscode = require('vscode');
  const runtimeManager = createRuntimeManager({
    storageRoot: context.globalStorageUri.fsPath,
    bundledRuntimeRoot: path.join(context.extensionPath || __dirname, 'runtime'),
    confirmDownload: async () => true,
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
    vscode.commands.registerCommand('kafe.installRuntime', () => host.prepareRuntime({ origin: 'manual' })),
    vscode.commands.registerCommand('kafe.openTutor', () =>
      vscode.commands.executeCommand('workbench.view.extension.kafeTutor')),
    vscode.commands.registerCommand('kafe.configureProvider', keyHandlers.configure),
    vscode.commands.registerCommand('kafe.clearProviderKey', keyHandlers.clear),
    vscode.commands.registerCommand('kafe.clearTutorProgress', createClearProgressHandler({ vscode, progressStore })),
    vscode.commands.registerCommand('kafe.newConversation', host.conversationCommands.newConversation),
    vscode.commands.registerCommand('kafe.switchConversation', host.conversationCommands.switchConversation),
    vscode.commands.registerCommand('kafe.renameConversation', host.conversationCommands.renameConversation),
    vscode.commands.registerCommand('kafe.deleteConversation', host.conversationCommands.deleteConversation),
    vscode.commands.registerCommand('kafe.exportConversation', host.conversationCommands.exportConversation),
    vscode.commands.registerCommand('kafe.toggleTeachingPause', () => host.toggleTeachingPause()),
  );

  if (vscode.workspace.isTrusted && typeof vscode.window.withProgress === 'function') {
    void host.prepareRuntime({ origin: 'activation' });
  }
}

async function deactivate() {
  await Promise.allSettled([...conversationManagers].map(manager => manager.flush()));
}

module.exports = { activate, deactivate, createRunFileHandler, createProviderKeyHandlers,
  createClearProgressHandler, createTutorHost, ANTLR_COMMAND };
