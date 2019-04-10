#!/bin/bash

echo $TRAVIS_BRANCH
exit -1

if [[ $TRAVIS_BRANCH == '1.0.-stable' ]]
  cd test/dummy
  rake db:schema:load
else
  cd spec/dummy
  rake db:schema:load
fi
