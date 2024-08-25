---
title: Contributing
---

# Contributing

We use [Turborepo](https://turbo.build/repo/docs) to manage the monorepository, so we recommend that you familiarize yourself with its official documentation for full-fledged work

## Prequisites

Before you start working with the repository, make sure that you have the following tools <ins>globally</ins> installed:
- [NodeJS v20.x](https://nodejs.org/)
- [PNPM v9.x](https://pnpm.io/)

## Setup

When working with the repository, do the following steps:
1) Fork and clone the repository (make sure you're on the `main` branch)
2) Run `pnpm install --frozen-lockfile`
3) Run `pnpm build` to build local packages
4) Сode whatever your heart desires
5) Run `pnpm run test` to make sure you haven't messed up
6) Add and push your local changes to your remote repository
7) [Submit a pull request](https://github.com/tfcp68/yantrix/compare/tfcp68:yantrix:main...tfcp68:yantrix:main)
8) Voila, you're in business

For advanced repository management, you can read [this](01_advanced_managment.md) article
