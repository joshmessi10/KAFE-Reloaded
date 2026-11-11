function createConversationCommands({ vscode, manager, refreshContext = async () => {} }) {
  const finish = async result => {
    if (result.status === 'completed') await refreshContext();
    if (result.status === 'busy') await vscode.window.showInformationMessage?.('Wait for the current Apply operation to finish before changing conversations.');
    return result;
  };
  const identity = () => ({ id: manager.activeId, generation: manager.coordinator.snapshot().generation });
  const current = owner => !manager.disposed && owner.id === manager.activeId && owner.generation === manager.coordinator.snapshot().generation;
  return {
    newConversation: () => manager.newConversation().then(finish),
    async switchConversation() {
      const origin = identity();
      const choices = manager.list().map(record => ({ label: record.title,
        description: record.id === origin.id ? 'Current conversation' : undefined,
        detail: `Updated ${record.updatedAt}`, id: record.id }));
      const choice = await vscode.window.showQuickPick(choices, { title: 'KAFE: Switch Conversation', placeHolder: 'Choose a saved Tutor conversation', matchOnDescription: true });
      if (!current(origin)) return { status: 'stale' };
      if (!choice || !choices.includes(choice)) return { status: 'cancelled' };
      return finish(await manager.switchConversation(choice.id));
    },
    async renameConversation() {
      const origin = identity(), record = manager.record();
      const title = await vscode.window.showInputBox({ title: 'KAFE: Rename Conversation', value: record.title,
        prompt: 'Enter a conversation title', validateInput: value => value.trim() && Array.from(value.trim()).length <= 120 && !/[\x00-\x1f\x7f]/.test(value) ? null : 'Use 1–120 characters on one line.' });
      if (!current(origin)) return { status: 'stale' };
      if (title === undefined) return { status: 'cancelled' };
      return manager.renameConversation(origin.id, title);
    },
    async deleteConversation() {
      const origin = identity(), title = manager.record().title;
      const choice = await vscode.window.showWarningMessage(`Delete the Tutor conversation “${title}”?`,
        { modal: true, detail: 'This removes its saved messages and draft from this workspace.' }, 'Delete conversation');
      if (!current(origin)) return { status: 'stale' };
      if (choice !== 'Delete conversation') return { status: 'cancelled' };
      return finish(await manager.deleteConversation(origin.id));
    },
    async exportConversation() {
      try {
        // Snapshot before the native dialog: changing chats cannot redirect this export.
        const selected = manager.selectedExport();
        const root = vscode.workspace.workspaceFolders?.[0]?.uri;
        const options = { title: 'KAFE: Export Conversation', saveLabel: 'Export JSON', filters: { JSON: ['json'] } };
        if (root) options.defaultUri = vscode.Uri.joinPath(root, selected.filename);
        else if (vscode.Uri.file) options.defaultUri = vscode.Uri.file(selected.filename);
        const destination = await vscode.window.showSaveDialog(options);
        if (!destination) return { status: 'cancelled' };
        await vscode.workspace.fs.writeFile(destination, Buffer.from(selected.json, 'utf8'));
        return { status: 'completed', id: selected.id };
      } catch {
        await vscode.window.showErrorMessage?.('The Tutor conversation could not be exported. Choose a writable location and try again.');
        return { status: 'failed', code: 'conversation_export_failed' };
      }
    },
  };
}

module.exports = { createConversationCommands };
