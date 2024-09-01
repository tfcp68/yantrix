/** @param plop {import('@turbo/gen').PlopTypes.NodePlopAPI} */
module.exports = (plop) => {
	plop.setGenerator('create-package', {
		description: '',
		prompts: [
			{
				type: 'input',
				name: 'name',
				message: 'The name of the new package',
			},
			{
				type: 'input',
				name: 'description',
				message: 'The description of the new package.',
			},
		],
		actions: [
			{
				type: 'add',
				path: `${plop.getDestBasePath()}/../{{name}}/src/index.ts`,
				template: 'console.info(\'Hello from @yantrix/{{name}}\');',
			},
			{
				type: 'add',
				path: `${plop.getDestBasePath()}/../{{name}}/__tests__/.gitkeep`,
			},
			{
				type: 'addMany',
				destination: `${plop.getDestBasePath()}/../{{name}}`,
				templateFiles: ['templates/**'],
				globOptions: { dot: true },
				base: 'templates/default/',
				stripExtensions: ['hbs'],
			},
		],
	});
};
