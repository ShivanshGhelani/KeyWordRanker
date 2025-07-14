# Contributing to Google Keyword Rank Finder

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any Contributions You Make Will Be Under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report Bugs Using GitHub's [Issue Tracker](https://github.com/yourusername/GoogleExtensionKeywordRank/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/GoogleExtensionKeywordRank/issues/new).

## Write Bug Reports With Detail, Background, and Sample Code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Use a Consistent Coding Style

* 2 spaces for indentation rather than tabs
* You can try running `npm run lint` for style unification

## Development Setup

### Prerequisites

- Chrome browser (version 88+)
- Node.js (for testing and development tools)
- Git

### Installation

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/yourusername/GoogleExtensionKeywordRank.git
   cd GoogleExtensionKeywordRank
   ```

2. Install development dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

### Making Changes

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. Make your changes following the coding standards

3. Test your changes:
   ```bash
   npm test
   ```

4. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```

5. Push to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```

6. Create a Pull Request

### Project Structure

```
src/
├── popup/              # Extension popup interface
│   ├── popup.html      # Main UI structure
│   ├── popup.css       # Material design styles
│   └── popup.js        # Main application logic
├── scripts/            # Core functionality
│   ├── background.js   # Service worker
│   ├── content.js      # Content script injection
│   └── modules/        # Modular components
└── styles/             # Content script styles
    └── content.css     # Search result styling
```

### Code Style Guidelines

#### JavaScript
- Use ES6+ features
- Use `const` for constants and `let` for variables
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Add JSDoc comments for functions

#### CSS
- Use BEM methodology for class naming
- Use CSS custom properties for theming
- Follow mobile-first responsive design
- Use Flexbox and Grid for layouts

#### HTML
- Use semantic HTML5 elements
- Add proper ARIA attributes for accessibility
- Use data attributes for JavaScript hooks

### Testing

- Write unit tests for new functionality
- Test across different Chrome versions
- Test on different Google domains
- Verify accessibility standards

### Documentation

- Update README.md for new features
- Add inline code comments
- Update API documentation
- Include examples in documentation

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## References

This document was adapted from the open-source contribution guidelines for [Facebook's Draft](https://github.com/facebook/draft-js/blob/a9316a723f9e918afde44dea68b5f9f39b7d9b00/CONTRIBUTING.md)
