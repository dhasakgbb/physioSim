# Contributing to PhysioSim

Thank you for your interest in contributing to PhysioSim! We welcome contributions from the community to help improve this harm reduction tool.

## Code of Conduct

Please note that this project is intended for **harm reduction education only**.

- Do not promote dangerous usage.
- Do not share sources for controlled substances.
- Keep discussions respectful and focused on science/data.

## How to Contribute

### Reporting Bugs

1. Check the [Issues](https://github.com/yourusername/physioSim/issues) tab to see if the bug has already been reported.
2. Open a new issue with a clear title and description.
3. Include steps to reproduce, expected behavior, and screenshots if possible.

### Suggesting Enhancements

1. Open a new issue with the "enhancement" label.
2. Describe the feature you'd like to see and why it would be valuable.

### Pull Requests

1. Fork the repository.
2. Create a new branch for your feature or fix: `git checkout -b feature/amazing-feature`.
3. Make your changes.
4. Run tests to ensure no regressions: `npm test`.
5. Commit your changes with clear messages.
6. Push to your branch: `git push origin feature/amazing-feature`.
7. Open a Pull Request.

## Development Setup

1. Clone the repo: `git clone https://github.com/yourusername/physioSim.git`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Data Contributions

**CRITICAL**: Do NOT modify `src/data/compoundData.js` without rigorous sourcing.

If you have new human RCT data:

1. Provide full citation (journal, DOI, authors, year, sample size).
2. Document methodology in `DESIGN.md`.
3. Update `compoundData.js` with Tier 1 flag.
4. Narrow uncertainty bands.
5. Add to test suite.

If you have anecdotal aggregates:

1. Document sample size and aggregation method.
2. Flag as Tier 4.
3. Widen uncertainty bands.
4. Add caveats.

## Style Guide

- Use functional React components with Hooks.
- Follow the existing folder structure.
- Ensure all new components have corresponding tests.
- Run `npx prettier --write .` before committing.

Thank you for helping make PhysioSim better!
