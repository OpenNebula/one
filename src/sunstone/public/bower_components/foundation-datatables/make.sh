#!/bin/sh

OUT_DIR=$1
DEBUG=$2

# Change into script's own dir
cd $(dirname $0)

DT_SRC=$(dirname $(dirname $(pwd)))
DT_BUILT="${DT_SRC}/built/DataTables"
. $DT_SRC/build/include.sh

# Only copying the integration files
rsync -r integration     $OUT_DIR

scss_compile $OUT_DIR/integration/jqueryui/dataTables.jqueryui.scss

