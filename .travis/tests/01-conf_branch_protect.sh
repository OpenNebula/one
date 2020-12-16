#!/bin/bash -xv

# **previous** refers to the code base in the main repository
# **current**  refers to the code base of the PR (or the new commit)

if [[ $TRAVIS_BRANCH =~ (^one-) ]]; then
    export PREVIOUS_ONE=~/previous.one
    export CURRENT_ONE=$TRAVIS_BUILD_DIR
    export PREVIOUS_ONE_INSTALL=~/previous.install
    export CURRENT_ONE_INSTALL=~/current.install

    # Checkout previous code base
    git clone https://github.com/OpenNebula/one $PREVIOUS_ONE
    (cd $PREVIOUS_ONE ; git checkout $TRAVIS_BRANCH)
    # In a PR we compare with the head of $TRAVIS_BRANCH
    # Otherwise, we want to check with the previous commit
    if [[ $TRAVIS_PULL_REQUEST == false ]]; then
        (cd $PREVIOUS_ONE ; git checkout HEAD~1)
    fi

    # Debug information
    echo "Previous commit:"
    (cd $PREVIOUS_ONE ; git --no-pager log -1)
    echo "----------------"
    echo "Current commit:"
    (cd $CURRENT_ONE ; git --no-pager log -1)
    echo "----------------"

    # Install previous and current code base
    (cd $PREVIOUS_ONE ; ./install.sh -d $PREVIOUS_ONE_INSTALL &> /dev/null)
    (cd $CURRENT_ONE  ; ./install.sh -d $CURRENT_ONE_INSTALL &> /dev/null)

    echo "Testing conf changes:"
    diff -r $PREVIOUS_ONE_INSTALL/etc $CURRENT_ONE_INSTALL/etc
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
    diff -r $PREVIOUS_ONE_INSTALL/var/remotes/etc $CURRENT_ONE_INSTALL/var/remotes/etc
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
fi

exit 0
