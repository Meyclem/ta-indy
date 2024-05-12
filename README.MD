# Promocode API

> 📚 [Assessment Guidelines](GUIDELINES.MD)

Welcome to the Promocode API repository! 👋

🔎 **TLDR;** This API is a service allowing to:

- Create a promocode
- Get a promocode by name
- Validate a promocode under certain conditions

## Usage

### Installation

The API uses:

- node `20.12.2`.
- yarn `1.22.19`

In case you don't have them install, you can

- use [asdf](https://asdf-vm.com/guide/getting-started.html#_2-download-asdf) which will install the right versions based on the `.tool-versions` file.
- head to the [nodejs](https://nodejs.org/en/download/) and [yarn](https://classic.yarnpkg.com/en/docs/install) websites to install them manually.

Create a `.env` file at the root of the project with the following command:

```bash
cp -n .env.example .env
```

> 💡 Don't forget to populate it with your own variables 😁

Then install the dependencies:

```bash
yarn install
```

### Build the JS files

```bash
yarn build
```

### Start the API

```bash
## In local development mode
yarn dev

## In production mode
yarn start
```

### Linter

You can use eslint to help you format your code.

```bash
yarn lint
```

### Tests

```bash
yarn test
```

You can also separate the tests in two parts:

- Unit tests

```bash
yarn test:unit
```

- Integration tests

```bash
yarn test:integration
```

## Architecture

The main components of the project are:

- [src/index.ts](./src/index.ts): This is the entry point of the application. It sets up the server and ties all the other modules together.
- [src/server.ts](./src/server.ts): This module sets up the Express.js server and the API routes.
- [src/promocodes/](./src/promocodes/): This directory contains the logic related to promocodes. It includes:
  - [handlers.ts](./src/promocodes/handlers.ts): This file contains the handlers for the promocode-related routes.
  - [model.ts](./src/promocodes/model.ts): This file defines the data model for a promocode.
  - [validate.ts](./src/promocodes/validate.ts): This file contains the logic for validating promocodes.
- [src/services/weather.ts](./src/services/weather.ts): This module interacts with the weather API.
