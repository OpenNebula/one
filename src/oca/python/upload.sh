#!/bin/bash

pip install twine

# Read https://github.com/pypa/twine#keyring-support for authentication setup for $TWINE_USERNAME

export TWINE_USERNAME=opennebula
export TWINE_REPOSITORY_URL="https://test.pypi.org/legacy/" # Test repo until the process is fully automated

twine upload dist/*
