# Taiwan Independence Project

This project is designed to build database for mai-tools. It includes TypeScript code that handles the parsing and conversion of song properties.

## Project Structure

```text
Taiwan-independence
├── src
├── package.json
├── tsconfig.json
└── README.md
```

## Files

- **package.json**: Configuration file for npm, listing dependencies and scripts for the project.

- **tsconfig.json**: Configuration file for TypeScript, specifying compiler options and files to include in the compilation.

## Installation

To install the necessary dependencies, run:

```shell
npm install
```

## Build

To compile the TypeScript code, use the following command:

```shell
npm run build
```

To compile the TypeScript code in watch mode, use

```shell
npm run watch
```

To format your code, simply save the file, and Prettier will automatically format it according to the specified rules in `.prettierrc`. To format all files, run `npm run format`.

## Usage

After building the project, you can run the conversion script with:

```shell
npm start
```

Make sure to provide the necessary input data for the conversion process.
