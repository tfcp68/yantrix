---
title: Advanced Repository Management
---

# Advanced Repository Management
This article contains information about the maintenance and development of the `yantrix` monorepository at a more advanced level. If you are serious about working in our repository, then it would not be superfluous to familiarize yourself with this page.

## 🏗️ Creating a new package

If you want to create a completely new package, just run the following command in the root of the `yantrix` monorepository:
```sh
pnpm create-package <new-package-name> [new-package-description]
```
This will create a new package under the `packages/` folder according to a predefined template. All you have to do is go to it `cd packages/<your-new-package>` and start making magic.

> [!IMPORTANT]
> You do not need to specify the organization prefix `@yantrix/` in the name of the new package, because the script itself formats the name according to the principle of `<package-name>` → `@yantrix/<package-name>`.

## 📝 Local testing

If you want to test your innovations locally (for example, in another cloned repository), do the following:
1) From the root of the `yantrix` repository, build all packages `pnpm build`.
2) Move to the repository where you want to test the package `cd <path-to-your-project>` OR create a new one `mkdir <name-of-the-new-project>` → `cd <name-of-the-new-project>` → `pnpm init` OR initialize a new monorepository using `pnpm dlx create-turbo@latest`.
3) Now clone the required package from the `yantrix` repository `pnpm link <PATH_TO_YANTRIX_REPO>/packages/<required-package>`.
4) Import what you need from the package and test it.

Also, you can install a local package on a system-wide scope by specifying the `--global` flag. While inside the package, run `pnpm link --global` or from any other location `pnpm link --global <PATH_TO_YANTRIX_REPO>/packages/<required package>` - it will be the same as if you installed something globally, like `pnpm -g <something>` (it is useful if you are working on some kind of CLI utility)

> [!TIP]
> Since we are dealing with TypeScript, we need to rebuild the necessary package after each change. To get rid of this routine, you can automate this by adding the `--watch` flag to the `yantrix` package build script. In the root of the `yantrix` repository, run `pnpm turbo run build --filter='@yantrix/<some-package>' -- --watch`.

If you want to use a specific package in another package in the same monorepository, just add it to the dependencies using `workspace:^` as package version, e.g.:
```json
{
	"dependencies": {
		"@yantrix/<some package>": "workspace:^"
	}
}
```
