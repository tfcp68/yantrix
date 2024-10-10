import { execSync } from 'node:child_process';

function runPreBuild() {
	console.log('Starting pre-build process...');
	execSync('node scripts/preBuild.js', { stdio: 'inherit' });
	console.log('Pre-build process completed.');
}

function runVitepressBuild() {
	console.log('Starting Vitepress build...');
	execSync('vitepress build', { stdio: 'inherit' });
	console.log('Vitepress build completed.');
}

function runAfterBuild() {
	console.log('Starting after-build process...');
	execSync('node scripts/afterBuild.js', { stdio: 'inherit' });
	console.log('After-build process completed.');
}

function main() {
	try {
		runPreBuild();
		runVitepressBuild();
		runAfterBuild();

		console.log('All build steps completed successfully.');
	} catch (error) {
		console.error('An error occurred during the build process:', error);
		process.exit(1);
	}
}

main();
