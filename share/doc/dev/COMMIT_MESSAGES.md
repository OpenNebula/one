
# Formatting commit messages in OpenNebula repo

It is extremely important to be able to link changes in the code to specific issues (bugs, features or linting actions). Therefore, commit messages MUST conform to the following rule.

## Commit messages format

### First line

First line of commit messages must have the following structure:

```
  % {type} #%{issue_number}: %{description}
```

Where type must be one of the following:

 - revert
 - F (for new functionality)
 - B (for bug fixing)
 - L (for linting)
 - M (for minor changes with no issue, use the "M #-:" syntax in this case)

Issue number must refer to a GitHub issue of the OpenNebula/one repo

Description needs to be a succinct explanation of the code.

Overall length should be equal or less than 50 characters (this is not enforced)

### Following lines

Remaining text should be wrapped at 72 characters.
