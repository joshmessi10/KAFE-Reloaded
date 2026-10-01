// Loaded only by the isolated acceptance fixture extension, never shipped in VSIX.
const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture-config.json'), 'utf8'));
const { createTutorHost, createRunFileHandler, createClearProgressHandler } = require(path.join(config.extensionRoot, 'extension.js'));

exports.activate = async function activate(context) {
  const { ProviderError } = require(path.join(config.extensionRoot, 'src/tutor/providers/ProviderError.js'));
  const counters = { observations: [], envelopes: [], proposalEvents: [], diffOpens: 0, nativeEdits: 0, knowledge: 0, resolves: 0, installs: 0, terminalShows: 0, watcher: { change: 0, create: 0, delete: 0, disposed: 0 }, provider: 0, inputs: [], launches: [], closed: 0, views: 0, messages: 0, secrets: 0 };
  const memory = context.workspaceState, secrets = new Map(), terminals = [];
  if (!memory.get('fixtureSeeded')) { await memory.update('kafeTutor.progress.v2', { schemaVersion: 2, goal: 'LEGACY_PRIVATE_GOAL', milestones: [{ id: 'one', text: 'Private milestone' }], completedChecks: [], legacyCompletedCheckIds: [] }); await memory.update('fixtureSeeded', true); }
  let host, stream, nextScenario = { text: 'A native fixture answer.' }, runFinish, view, registration, runtimeReady = false, captureBarrier, clearOperation = null;
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(config.workspace, 'main.kf')));
  await vscode.window.showTextDocument(document);
  const provider = { async *stream({ request, signal }) {
    counters.provider++;
    const body = JSON.stringify(request); counters.observations.push({ roles: request.messages.map(m => m.role), optionalOneSources: request.messages.filter(m => m.content.startsWith('[Source ') && m.content.includes('OPTIONAL_ONE_SENTINEL')).length, helloHistory: body.includes('Hello native answer'), sourceHistoryLearner: body.includes('NATIVE_SOURCE_LINEAGE_QUESTION'), sourceHistoryAnswer: body.includes('NATIVE_SOURCE_LINEAGE_ANSWER'), optionalOne: body.includes('OPTIONAL_ONE_SENTINEL'), optionalTwo: body.includes('OPTIONAL_TWO_SENTINEL'), main: body.includes('MAIN_SENTINEL'), legacy: body.includes('LEGACY_PRIVATE_GOAL'), knowledgeUnavailable: /knowledge.{0,80}unavailable/i.test(body), tools: request.tools?.map(t => t.function?.name || t.name) || [] });
    const scenario = nextScenario;
    if (scenario.missingKey) throw new ProviderError('missing_key');
    if (scenario.proposal) { yield { type: 'complete', text: '', toolCalls: [{ id: 'native-proposal', name: 'proposeCodeChange', arguments: { newText: 'items <- [42]\n', ...(scenario.sourceId ? { sourceId: scenario.sourceId } : {}) } }], finishReason: 'tool_calls' }; return; }
    const queue = [scenario.text]; let wake, done = !scenario.hold;
    stream = { chunk(text) { queue.push(text); wake?.(); }, finish() { done = true; wake?.(); } };
    signal.addEventListener('abort', () => { done = true; wake?.(); }, { once: true });
    let text = '';
    while (queue.length || !done) {
      if (!queue.length) { await new Promise(resolve => { wake = resolve; }); wake = undefined; continue; }
      const chunk = queue.shift(); text += chunk; yield { type: 'text', text: chunk };
    }
    yield { type: 'complete', text, toolCalls: [], finishReason: 'stop' };
  } };
  const runtimeManager = {
    getReadyKnowledgePack: async () => { counters.knowledge++; return { status: 'unavailable', code: 'knowledge-unavailable' }; },
    getReadyRuntime: async () => ({ status: runtimeReady ? 'ready' : 'unavailable' }),
    resolveWorkspace: async () => { counters.resolves++; return runtimeReady ? { status: 'ready', runtimeMode: 'managed', runtimeRoot: config.runtime, runtimeVersion: '0.1.0', knowledgePackVersion: '0.1.0', uvPath: 'fixture-only', uvEnvironment: {} } : { status: 'unavailable' }; },
    installRuntime: async () => { counters.installs++; return { status: 'unavailable' }; },
  };
  const nativeWorkspace = new Proxy(vscode.workspace, { get(target, property) {
    if (property === 'applyEdit') return async edit => { counters.nativeEdits++; return vscode.workspace.applyEdit(edit); };
    if (property === 'openTextDocument') return async uri => { const doc = await vscode.workspace.openTextDocument(uri); if (captureBarrier && uri?.fsPath?.endsWith('optional-one-with-a-long-workspace-file-name.kf')) { captureBarrier.entered = true; await captureBarrier.promise; } return doc; };
    if (property === 'createFileSystemWatcher') return pattern => {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      for (const [event, name] of [['onDidChange', 'change'], ['onDidCreate', 'create'], ['onDidDelete', 'delete']]) watcher[event](() => { counters.watcher[name]++; });
      return new Proxy(watcher, { get(w, key) { if (key === 'dispose') return () => { counters.watcher.disposed++; w.dispose(); }; return typeof w[key] === 'function' ? w[key].bind(w) : w[key]; } });
    };
    return typeof target[property] === 'function' ? target[property].bind(target) : target[property];
  } });
  const nativeWindow = new Proxy(vscode.window, { get(target, property) {
    if (property === 'createTerminal') return options => {
      options.pty.onDidClose(() => { counters.closed++; });
      const terminal = vscode.window.createTerminal(options); terminals.push(terminal); return { ...terminal, show(...args) { counters.terminalShows++; terminal.show(...args); }, dispose: () => terminal.dispose() };
    };
    return target[property];
  } });
  const nativeCommands = new Proxy(vscode.commands, { get(target, property) {
    if (property === 'executeCommand') return async (name, ...args) => {
      if (name === 'vscode.diff') { counters.diffOpens++; counters.proposalEvents.push({ stage: 'diff-request', pending: !!host.proposalProvider.pending, reviewed: host.proposalProvider.pending?.reviewed === true }); }
      const result = await vscode.commands.executeCommand(name, ...args);
      if (name === 'vscode.diff') counters.proposalEvents.push({ stage: 'diff-complete', pending: !!host.proposalProvider.pending });
      return result;
    };
    return target[property];
  } });
  const api = { ...vscode, commands: nativeCommands, window: nativeWindow, workspace: nativeWorkspace };
  const runFile = createRunFileHandler({ vscode: api, runtimeManager, fs: { existsSync: () => true },
    getRunOwner: ({ sourceUri }) => host.actions.captureRunOwner(sourceUri),
    onRunState: event => host.actions.recordRunState(event), onRunResult: result => host.actions.recordRunResult(result),
    startKafeFile(options) {
      counters.launches.push(options.filePath); options.onStdout('Native fixture waiting for input> ');
      return { completion: new Promise(resolve => { runFinish = resolve; }),
        sendInput(text) { counters.inputs.push(text); options.onStdout(`Received fixture input: ${text}`); },
        cancel() { runFinish?.({ stdout: '', stderr: '', exitCode: null, outputTruncated: false }); } };
    } });
  host = createTutorHost({ vscode: api, extensionUri: vscode.Uri.file(config.extensionRoot), runtimeManager, provider, runFile,
    workspaceState: memory,
    secrets: { get: async key => secrets.get(key), store: async (key, value) => { secrets.set(key, value); counters.secrets++; }, delete: async key => secrets.delete(key) } });
  await host.readiness;
  const subscriptions = [vscode.workspace.registerTextDocumentContentProvider('kafe-proposal', host.proposalProvider),
    vscode.window.onDidChangeActiveTextEditor(editor => counters.proposalEvents.push({ stage: 'active-editor', scheme: editor?.document.uri.scheme || null,
      pending: !!host.proposalProvider.pending, reviewed: host.proposalProvider.pending?.reviewed === true, turnStatus: host.coordinator.snapshot().turn?.status || null })),
    vscode.commands.registerCommand('kafe.runFile', () => runFile()),
    vscode.commands.registerCommand('kafe.newConversation', () => host.coordinator.newConversation()),
    vscode.commands.registerCommand('kafe.configureProvider', () => host.keyHandlers.configure()),
    vscode.commands.registerCommand('kafe.clearTutorProgress', createClearProgressHandler({ vscode: api, progressStore: host.progressStore }))];
  function register() {
    registration = vscode.window.registerWebviewViewProvider('kafeNativeTutorView', {
      resolveWebviewView(nativeView) {
        view = nativeView; counters.views++;
        // Test observer only: production resolver owns every message/action and asset.
        subscriptions.push(nativeView.webview.onDidReceiveMessage(message => { counters.messages++; counters.envelopes.push({ type: message.type, keys: Object.keys(message).sort(), submissionId: message.submissionId || null }); }));
        host.tutorView.resolveWebviewView(nativeView);

      },
    });
  }
  register();
  const current = () => ({ snapshot: host.coordinator.snapshot(), counters, trusted: vscode.workspace.isTrusted,
    optionalEditorVisible: vscode.window.visibleTextEditors.some(editor => path.basename(editor.document.uri.fsPath) === 'optional-one-with-a-long-workspace-file-name.kf'),
    version: vscode.version, pendingProposal: host.proposalProvider.pending?.id || null, pendingProposalReviewed: host.proposalProvider.pending?.reviewed === true,
    pendingProposalInfo: host.proposalProvider.pending ? { target: path.basename(vscode.Uri.parse(host.proposalProvider.pending.sourceId).fsPath),
      dependencies: (host.coordinator.controller.pendingProposal?.fileUris || []).map(uri => path.basename(vscode.Uri.parse(uri).fsPath)) } : null,
    optionalTargetText: vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === path.join(config.workspace, 'optional-one-with-a-long-workspace-file-name.kf'))?.getText(),
    documentText: document.getText(), documentVersion: document.version, summary: memory.get('kafeTutor.progress.v2') || null, barrierEntered: captureBarrier?.entered === true, historyCount: host.coordinator.session.historyPairs().length, clearOperation, keyState: { count: secrets.size, stores: counters.secrets, fixtureCredentialIntact: [...secrets.values()].every(value=>value==='fixture-only-dummy-credential') }, dialogStyle: vscode.workspace.getConfiguration('window').get('dialogStyle') });
  const server = http.createServer(async (request, response) => {
    if (request.headers.authorization !== `Bearer ${config.token}`) { response.writeHead(403); response.end(); return; }
    let body = ''; for await (const chunk of request) body += chunk;
    try {
      const command = body ? JSON.parse(body) : { type: 'state' };
      switch (command.type) {
        case 'show': await vscode.commands.executeCommand('workbench.view.extension.kafeNativeTutor'); await vscode.commands.executeCommand('kafeNativeTutorView.focus'); break;
        case 'runtimeReady': runtimeReady = true; break;
        case 'newConversation': await vscode.commands.executeCommand('kafe.newConversation'); break;
        case 'clearLegacy': clearOperation = { status: 'pending' }; void vscode.commands.executeCommand('kafe.clearTutorProgress').then(result => { clearOperation = { status: 'settled', result }; }, () => { clearOperation = { status: 'failed' }; }); break;
        case 'configure': void vscode.commands.executeCommand('kafe.configureProvider'); break;
        case 'dismissNotifications': await vscode.commands.executeCommand('notifications.clearAll'); break;
        case 'hideTerminal': await vscode.commands.executeCommand('workbench.action.closePanel'); break;
        case 'obsolete': { const state = host.coordinator.snapshot(); counters.obsoleteResult = await host.tutorView.onMessage({ type: 'prepareRequest', sessionId: state.sessionId, generation: state.generation }); break; }
        case 'barrier': { let release; const promise = new Promise(resolve => { release = resolve; }); captureBarrier = { promise, release, entered: false }; break; }
        case 'releaseBarrier': captureBarrier?.release(); captureBarrier = undefined; break;
        case 'disk': { const target = path.resolve(config.workspace, command.optional ? 'optional-one-with-a-long-workspace-file-name.kf' : 'main.kf'); if (path.dirname(target) !== path.resolve(config.workspace)) throw Error('Not owned');
          if (command.operation === 'delete') fs.unlinkSync(target); else fs.writeFileSync(target, command.optional ? 'OPTIONAL_ONE_SENTINEL <- 1\n' : 'MAIN_SENTINEL <- 1\n'); break; }
        case 'scenario': nextScenario = command.scenario; break;
        case 'chunk': stream?.chunk(command.text); break;
        case 'finish': stream?.finish(); break;
        case 'theme': await vscode.workspace.getConfiguration('workbench').update('colorTheme', command.theme, vscode.ConfigurationTarget.Global); break;
        case 'zoom': await vscode.workspace.getConfiguration('window').update('zoomLevel', command.level, vscode.ConfigurationTarget.Global); break;
        case 'fullscreen': await vscode.commands.executeCommand('workbench.action.toggleFullScreen'); break;
        case 'editor': await vscode.window.showTextDocument(document); break;
        case 'closeOptionalEditor': {
          const ownedUri = vscode.Uri.file(path.join(config.workspace, 'optional-one-with-a-long-workspace-file-name.kf')).toString();
          const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs).filter(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === ownedUri);
          if (!tabs.length || !await vscode.window.tabGroups.close(tabs, true)) throw Error('Owned optional file tabs did not close');
          await vscode.window.showTextDocument(document); await host.actions.refreshContext(); break;
        }
        case 'traversalSources': {
          for (const name of ['optional-one-with-a-long-workspace-file-name.kf', 'optional-two-with-another-long-workspace-file-name.kf']) {
            const optional = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(config.workspace, name)));
            await vscode.window.showTextDocument(optional, { viewColumn: name === 'optional-one-with-a-long-workspace-file-name.kf' ? vscode.ViewColumn.Two : vscode.ViewColumn.Three, preserveFocus: true });
          }
          await vscode.window.showTextDocument(document, vscode.ViewColumn.One); break;
        }
        case 'readiness': await host.actions.refreshContext(); break;
        case 'singleEditor': await vscode.commands.executeCommand('workbench.action.joinAllGroups'); await vscode.window.showTextDocument(document); break;
        case 'target': {
          const target = ['optional', 'third'].includes(command.target) ? await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(config.workspace, command.target === 'optional' ? 'optional-one-with-a-long-workspace-file-name.kf' : 'optional-two-with-another-long-workspace-file-name.kf'))) : await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Not a KAFE target' });
          await vscode.window.showTextDocument(target); await host.actions.refreshContext(); break;
        }
        case 'changeDocument': { const edit = new vscode.WorkspaceEdit(); edit.insert(document.uri, new vscode.Position(0, 0), '-- changed\n'); await vscode.workspace.applyEdit(edit); break; }
        case 'finishRun': runFinish?.({ stdout: 'Native fixture completed\n' + 'line\n'.repeat(20), stderr: '', exitCode: 0, outputTruncated: false }); break;
        case 'finishRunUnknown': runFinish?.({ stdout: 'PARTIAL_NATIVE_OUTPUT', stderr: 'Native child launch failed', exitCode: null, outputTruncated: true }); break;
        case 'recreate': {
          host.tutorView.dispose(); counters.views++; host.tutorView.resolveWebviewView(view);
          await vscode.commands.executeCommand('kafeNativeTutorView.focus'); break;
        }
        case 'terminal': terminals.at(-1)?.show(); break;
        case 'dispose': host.dispose(); registration.dispose(); for (const item of subscriptions) item.dispose(); for (const terminal of terminals) terminal.dispose(); counters.disposed = true; break;
        case 'renderSnapshot': await host.tutorView.render(host.coordinator.snapshot()); break;
        case 'recover': { const s = host.coordinator.snapshot(), t=s.turn; if(t && ['preparing','responding','processing-tools'].includes(t.status)) await host.tutorView.onMessage({type:'stopTurn',sessionId:s.sessionId,generation:s.generation,turnId:t.id,turnGeneration:t.turnGeneration}); captureBarrier?.release();captureBarrier=undefined;stream?.finish();runFinish?.({stdout:'',stderr:'',exitCode:null,outputTruncated:false}); break; }
        case 'state': break;
        default: throw Error('Unsupported fixture control');
      }
      response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify(current()));
    } catch (error) { response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: error.message })); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  fs.writeFileSync(path.join(config.root, 'ready.json'), JSON.stringify({ token: config.token, port: server.address().port, version: vscode.version }));
  context.subscriptions.push({ dispose() { host.dispose(); registration.dispose(); server.close(); for (const terminal of terminals) terminal.dispose(); for (const item of subscriptions) item.dispose(); } });
};
