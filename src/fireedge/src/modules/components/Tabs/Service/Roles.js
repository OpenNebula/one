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
import { ReactElement, memo, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { object } from 'yup'
import { SubmitButton } from '@modules/components/FormControl'
import { ButtonGenerator } from '@modules/components/Tabs/Service/ButtonGenerator'
import { ServiceAPI, useGeneralApi } from '@FeaturesModule'

import { deepClean } from '@UtilsModule'

import { VmsTable } from '@modules/components/Tables'
import { StatusCircle } from '@modules/components/Status'
import { getRoleState } from '@ModelsModule'
import { Box, Dialog, Typography, Stack } from '@mui/material'
import RoleStep from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'
import { ScaleDialog } from '@modules/components/Tabs/Service/ScaleDialog'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  Plus,
  Trash,
  SystemShut,
  TransitionRight,
  NavArrowDown,
  Refresh,
  PlayOutline,
} from 'iconoir-react'

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

// Filters actions based on the data-cy key
const filterActions = ['vm_resume', 'vm-manage', 'vm-host', 'vm-terminate']

const { resolver: rolesResolver, content: RoleAddDialog } = RoleStep()

/* eslint-disable react/prop-types */
const AddRoleDialog = ({ open, onClose, onSubmit }) => {
  const methods = useForm({
    mode: 'onSubmit',
    defaultValues: rolesResolver.default(),
    resolver: yupResolver(object().shape({ roles: rolesResolver })),
  })

  const { handleSubmit } = methods

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <FormProvider {...methods}>
        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          alignItems="center"
          justifyContent="center"
        >
          <RoleAddDialog standaloneModal />
          <SubmitButton
            label={T.AddRole}
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            sx={{ m: '0.5rem' }}
            data-cy="add-role-button"
          />
        </Stack>
      </FormProvider>
    </Dialog>
  )
}
/* eslint-enable react/prop-types */

/**
 * Renders template tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Service Template id
 * @returns {ReactElement} Roles tab
 */
const RolesTab = ({ id }) => {
  const { enqueueError, enqueueSuccess, enqueueInfo } = useGeneralApi()
  // wrapper
  const createApiCallback = (apiFunction) => async (params) => {
    const payload = { id, ...params }
    const response = await apiFunction(payload)

    return response
  }

  // api calls
  const [addRole] = ServiceAPI.useServiceAddRoleMutation()
  const [addRoleAction] = ServiceAPI.useServiceRoleActionMutation()
  const [scaleRole] = ServiceAPI.useServiceScaleRoleMutation()

  const handleAddRole = async (data) => {
    const cleanedRole = deepClean(data?.roles?.[0])
    const result = await addRole({ id, role: cleanedRole })

    handleCloseAddRole()

    return result
  }

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

  const { data: template = {} } = ServiceAPI.useGetServiceQuery({ id })
  const [selectedRoles, setSelectedRoles] = useState([])
  const filteredActions = VmsTable.Actions()?.filter((action) =>
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

  const handleOpenAddRole = () => {
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
    <Stack direction="column" gap="2rem">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box display="flex" gap="2em" marginRight="2em">
          <>
            <ButtonGenerator
              items={{
                name: T.AddRole,
                onClick: handleOpenAddRole,
                icon: <Plus />,
              }}
              options={{
                singleButton: {
                  'data-cy': 'AddRole',
                  importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
                  size: STYLE_BUTTONS.SIZE.MEDIUM,
                  type: STYLE_BUTTONS.TYPE.FILLED,
                },
              }}
            />
            <AddRoleDialog
              open={isAddRoleOpen}
              onClose={handleCloseAddRole}
              onSubmit={handleAddRole}
            />
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
                'data-cy': 'ScaleRole',
                importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
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
                'data-cy': 'ResumeRole',
                title: null,
                buttonType: 'icon',
                importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
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
                icon: <SystemShut />,
                endicon: <NavArrowDown />,
                'data-cy': 'PoweroffRole',
                importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
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
                icon: <TransitionRight />,
                endicon: <NavArrowDown />,
                'data-cy': 'StopRole',
                importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
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
                icon: <Refresh />,
                endicon: <NavArrowDown />,
                'data-cy': 'RebootRole',
                importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
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
                icon: <Trash />,
                endicon: <NavArrowDown />,
                'data-cy': 'TerminateRole',
                importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
                size: STYLE_BUTTONS.SIZE.MEDIUM,
                type: STYLE_BUTTONS.TYPE.FILLED,
                title: null,
              },
            }}
          />
        </Box>
      </Stack>

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
              <VmsTable.Table
                globalActions={filteredActions}
                filterData={roleVms?.[activeRole?.roleName]}
                filterLoose={false}
              />
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  )
}

RolesTab.propTypes = { tabProps: PropTypes.object, id: PropTypes.string }
RolesTab.displayName = 'RolesTab'

const RoleComponent = memo(({ role, selected, status }) => {
  const { name, cardinality, template_id: templateId } = role

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
