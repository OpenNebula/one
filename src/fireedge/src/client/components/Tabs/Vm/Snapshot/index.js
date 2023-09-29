/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import HintIcon from 'iconoir-react/dist/QuestionMarkCircle'
import {
  Stack,
  Tooltip,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import {
  CreateAction,
  RevertAction,
  DeleteAction,
} from 'client/components/Tabs/Vm/Snapshot/Actions'
import SnapshotCard from 'client/components/Cards/SnapshotCard'
import { Tr } from 'client/components/HOC'

import {
  getSnapshotList,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable } from 'client/models/Helper'
import { T, VM_ACTIONS } from 'client/constants'

const { SNAPSHOT_CREATE, SNAPSHOT_REVERT, SNAPSHOT_DELETE } = VM_ACTIONS

/**
 * Renders the list of snapshots from a VM.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} Snapshots tab
 */
const VmSnapshotTab = ({ tabProps: { actions } = {}, id }) => {
  const { data: vm = {} } = useGetVmQuery({ id })

  const [snapshots, actionsAvailable] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isAvailableAction(action, vm)
    )

    return [getSnapshotList(vm), actionsByState]
  }, [vm])

  const isSnapshotSupported = actionsAvailable?.includes(SNAPSHOT_CREATE)

  return (
    <Box>
      {isSnapshotSupported ? (
        <Stack direction="row" gap="1em" alignItems="center">
          {snapshots.length > 0 && (
            <Tooltip arrow title={Tr(T.VmSnapshotHint)}>
              <HintIcon />
            </Tooltip>
          )}
          <CreateAction vmId={id} />
        </Stack>
      ) : (
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Stack direction="row" gap="1em" alignItems="center">
            <Box sx={{ textAlign: 'center', zIndex: 1, opacity: 0.7 }}>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.8,
                }}
              >
                Taking snapshots is not available.
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Make sure VM is in the correct state"
                    primaryTypographyProps={{ align: 'center' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Check the hypervisor support"
                    primaryTypographyProps={{ align: 'center' }}
                  />
                </ListItem>
              </List>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.6,
                  textAlign: 'center',
                  marginTop: '1em',
                }}
              >
                If none of the above worked, please refer to the VM monitoring
                logs.
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
      {snapshots.length <= 0 ? (
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mt={10}
          sx={{
            height: '100%',
            opacity: 0.7,
          }}
        >
          <Box
            sx={{ display: 'inline-block', width: '70%', textAlign: 'center' }}
          >
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              {Tr(T.VmSnapshotHint)}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box ml={4}>
          <Stack gap="1em" py="0.8em" data-cy="snapshots">
            {snapshots.map((snapshot) => (
              <SnapshotCard
                snapshot={snapshot}
                key={snapshot.SNAPSHOT_ID}
                extraActionProps={{ vmId: id }}
                actions={[
                  actionsAvailable?.includes(SNAPSHOT_REVERT) && RevertAction,
                  actionsAvailable?.includes(SNAPSHOT_DELETE) && DeleteAction,
                ].filter(Boolean)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}

VmSnapshotTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmSnapshotTab.displayName = 'VmSnapshotTab'

export default VmSnapshotTab
