/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, memo, useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import { ButtonGenerator } from 'client/components/Tabs/Service/ButtonGenerator'
import {
  useGetServiceQuery,
  useServiceAddRoleMutation,
  useServiceRoleActionMutation,
  useServiceScaleRoleMutation,
} from 'client/features/OneApi/service'

import { useLazyGetTemplatesQuery } from 'client/features/OneApi/vmTemplate'
import { VmsTable } from 'client/components/Tables'
import VmActions from 'client/components/Tables/Vms/actions'
import { StatusCircle } from 'client/components/Status'
import { getRoleState } from 'client/models/Service'
import { Box, Dialog, Typography, CircularProgress } from '@mui/material'
import { Content as RoleAddDialog } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig'
import { ScaleDialog } from 'client/components/Tabs/Service/ScaleDialog'
import {
  Plus,
  Trash,
  SystemShut,
  TransitionRight,
  NavArrowDown,
  Refresh,
  PlayOutline,
} from 'iconoir-react'

import { useGeneralApi } from 'client/features/General'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'

// Filters actions based on the data-cy key
const filterActions = ['vm_resume', 'vm-manage', 'vm-host', 'vm-terminate']

/**
 * Renders template tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Service Template id
 * @returns {ReactElement} Roles tab
 */
const RolesTab = ({ id }) => {
  const [fetch, { data, error, isFetching }] = useLazyGetTemplatesQuery()
  const { enqueueError, enqueueSuccess, enqueueInfo } = useGeneralApi()
  // wrapper
  const createApiCallback = (apiFunction) => async (params) => {
    const payload = { id, ...params }
    const response = await apiFunction(payload)

    return response
  }
  // api calls
  const [addRole] = useServiceAddRoleMutation()
  const [addRoleAction] = useServiceRoleActionMutation()
  const [scaleRole] = useServiceScaleRoleMutation()
  // api handlers
  const handleAddRole = createApiCallback(addRole)

  const handleAddRoleAction = async (actionType) => {
    for (const roleIdx of selectedRoles) {
      const roleName = roles?.[roleIdx]?.name

      try {
        enqueueInfo(T.InfoServiceActionRole, [actionType, roleName])

        await createApiCallback(addRoleAction)({
          perform: actionType,
          role: roleName,
        })

        enqueueSuccess(T.SuccessRoleActionCompleted, [actionType, roleName])
      } catch (error) {
        enqueueError(T.ErrorServiceActionRole, [actionType, roleName, error])
      }
    }
  }

  const handleScaleRole = createApiCallback(scaleRole)

  const [activeRole, setActiveRole] = useState({ idx: null, roleName: null })

  const [isAddRoleOpen, setAddRoleOpen] = useState(false)
  const [isScaleDialogOpen, setScaleDialogOpen] = useState(false)

  const { data: template = {} } = useGetServiceQuery({ id })
  const [selectedRoles, setSelectedRoles] = useState([])
  const filteredActions = VmActions()?.filter((action) =>
    filterActions?.includes(action?.dataCy)
  )
  const roles = template?.TEMPLATE?.BODY?.roles || []

  const roleVms = useMemo(
    () =>
      roles?.reduce((acc, role) => {
        acc[role?.name] = role?.nodes?.map((node) => node?.vm_info?.VM.ID)

        return acc
      }, {}),
    [roles]
  )

  /* eslint-disable react/prop-types */
  const AddRoleDialog = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <RoleAddDialog
        standaloneModal
        standaloneModalCallback={(params) => {
          handleAddRole(params)
          onClose()
        }}
        fetchedVmTemplates={{ vmTemplates: data, error: error }}
      />
    </Dialog>
  )
  /* eslint-enable react/prop-types */

  const handleRoleClick = (idx, role, event) => {
    event.stopPropagation()

    if (event.ctrlKey || event.metaKey) {
      setSelectedRoles((prevSelectedRoles) =>
        prevSelectedRoles.includes(idx)
          ? prevSelectedRoles.filter((roleIdx) => roleIdx !== idx)
          : [...prevSelectedRoles, idx]
      )
    } else {
      setSelectedRoles((prevSelectedRoles) => {
        if (prevSelectedRoles.length > 1 || !prevSelectedRoles.includes(idx)) {
          return [idx]
        }

        return prevSelectedRoles
      })

      setActiveRole((prevActiveRole) =>
        prevActiveRole.idx === idx
          ? { idx: null, roleName: null }
          : { idx: idx, roleName: role.name }
      )
    }
  }

  const handleOpenAddRole = async () => {
    await fetch()
    setAddRoleOpen(true)
  }

  const handleCloseAddRole = () => {
    setAddRoleOpen(false)
  }

  const handleOpenScale = () => {
    setScaleDialogOpen(true)
  }

  const handleCloseScale = () => {
    setScaleDialogOpen(false)
  }

  const isSelected = (idx) => selectedRoles.includes(idx)

  return (
    <Box display="flex" flexDirection="column" padding="1em" width="100%">
      <Box
        display="flex"
        flexDirection="row"
        alignItems="stretch"
        justifyContent="space-between"
        width="100%"
        marginBottom="2em"
      >
        <Box display="flex" gap="2em" marginRight="2em">
          <>
            <ButtonGenerator
              items={{
                name: T.AddRole,
                onClick: handleOpenAddRole,
                icon: isFetching ? <CircularProgress size={24} /> : <Plus />,
              }}
              options={{
                singleButton: {
                  disabled: !!isFetching,
                  sx: {
                    fontSize: '0.95rem',
                    padding: '6px 8px',
                    minWidth: '80px',
                    minHeight: '30px',
                    maxHeight: '40px',
                    whiteSpace: 'nowrap',
                  },
                  'data-cy': 'AddRole',
                },
              }}
            />
            <AddRoleDialog open={isAddRoleOpen} onClose={handleCloseAddRole} />
          </>

          <ButtonGenerator
            items={{
              name: T.Scale,
              onClick: handleOpenScale,
              icon: <Plus />,
            }}
            options={{
              singleButton: {
                disabled: !selectedRoles?.length > 0,
                sx: {
                  fontSize: '0.95rem',
                  padding: '6px 12px',
                  minWidth: '80px',
                  minHeight: '30px',
                  maxHeight: '40px',
                },
              },
            }}
          />
          <ScaleDialog
            open={isScaleDialogOpen}
            onClose={handleCloseScale}
            onScale={handleScaleRole}
            roleName={roles?.[selectedRoles?.[0]]?.name}
          />
        </Box>

        <Box display="flex" gap="1em">
          <ButtonGenerator
            items={{
              onClick: () => handleAddRoleAction('resume'),
            }}
            options={{
              singleButton: {
                disabled: !selectedRoles?.length > 0,
                icon: <PlayOutline />,
                sx: (theme) => ({
                  color: theme.palette.text.primary,
                  padding: '0',
                  borderRadius: '50%',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  '&.selected': {
                    border: `2px solid ${theme.palette.secondary.main}`,
                  },
                }),
                title: null,
                type: 'icon',
              },
            }}
          />

          <ButtonGenerator
            items={[
              {
                name: T.Suspend,
                onClick: () => handleAddRoleAction('suspend'),
              },
              {
                name: T.Poweroff,
                onClick: () => handleAddRoleAction('poweroff'),
              },
              {
                name: T.PoweroffHard,
                onClick: () => handleAddRoleAction('poweroff-hard'),
              },
            ]}
            options={{
              button: {
                disabled: !selectedRoles?.length > 0,
                startIcon: <SystemShut />,
                endIcon: <NavArrowDown />,
                sx: {
                  fontSize: 20,
                  padding: '8px 16px',
                  border: '0',
                },
                title: null,
              },
            }}
          />

          <ButtonGenerator
            items={[
              {
                name: T.Stop,
                onClick: () => handleAddRoleAction('stop'),
              },
              {
                name: T.Undeploy,
                onClick: () => handleAddRoleAction('undeploy'),
              },
              {
                name: T.UndeployHard,
                onClick: () => handleAddRoleAction('undeploy-hard'),
              },
            ]}
            options={{
              button: {
                disabled: !selectedRoles?.length > 0,
                startIcon: <TransitionRight />,
                endIcon: <NavArrowDown />,
                sx: {
                  fontSize: 20,
                  padding: '8px 16px',
                },
                title: null,
              },
            }}
          />

          <ButtonGenerator
            items={[
              {
                name: T.Reboot,
                onClick: () => handleAddRoleAction('reboot'),
              },
              {
                name: T.RebootHard,
                onClick: () => handleAddRoleAction('reboot-hard'),
              },
            ]}
            options={{
              button: {
                disabled: !selectedRoles?.length > 0,
                startIcon: <Refresh />,
                endIcon: <NavArrowDown />,
                sx: {
                  fontSize: 20,
                  padding: '8px 16px',
                  marginRight: '1em',
                },
                title: null,
              },
            }}
          />

          <ButtonGenerator
            items={[
              {
                name: T.Terminate,
                onClick: () => handleAddRoleAction('terminate'),
              },
              {
                name: T.TerminateHard,
                onClick: () => handleAddRoleAction('terminate-hard'),
              },
            ]}
            options={{
              button: {
                disabled: !selectedRoles?.length > 0,
                startIcon: <Trash />,
                endIcon: <NavArrowDown />,
                color: 'error',
                sx: {
                  fontSize: 20,
                  padding: '8px 16px',
                  marginLeft: '2em',
                  color: 'primary',
                },
                title: null,
              },
            }}
          />
        </Box>
      </Box>

      {roles.map((role, idx) => (
        <Box
          key={`role-${role.name ?? idx}`}
          display="flex"
          flexDirection="column"
          padding="0.75em"
          marginY="0.25em"
          sx={(theme) => ({
            '&:hover': { bgcolor: 'action.hover', boxShadow: 3 },
            boxShadow: 1,
            transition: 'all 0.1s ease-in-out',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '8px',
            bgcolor: 'background.paper',
            border: `2px solid ${
              isSelected(idx)
                ? theme.palette.secondary.main
                : theme.palette.divider
            }`,
          })}
          onClick={(event) => handleRoleClick(idx, role, event)}
        >
          <RoleComponent
            role={role}
            selected={isSelected(idx)}
            status={role?.state}
          />

          {activeRole.idx === idx && (
            <Box
              padding="20px"
              marginLeft="20px"
              paddingTop="10px"
              border="1px solid rgba(0, 0, 0, 0.12)"
              borderRadius="4px"
              width="calc(100% - 20px)"
              height="calc(100% - 20px)"
              minHeight="500px"
              onClick={(event) => event.stopPropagation()}
            >
              <VmsTable
                globalActions={filteredActions}
                filterData={roleVms?.[activeRole?.roleName]}
                filterLoose={false}
              />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

RolesTab.propTypes = { tabProps: PropTypes.object, id: PropTypes.string }
RolesTab.displayName = 'RolesTab'

const RoleComponent = memo(({ role, selected, status }) => {
  const { name, cardinality, vm_template: templateId } = role

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="flex-start"
      padding="0.5em"
      marginY="0.25em"
      borderRadius="8px"
      boxShadow={1}
      sx={(theme) => ({
        '&:hover': { boxShadow: 2, transition: 'box-shadow 0.3s' },
        bgcolor: theme.palette.background,
        filter: selected ? 'brightness(100%)' : 'brightness(90%)',
      })}
    >
      <Box mr={2} mt={-1} alignSelf="start">
        <StatusCircle
          color={getRoleState(status)?.color || 'red'}
          tooltip={getRoleState(status)?.name}
        />
      </Box>

      <Box>
        <Typography variant="subtitle1" mb={1}>
          {name}
        </Typography>
        <Typography variant="body1" mb={1}>
          {Tr(T.VMTemplate)} {Tr(T.ID)}: {templateId}
        </Typography>
        <Typography variant="body1">
          {Tr(T.Cardinality)}: {cardinality}
        </Typography>
      </Box>
    </Box>
  )
})

RoleComponent.propTypes = {
  role: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.number,
}
RoleComponent.displayName = 'RoleComponent'

export default RolesTab
