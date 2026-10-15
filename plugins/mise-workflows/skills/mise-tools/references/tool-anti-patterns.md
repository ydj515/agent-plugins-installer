# Tool Anti-Patterns

- Reaching for a legacy backend when a registry short name or core tool exists
- Keeping the deprecated `ubi:` backend (removed in 2027.1.0)
- Combining tools ad hoc without a profile
- Keeping a very old major without a selector floor
- Storing `latest` or npm-style ranges such as `^24` in tracked config
- Guessing selectors that `mise ls-remote` does not list
- Ignoring registry backend change warnings and editing the lockfile by hand
