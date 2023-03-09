#!/bin/bash -xv

# GITHUB_BASE_REF refers to the target branch from the PR
BRANCH="$GITHUB_BASE_REF"

# or GITHUB_REF_NAME refers to the target branch from PUSH
if [ -z "$BRANCH" ]; then
    BRANCH="$GITHUB_REF_NAME"
fi

if [ -z "$BRANCH" ]; then
    echo "\$GITHUB_REF_NAME and \$GITHUB_BASE_REF empty"
    exit 0
fi

# only if target is stable branch like one-X.Y
if [[ $BRANCH =~ (^one-[0-9]*\.[0-9]*$) ]]; then

    PREVIOUS_ONE_INSTALL=~/previous.install
    mkdir $PREVIOUS_ONE_INSTALL
    CURRENT_ONE_INSTALL=~/current.install
    mkdir $CURRENT_ONE_INSTALL

    FIRST_RELEASE=$(echo "$BRANCH" | sed -r 's/^one-([0-9]+\.[0-9]+)/release-\1.0/')

    cd "$GITHUB_WORKSPACE"
    git fetch --tags origin --quiet

    # if already exists release-X.Y.0 branch
    if git rev-list ${FIRST_RELEASE}.. --quiet; then
        ORIGINAL_HEAD=$(git rev-parse HEAD)

        # Always restore original HEAD for following some tests
        trap "git reset --hard $ORIGINAL_HEAD"  EXIT

        # reset and install first stable release
        git reset --hard $FIRST_RELEASE
        echo "First release $FIRST_RELEASE commit:"
        git --no-pager log -1
        ./install.sh -d $PREVIOUS_ONE_INSTALL &>/dev/null

        # reset and install current
        git reset --hard $GITHUB_SHA
        echo "Current commit $GITHUB_SHA:"
        git --no-pager log -1
        ./install.sh -d $CURRENT_ONE_INSTALL &>/dev/null

        echo "Testing conf changes:"
        diff -r $PREVIOUS_ONE_INSTALL/etc $CURRENT_ONE_INSTALL/etc
        rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
        diff -r $PREVIOUS_ONE_INSTALL/var/remotes/etc $CURRENT_ONE_INSTALL/var/remotes/etc
        rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

    else
        echo "Tag $FIRST_RELEASE not found, considering safe"
    fi
fi
