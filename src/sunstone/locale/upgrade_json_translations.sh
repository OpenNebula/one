#!/bin/bash

languages="en_US fr_FR it_IT pt_PT ru"

for lang in $languages; do
    echo "Upgrading $lang..."
    ./po2json.rb languages/$lang.po > ../public/locale/$lang/$lang.js
done