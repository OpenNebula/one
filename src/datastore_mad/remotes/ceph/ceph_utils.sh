rbd_rm_r() {
    local rbd rbd_base children snaps

    rbd=$1 # one/one-86-0@0 -or- one/one-86-
    rbd_base=${rbd%%@*} # one/one-86-0

    if [ "$rbd" != "$rbd_base" ]; then
        # arg is a snapshot (rbd=one/one-rbd86-0@0) => find children
        children=$($RBD children $rbd 2>/dev/null)

        for child in $children; do
            rbd_rm_r $child
        done

        $RBD snap unprotect $rbd
        $RBD snap rm $rbd
    else
        # arg is an rbd (rbd=one/one-86-0) => find snaps
        snaps=$($RBD snap ls $rbd 2>/dev/null| awk 'NR > 1 {print $2}')

        for snap in $snaps; do
            rbd_rm_r $rbd@$snap
        done

        $RBD rm $rbd
    fi
}


rbd_format() {
    $RBD info $RBD_SRC | sed -n 's/.*format: // p'
}

has_snapshots() {
    $RBD info $RBD_SRC-0@0 2>/dev/null
}
