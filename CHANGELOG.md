# Changelog

All notable changes to the Autopen project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
Features planned for future releases.

## [0.1.1] - 2023-07-15
### Changed
- Rebranded application from "Textera" to "Autopen"
- Updated all references in the codebase including UI elements, cache keys, and API headers
- Updated documentation to reflect the new brand name

## [0.1.0] - 2023-07-01
Initial development release.

### Added
- Initial project setup with React 18, TypeScript, and Vite
- Supabase integration for authentication and database services:
  - User profiles
  - Project storage
  - Brain dump sessions
  - Analysis results
- TailwindCSS for responsive UI styling
- User authentication system with login, signup, and account management
- Brain Dump feature for capturing user thoughts with real-time processing
- Analysis system for processing user input and categorizing content
- User Dashboard showing:
  - Recent projects
  - Activity statistics
  - Quick actions
- Project management system:
  - Create new projects
  - View existing projects
  - Edit project details
  - Delete projects
- Creator mode with specialized tools for content creation
- Settings interface for:
  - Account preferences
  - Privacy settings
  - Notification controls
- Comprehensive documentation (README.md and CHANGELOG.md)
- Supabase RLS (Row Level Security) configuration scripts for data protection

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A 

## Types of changes
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities. 