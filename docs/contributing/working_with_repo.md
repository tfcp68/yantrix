---
title: Repository Structure
---

The repository is organized into packages with help of [Lerna](https://lerna.js.org/): an open source multi-package repository management tool. It allows developers to manage multiple packages in a single monorepository, including versioning, publishing, dependency management, and building.

## Installation

You can use your prefered package manager:

```bash
npm install -g lerna
yarn global add lerna
pnpm install -g lerna
```

## Creating a new monorepo

```bash
lerna init
```

This command creates a directory structure for your monorepository and install Lerna into it.

## Creating new package

```bash
lerna create <имя нового пакета>
```

For instance, **`lerna create my-package`** creates a directory **packages/my-package** and fills it with template files for a new package (same as creating **my-package** inside **packages** and running a new package initialization command, like**`npm init`**. You then can edit those files and adapt them to your needs

## Installing dependencies

Starting from `7.0.0`, **Lerna** has deprecated certain ways of managing packages, such as**`bootstrap`**, **`add`**, and **`link`**. It's now recommended to use your favorite package manager (**`npm`**, **`yarn`**, **`pnpm`**) for building and linking packages.

Now, to install the dependencies of all packages in the root of your monorepository, just run one of the following commands:

```bash
npm install
pnpm install
yarn
```

Besides installation, this will link all of the dependencies together, allowing them to be used as dependencies (similar to if you did **`npm link`** in the root of each package and then **`npm link <package name>`** in root of the monorepository).

## Version management

**Lerna** comes with a **`version`** command that allows you to version your package, commit the changes and mark them accordingly. To change the version of all packages use the following command:

```bash
lerna version --no-private
```

You should see the similar output:

```bash
lerna notice cli v5.1.2
lerna info current version 1.0.0
lerna info Assuming all packages changed
? Select a new version (currently 1.0.0) (Use arrow keys)
❯ Patch (1.0.1)
Minor (1.1.0)
Major (2.0.0)
Prepatch (1.0.1-alpha.0)
Preminor (1.1.0-alpha.0)
Premajor (2.0.0-alpha.0)
Custom Prerelease
Custom Version
```

Note that by passing **`--no-private`** we exclude all packages that are marked as private in their **package.json**.

Lerna detects current packages, determines the current version and prompts you to select the next one. Note that you can also pass the new version directly like this:

```bash
lerna version 1.0.0
```

Once a version is selected, **Lerna**:

-   updates **package.json** with the version number
-   commits the change
-   adds the appropriate version tag (e.g. v1.0.0)
-   pushes the commit and the tag to the remote repository.

If you want to update the version of a specific package, use the **`--scope`** flag, for example:

```bash
lerna version <version> --scope my-package
```

## Publishing to NPM

```bash
lerna publish
```

You can also publish packages to a local **NPM** registry using utilities such as [**yalc**](https://www.npmjs.com/package/yalc) and [**verdaccio**](https://verdaccio.org/).

## Using options

**Lerna** has many [**options**](https://lerna.js.org/docs/api-reference/commands#options), which allow you to customize the behavior of certain commands. Here're some:

-   **`--scope`**: allows you to work only with the specified package.
-   **`--ignore`**: allows you to ignore the specified packages.
-   **`--concurrency`**: allows you to configure the number of parallel tasks.
-   **`--no-private`**: excludes private packages (they are enabled by default).
-   **`--since [ref]`**: Include only those packages that were changed after the specified **`ref`** .

## Using Lerna with Git

Lerna integrates well with **Git**. It can automatically generate commits and tags for package version changes. You can use the following commands to work with **Git** in **Lerna**:

-   **`lerna changed`**: Shows packages that were changed in the last commit.
-   **`lerna diff`**: Shows the differences between two versions of the specified package.
-   **`lerna exec <command> --since <last-version>`**: Runs the command for all packages that have changed since the latest version.

## Managing dependencies

You can use your preferred package manager to add a dependency that will be used by all packages. For example, if you want to install **[lodash-es](https://www.npmjs.com/package/lodash-es)**, you can use one of the following commands in the root of the repo:

```bash
npm install lodash-es
yarn add lodash-es
pnpm install lodash-es
```

If you only want to add a dependency for a specific package, you'll need to consult your package manager's documentation. For example, if you want to add a **react** dependency only for the **my-package** package, you can run one of the following commands:

```bash
yarn workspace <package name> add react
pnpm add react --filter=<package name>
npm install react --workspace=<package name>
```

Removing a dependency occurs in the same way:

```bash
yarn workspace <package name> remove react
pnpm remove react --filter=<package name>
npm remove react --workspace=<package name>
```

Updating dependencies also depends on the specifics of your package manager. For example, **`yarn`** has its own system of **[plugins](https://yarnpkg.com/features/plugins)**, one of which allows you to interactively update each dependency in your monorepository. So by running the command **`yarn upgrade-interactive`**, in the terminal you will see a choice of updating dependencies like this:

```bash
Press <up>/<down> to select packages. Press <enter> to install.
Press <left>/<right> to select versions. Press <ctrl+c> to abort.

? Pick the packages you want to upgrade. Current Range

 > @commitlint/cli ----------------------------- ◉ ^17.6.3 ------ ◯ ^17.6.6
 @commitlint/config-conventiona ------------- ◉ ^17.6.3 ------ ◯ ^17.6.6
 @types/underscore --------------------------- ◉ ^1.11.4 ------ ◯ ^1.11.5
 @typescript-eslint/eslint-plugin ------------ ◉ ^5.59.7 ------ ◯ ^5.61.0
 @typescript-eslint/parser ------------------- ◉ ^5.59.7 ------ ◯ ^5.61.0
 @vitest/coverage-c8 ------------------------- ◉ ^0.31.1 ------ ◯ ^0.31.4
 eslint -------------------------------------- ◉ ^8.41.0 ------ ◯^8.44.0
 lerna--------------------------------------- ◉ ^6.6.2 ----- -- ◯ ^7.1.1
 lint-staged --------------------------------- ◉ ^13.2.2 ------ ◯ ^13.2 .3
 mermaid ------------------------------------- ◉ 10.1.0 ------- ◯ 10.2.4
 prettier -------------------------------------------------- ◉ ^2.8.8 ------- ◯ ^3.0.0
 typescript ---------------------------------- ◉ ^5.0.4 ------- ◯ ^5.1 .6
 vitest ------------------------- ◉ ^0.31.1 ------ ◯ ^0.31.4
```

For **`npm`** and **`pnpm`** there is an analogue - **[npm-check](https://www.npmjs.com/package/npm-check)**. To launch the interactive user interface for selecting dependencies for an update, first install the utility:

```bash
# locally as a dev dependency
npm install npm-check -D
yarn add npm-check -D
pnpm install npm-check -D

# or globally
npm install npm-check -g
yarn global add npm-check
pnpm install npm-check -g
```

and run it in the root of your monorepository with the **`--update`** flag:

```bash
npm-check --update
```

An interactive interface (similar to that of **`yarn upgrade-interactive`**) will appear in the terminal.

## How to build packages?

**Lerna** makes it easy to build all packages in a monorepository. You can use the **`lerna run build`** command to run the **`build`** command for each package in the monorepository. For example, if you want to build all the packages in a monorepository, you can run the following command:

```bash
lerna run build
```

If you want to build only a specific package, you can use the **`--scope`** flag. For example, if you only want to build a specific package, you can run the following command:

```bash
lerna run build --scope @monorepo/my-package-name
```

IMPORTANT! Specify only the name specified in the **name** field in the **package.json** of the package you want to interact with.

**Lerna** also allows you to define specific scripts for each package in a monorepository. To do this, you can add scripts with the **`lerna`** prefix (for example, **`lerna:build`**) in the **`package.json`** file of each package. You can then use the **`lerna run`** command to run these scripts for all packages in the monorepository.

## How to install packages locally?

Once you have built your packages, you can use them in other projects by including them as dependencies. Depending on where your monorepository is located, you can use different methods to install dependencies. If you use packages in the same monorepository (for example, for other packages in the **packages/** folder). Then you can simply specify **`*`** as the package source, for example:

```json
{
	"dependencies": {
		"my-package": "*"
	}
}
```

If you intend to use the package in other projects locally, you can use the **`npm link`**, **`yarn link`** or **`pnpm link`** commands to install the bundled packages into another project. For example, if you want to include the **my-package** package from your monorepository into another project, you can run the following commands:

```bash
cd packages/my-package
npm link
cd /path/to/another/project
npm link my-package
```

These commands will create a symbolic link to the **my-package** package in another project, using the installed package locally on your machine.

## Conclusion

This was a short guide to the main **Lerna** features and commands that can help you when working with monorepositories. **Lerna** can greatly simplify the process of developing and managing dependencies in large projects, so if you are working on a project that can be organized into a monorepository, it is recommended that you explore Lerna in more detail in the [official documentation](https://lerna. js.org/docs/introduction).
