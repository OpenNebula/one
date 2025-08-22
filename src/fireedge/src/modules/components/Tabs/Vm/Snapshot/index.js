/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { HelpCircle as HintIcon } from 'iconoir-react'
import {
  Stack,
  Tooltip,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Alert,
  useTheme,
} from '@mui/material'
import { css } from '@emotion/css'

import { VmAPI } from '@FeaturesModule'
import {
  CreateAction,
  RevertAction,
  DeleteAction,
} from '@modules/components/Tabs/Vm/Snapshot/Actions'
import SnapshotCard from '@modules/components/Cards/SnapshotCard'
import { Tr } from '@modules/components/HOC'

import {
  getSnapshotList,
  getHypervisor,
  isVmAvailableAction,
  getActionsAvailable,
} from '@ModelsModule'
import { T, VM_ACTIONS, VM_LCM_STATES, STATES } from '@ConstantsModule'

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
  const theme = useTheme()
  // Style for info message
  const useStyles = ({ palette }) => ({
    warningInfo: css({
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        marginBottom: '1em',
        backgroundColor: palette.background.paper,
      },
    }),
  })

  const classes = useMemo(() => useStyles(theme), [theme])

  const { data: vm = {} } = VmAPI.useGetVmQuery({ id })

  const [snapshots, actionsAvailable, snapshotInProgress] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
    )

    const isSnapshotInProgress =
      VM_LCM_STATES[vm.LCM_STATE]?.name === STATES.HOTPLUG_SNAPSHOT

    return [getSnapshotList(vm), actionsByState, isSnapshotInProgress]
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
      ) : snapshotInProgress ? (
        <Alert
          severity="info"
          variant="outlined"
          className={classes.warningInfo}
        >
          {Tr(T.VmSnapshotInProgress)}
        </Alert>
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
                {Tr(T.VmSnapshotNotAvailable)}
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
                {Tr(T.VmSnapshotReferLogs)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
      {snapshots.length <= 0 ? (
        <Alert
          severity="info"
          variant="outlined"
          className={classes.warningInfo}
        >
          {Tr(T.VmSnapshotHint)}
        </Alert>
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
