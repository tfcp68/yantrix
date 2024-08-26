---
title: Contributing
---

# Contributing

If you wish to contribute to the `yantrix` codebase or documentation, feel free to fork the repository and submit a pull request. We use [Turborepo](https://turbo.build/repo/docs ) and [PNPM](https://pnpm.io /) to manage the monorepository, therefore, for completeness of perception, we recommend that you familiarize yourself with the official documentation of each of them.

## 🪛 Prerequisites

Before you start working with the repository, make sure that you have the following tools <ins>globally</ins> installed:
- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/) (version `20.x.x` or later)
- [PNPM](https://pnpm.io/) (version `9.x.x` or later)

## 🚀 Quick Start

When working with the repository, do the following steps:
1) Fork and clone the repository (make sure you're on the `main` branch).
2) Run `pnpm install --frozen-lockfile`.
3) Run `pnpm build` to build local packages.
4) Сode whatever your heart desires.
5) Run `pnpm run test` to make sure you haven't messed up.
6) Push your local changes to your remote repository.
7) [Submit a pull request](https://github.com/tfcp68/yantrix/compare/tfcp68:yantrix:main...tfcp68:yantrix:main) (make sure you follow the [conventional commit format](02_git_commit_naming_convention.html)).
8) Voila, you're in business.

For advanced repository management, you can read [this](01_advanced_managment.html) article.
