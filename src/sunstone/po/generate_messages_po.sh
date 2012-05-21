#!/bin/bash

languages="en_US it_IT"


find ../public/js -name *.js > file_list.txt
xgettext --from-code=utf-8 --keyword=tr -L python -f file_list.txt -p .
for lang in $languages; do
#msgmerge $lang messages.pot #sin probar
msginit  -l $lang -o $lang.po
done