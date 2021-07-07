## GitHub Actions smoke tests

The `share/smoke_tests/tests` directory contains scripts for each smoke test.

The smoke_test.sh script is called which iterates on each script, and it exits and logs on any failure. To add more tests, simply create a new file on `share/smoke_tests/tests`.

Each test should:

 - have a number as prefix to define the order. Renaming is allowed, the rule is to execute the less costly tests (in time) first
 - return 0 on success, other number on error
