import { createGameApplication, TGameApplication } from './runtime/createGameApplication';

import { createBrowserGameStorage } from './runtime/storage';
import { GameView } from './ui/GameView';
import './style.css';

async function boot(): Promise<void> {
	const storageChoice = createBrowserGameStorage();
	let application: TGameApplication | null = null;
	const view = new GameView({
		place: (x, y) => view.runCommand(async () => {
			application?.commands.place(x, y);
			await application?.flushCommands();
		}),
		nova: (x, y) => view.runCommand(async () => {
			application?.commands.nova(x, y);
			await application?.flushCommands();
		}),
		reset: () => view.runCommand(async () => {
			application?.commands.reset();
			await application?.flushCommands();
		}),
	});
	application = await createGameApplication({
		storage: storageChoice.storage,
		render: model => view.render(model),
		onStorageError: failure => view.reportStorageError(
			failure.error instanceof Error ? failure.error.message : String(failure.error),
		),
	});
	view.render(application.store.get());
	view.setRuntimeStatus(
		storageChoice.persistent ? '● Local save active' : '● Ephemeral memory save',
		storageChoice.persistent,
	);

	let disposing = false;
	const dispose = (): void => {
		if (disposing) return;
		disposing = true;
		view.dispose();
		void application?.dispose();
	};
	window.addEventListener('pagehide', dispose, { once: true });
}

void boot().catch((error: unknown) => {
	const status = document.getElementById('runtimeStatus');
	if (status) status.textContent = error instanceof Error ? error.message : String(error);
});
