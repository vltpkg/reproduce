# Contributing to Reproduce

Thank you for your interest in contributing to Reproduce! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies with `vlt install`
3. Build the project with `vlr build`
4. Run tests with `vlr test`

## TypeScript

This project uses TypeScript. Make sure to:

1. Write all new code in TypeScript
2. Include appropriate type definitions
3. Run `vlx tsc` to check for type errors

## Linting

We use ESLint for code quality. Please follow these guidelines:

1. Run `vlr lint` to check for linting issues
2. Run `vlr lint:fix` to automatically fix linting issues
3. Ensure your code follows the linting rules before submitting a PR

## Testing

We use Node.js's built-in test runner for testing. Please follow these guidelines:

1. Write tests for all new features
2. Ensure all tests pass before submitting a PR
3. Organize tests into appropriate suites (unit tests and integration tests)

## Pull Request Process

1. Create a branch with a descriptive name
2. Make your changes and commit them with clear, concise commit messages
3. Ensure all tests pass and there are no type errors or linting issues
4. Submit a pull request with a clear description of the changes
5. Address any feedback from reviewers

## Code Style

- Use consistent indentation (2 spaces)
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic

## License

By contributing to Reproduce, you agree that your contributions will be licensed under the project's MIT license.
