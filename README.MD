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

In case you don't have them installed, you can:

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

### Endpoints

#### `POST /promocodes`

Creates a new promocode. Accepts a JSON object in the request body with the following type:

```ts
type Condition = {
  age?: { eq?: number; gt?: number; lt?: number };
  date?: { after?: Date; before?: Date };
  weather?: {
    is:
      | "Atmosphere"
      | "Clear"
      | "Clouds"
      | "Drizzle"
      | "Mist"
      | "Rain"
      | "Snow"
      | "Thunderstorm";
    temp?: { eq?: number; gt?: number; lt?: number };
    or?: Condition[]; // min 2 conditions
    and?: Condition[]; // min 2 conditions
  };
};

type Promocode = {
  name: string;
  advantage: { percent: number };
  restrictions: Condition[];
};
```

**Responses:**

- ✅ `201`: The promocode was successfully created, and the response body contains the created promocode.
- ❌ `400`: The request body is invalid.

#### `POST /promocodes/validate`

Validates a promocode. Accepts a JSON object in the request body with the following type:

```ts
type Context = {
  age?: number;
  date?: Date;
  town?: string;
};
```

**Responses:**

- ✅ `200`: The promocode was successfully validated, and the response body contains the promocode name and the advantage.
  If the promocode is valid:

  ```ts
  type Response = {
    promocode_name: string;
    status: "accepted";
    advantage: { percent: number };
  };
  ```

  If the promocode is invalid:

  ```ts
  type ValidationResult = {
    condition: string;
    success: boolean;
    reasons?: string[] | ValidationResult[];
  };

  type Response = {
    promocode_name: string;
    status: "rejected";
    reasons: {
      condition: string;
      success: boolean;
      reasons: string[] | Response[];
    }[];
  };
  ```

- ❌ `400`: The request body is invalid.
- ❌ `404`: A promocode with the given name does not exist.
- ❌ `500`: An error occurred while trying to get the weather data.

### Linter

You can use eslint to help you format your code.

```bash
yarn lint
```

### Tests

```bash
yarn test
```

During development process, you can use the watch mode:

```bash
yarn test:watch
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
- [src/server.ts](./src/server.ts): This module sets up the Express server and the API routes.
- [src/promocodes/](./src/promocodes/): This directory contains the logic related to promocodes. It includes:
  - [handlers.ts](./src/promocodes/handlers.ts): This file contains the handlers for the promocode-related routes.
  - [model.ts](./src/promocodes/model.ts): This file defines the data model for a promocode.
  - [validate.ts](./src/promocodes/validate.ts): This file contains the logic for validating promocodes.
- [src/services/weather.ts](./src/services/weather.ts): This module interacts with the weather API.
- [tests/](./tests/): This directory contains the tests for the application, divided into unit and integration tests.

## Validation Algorithm

I wanted to have a fully recursive algorithm to validate the promocode.
At the moment it is not limited to a certain depth, but it could be easily implemented by adding a parameter to the function.

Following this principle, I also wanted to have a recursive way of showing validation errors in the response.

Here is an example of a successful validation:

```js
{
  "condition": "age",
  "success": true
}
```

And here is an example of a failed validation:

```js
{
  "condition": "weather",
  "success": false,
  "reasons": [
    "Current weather for Paris 'Rain' is not 'Clear'",
    {
      "condition": "temperature",
      "success": false,
      "reasons": ["Given temperature 20 is not equal to 10"]
    }
  ]
}
```

This result is then used to build the response to the user. For example, given this promocode:

```js
{
  "name": "Tens",
  "advantage": { "percent": 10 },
  "restrictions": [
    {
      "or": [
        {
          "age": {
            "eq": 20
          }
        },
        {
          "age": {
            "eq": 30
          }
        }
        // ...
      ]
    }
  ]
}
```

#### SUCCESS ✅

```js
// request body
{
  "promocode_name": "Tens",
  "arguments": {
    "age": 20
  }
}
// response
{
  "promocode_name": "Tens",
  "status": "accepted",
  "advantage": {
    "percent": 10
  }
}
```

#### FAILURE ❌

```js
// request body
{
  "promocode_name": "Tens",
  "arguments": {
    "age": 25
  }
}

// response
{
  "promocode_name": "Tens",
  "status": "rejected",
  "reasons": [
    {
      "condition": "or",
      "success": false,
      "reasons": [
        {
          "condition": "age",
          "success": false,
          "reasons": [
            "Given age 25 is not equal to 20"
          ]
        },
        {
          "condition": "age",
          "success": false,
          "reasons": [
            "Given age 25 is not equal to 30"
          ]
        },
        // ...
      ]
    }
  ]
}
```

## Technical Choices

### Zod

I decided to use [Zod](https://zod.dev/) to facilitate the validations across the application.

For instance, in [src/promocodes/model.ts](src/promocodes/model.ts), Zod is used to define schemas for different conditions (`numberComparisonSchema`, `dateRangeSchema`, `weatherComparisonSchema`). These schemas are then used to validate the structure and types of data received, ensuring that the data conforms to the expected format.

In [src/promocodes/validations.ts](src/promocodes/validations.ts), the `promocodeValidation` function uses Zod to parse and validate a Promocode object. If the object doesn't match the schema, Zod will throw an error.

## Improvements

With more time, I would have liked to:

- Improve the error handling, especially in the validation algorithm which only throws a `ValidationError` with a simple message. I would have liked to have a more detailed error message.
- Add more tests, especially edge cases.
- Some tests are not easy to read and understand, I would have liked to refactor them.
- Types could be improved in some places.

> 👀 I added some coments in the code to explain some choices and talk about some improvements so you can see the related code.
