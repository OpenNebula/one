# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

# rubocop:disable Layout/HeredocIndentation, Layout/IndentationWidth
module TransferManager

  # Functions to generate shell code. Mostly ported from mad/sh/scripts_common.sh
  module Shell

    def self.retry_if_no_error
      <<~SCRIPT
        # Retries if command fails and STDERR matches
        function retry_if_no_error
        {
          MATCH=$1
          TRIES=$2
          SLEEP=$3
          shift 3

          unset TSTD TERR RC

          while [ $TRIES -gt 0 ]; do
            TRIES=$(( TRIES - 1 ))

            eval "$( ("$@" ) \
                    2> >(TERR=$(cat); typeset -p TERR) \
                    > >(TSTD=$(cat); typeset -p TSTD); RC=$?; typeset -p RC )"

            [ $RC -eq 0 ] && break

            if echo "$TERR" | grep -q "$MATCH"; then
                sleep $SLEEP;
                continue
            fi

            break
          done

          [ -n "$TERR" ] && echo $TERR >&2
          [ -n "$TSTD" ] && echo $TSTD
          return $RC
        }
      SCRIPT
    end

    def self.qcow2_snapshot_functions
      # ------------------------------------------------------------------------
      # Backing File managment functions:
      #  * scan_backing_files() creates an associative map with snap_id -> backing
      #    file. The backing file can be:
      #    - null (no backing file)
      #    - /var/lib/one/datastores/0/b1ef2345.snap/1 (persistent - shared)
      #    - 2 (persistent/non persistent - local)
      #    - disk.0.snap/4 (non persistent -shared)
      #
      #  * is_parent() returns the child (if any) of a given snapshot (uses the
      #    map)
      #
      #  * do_live() checks if virsh or qemu-img should be use (a running VM
      #    can delete snapshots outside of current backingstore, e.g. because
      #    a revert)
      #
      #  * delete() removes the snapshot from the backing chain using qemu-img
      #    rebase virsh blockcommit or blockpull as needed.
      #
      # IMPORTANT: backing chain can be relative to the disk folder (e.g.
      # disk.0.snap/3) or just id (e.g. 3)
      # ------------------------------------------------------------------------
      <<~SCRIPT
        set -e -o pipefail

        scan_backing_files() {
          local -n bfs=$1
          local snap_dir=$2

          for i in $(ls "${snap_dir}"); do
            f=$(realpath -s "${snap_dir}/${i}")

            [ ! -f ${f} ] && continue
            [[ "${f}" =~ \\.current ]] && continue

            bf=$(qemu-img info -U --output json "${f}" | jq -r '."backing-filename"')
            ky="${f##*/}"

            if [[ "${bf:0:1}" = "/" || "${bf}" =~ ^[0-9]+$ ]] ; then
                bfs["${ky}"]="${bf}"
            elif [ "${bf}" = "null" ]; then
                bfs["${ky}"]="null"
            else
                bfs["${ky}"]="${snap_dir}/${bf##*/}"
            fi
          done
        }

        is_parent() {
          local -n bfs=$1
          local snap=$(echo "$2/$3" | tr -s '/')

          local child=""

          for file in "${!bfs[@]}"; do
            bfile=$(echo "${bfs[$file]}" | tr -s '/')

            if [ "${snap}" = "${bfile}" -o "${snap}" = $(realpath ${bfile}) -o \
                 "$3" = "${bfile}" ]; then
                child="${file}"
                break
            fi
          done

          echo "${child}"
        }

        do_live() {
          local domid=$1
          local state=$2

          local snap_id=$3
          local virsh=$4

          local found=""
          local dbs=()

          if [ "${state}" != "59" ]; then
              echo "${found}"
              return 0
          fi

          bs=$(${virsh} dumpxml "${domid}" | \
              xmllint --xpath '//backingStore/source/@file' - | \
              sed -e 's/file=/\\n/g' | tr -d '"')

          while IFS= read -r f; do
            f=$(echo ${f} | sed 's/[[:space:]]*$//')

            id="${f##*/}"
            dbs+=("${id}")

            if [ "${id}" = "${snap_id}" ]; then
                found="${snap_id}"
            fi
          done <<< "${bs}"

          echo "${found}"
        }

        get_current_path() {
          local snap_dir=$1
          local snap_id=$2

          local current=""

          for i in $(ls ${snap_dir}/*.current); do
            current=$(cat "${i}")

            #This snapshot represent another one (is in a .current file)
            if [ "${current##*/}" = "${snap_id}" ]; then
                echo "${i}"
                return 0
            fi
          done

          echo "${snap_dir}/${snap_id}.current"
        }

        delete_snapshot() {
          declare -gA backing_files

          local dpath=$1
          local target=$2
          local snap_dir=$3
          local snap_id=$4
          local vm_id=$5
          local vm_st=$6
          local active=$7
          local virsh=$8
          local qemu=$9
          local local=${10}

          scan_backing_files backing_files "${snap_dir}"

          # --------------------------------------------------------------------
          # Re-define snap_id if current exists and set snap_path
          # --------------------------------------------------------------------
          local current=""
          local cmd=""
          local rm_current=""

          if [ -f "${snap_dir}/${snap_id}.current" ]; then
            rm_current="rm ${snap_dir}/${snap_id}.current"

            current=$(cat "${snap_dir}/${snap_id}.current")
            snap_id="${current##*/}"
          fi

          local snap_path="${snap_dir}/${snap_id}"

          # --------------------------------------------------------------------
          # Set base snapshot for the delete operation
          # --------------------------------------------------------------------
          local base="${backing_files[$snap_id]}"

          local vbase=""
          local qbase=""

          if [ "${base}" = "null" ]; then
            vbase=""
            qbase='-b ""'
          else
            vbase="--base ${base}"
            qbase="-b ${base}"
          fi

          # --------------------------------------------------------------------
          # Set child snapshot, live & relative modes for the delete operation
          # --------------------------------------------------------------------
          local child=$(is_parent backing_files "${snap_dir}" "${snap_id}")

          local live=$(do_live "${vm_id}" "${vm_st}" "${snap_id}" "${virsh}")

          local rel=""

          if [ "${local}" = "YES" ]; then
              rel="--keep-relative"
          fi

          if [ "${active}" = "YES" ]; then
            # ------------------------------------------------------------------
            # Active snapshot (last known by OpenNebula). Example, delete n:
            #   n-1 <-- n <-- next
            #   n-1 <-- next
            #
            #   next = next + n. Remove n
            # ------------------------------------------------------------------
            if [ -n "${live}" ]; then
              cmd="${virsh} blockpull ${rel} ${vm_id} ${target} ${vbase} --wait"
            else
              cmd="${qemu} rebase -q -U -F qcow2 ${qbase} ${dpath}"
            fi

            cmd="${cmd}; rm ${snap_path}"
          elif [ -n "${child}" ]; then
            # ------------------------------------------------------------------
            # Snapshot in the middle of a chain. Example, delete n:
            #   n-1 <-- n <-- n+1
            #   (live: commit n+1 into n) n-1 <-- n'
            #   (poff: rebase n+1 to n-1) n-1 <-- n+1
            #
            #   (live) n' = n + (n+1). (n+1).current = n. Remove n+1
            #   (poff) Remove n
            # ------------------------------------------------------------------
            if [ -n "${live}" ]; then
              local current_path=$(get_current_path ${snap_dir} ${child})

              cmd="${virsh} blockcommit ${vm_id} ${target} ${rel} --top ${child} \
                  --base ${snap_path} --wait"
              cmd="${cmd}; echo "${snap_path}" > ${current_path}"
              cmd="${cmd}; rm ${snap_dir}/${child}"
            else
              cmd="${qemu} rebase -q -U -F qcow2 ${qbase} ${snap_dir}/${child}"
              cmd="${cmd}; rm ${snap_path}"
            fi
          else
            # ------------------------------------------------------------------
            # Snapshot has no children and not active. Example, delete n+1:
            #   n-1 <-- n <-- n+1
            #           \_ n+2 <-- next
            #
            #  Remove n+1
            # ------------------------------------------------------------------
            if [ -f "${snap_path}.current" ]; then
              cmd="rm ${current}"
            else
              cmd="rm ${snap_path}"
            fi
          fi

          # Remove current pointer if exists
          cmd="${cmd}; ${rm_current}"

          echo "${cmd}"
        }
      SCRIPT
    end

  end

end
# rubocop:enable Layout/HeredocIndentation, Layout/IndentationWidth
