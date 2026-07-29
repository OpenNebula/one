/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { useModalsApi } from '@FeaturesModule'
import { T, STYLE_BUTTONS, VM_ACTION_ENUM } from '@ConstantsModule'
import {
  getServiceRoles,
  getRoleVms,
  roleschedactionsTable,
} from '@ModelsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Table, List, Checkbox, Button } from '@ComponentsV2Module'
import { Component, useMemo, useState, useCallback, useEffect } from 'react'
import { getStyles } from '@modules/resources/resources/Service/Tabs/ScheduledActions/styles'
import { ServiceRoleCard } from '@modules/resources/resources/Service/Tabs/RoleCard'
import { VirtualMachine } from '@modules/resources/resources'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - View config
 * @returns {Component} - Service roles tab
 */
export const ScheduledActions = ({ data, config }) => {
  const { selected: service = {} } = data || {}

  const { showModal } = useModalsApi()
  const roles = useMemo(() => getServiceRoles(service), [service])
  const roleIds = useMemo(
    () =>
      []
        .concat(roles)
        ?.map((role, idx) => role?.name ?? String(idx))
        ?.filter(Boolean),
    [roles]
  )
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedSchedActions, setSelectedSchedActions] = useState({})

  useEffect(() => {
    setSelectedRoles([])
    setSelectedSchedActions({})
  }, [service?.ID])

  const selectedRoleIds = selectedRoles.filter((roleId) =>
    roleIds.includes(roleId)
  )

  const handleSelect = (ID) =>
    setSelectedRoles(
      selectedRoles?.length === 1 && selectedRoles?.[0] === ID ? [] : [ID]
    )

  const selectedVms = useMemo(
    () => getRoleVms(service, selectedRoles),
    [service, selectedRoles]
  )

  const selectedVmIds = useMemo(
    () => selectedVms.map(({ ID }) => ID),
    [selectedVms]
  )

  const vmContext = useMemo(
    () =>
      selectedVms.reduce(
        (acc, vm) => ({
          ...acc,
          [vm.ID]: {
            VM_NAME: vm?.NAME ?? vm?.ID,
            ROLE: vm?.ROLE,
          },
        }),
        {}
      ),
    [selectedVms]
  )

  const {
    data: schedActions = [],
    isFetching: isFetchingSchedActions,
    isLoading: isLoadingSchedActions,
  } = roleschedactionsTable.useData(
    {
      ids: selectedVmIds,
      vmContext,
    },
    { skip: !service?.ID || selectedVmIds?.length <= 0 }
  )

  const getSchedActionRowId = ({ VM_ID, ID }) => `${VM_ID}-${ID}`

  const selectedSchedActionRows = useMemo(() => {
    const selectedIds = new Set(Object.keys(selectedSchedActions))

    return schedActions.filter((action) =>
      selectedIds.has(getSchedActionRowId(action))
    )
  }, [schedActions, selectedSchedActions])

  const actionContext = useCallback(
    (trigger) =>
      async (params = {}) => {
        const targets = selectedSchedActionRows.length
          ? selectedSchedActionRows.map(({ VM_ID, ID }) => ({
              id: VM_ID,
              schedId: ID,
            }))
          : selectedVmIds.map((id) => ({ id }))

        const result = await Promise.all(
          targets.map((target) =>
            trigger({
              ...params,
              ...target,
            })
          )
        )

        setSelectedSchedActions({})

        return result
      },
    [selectedVmIds, selectedSchedActionRows]
  )

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context: actionContext,
    })

  const isActionsDisabled =
    isPerformingAction ||
    selectedRoleIds.length < 1 ||
    isFetchingSchedActions ||
    isLoadingSchedActions

  const [createAction, deleteAction] =
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: [
        VM_ACTION_ENUM.SCHED_ACTION_CREATE,
        VM_ACTION_ENUM.SCHED_ACTION_DELETE,
      ],
      actions,
      viewConfig: config,
      showModal,
    })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="rolesContainer">
        <Box className="roleList">
          <Checkbox
            className="select-all-container"
            text={`${T.SelectAll} \u2022 ${roleIds.length} ${T.ScheduledActions}`}
            onChange={(checked) => setSelectedRoles(checked ? roleIds : [])}
            checked={
              selectedRoleIds.length > 0 &&
              selectedRoleIds.length === roleIds?.length
            }
            isDisabled={roleIds.length <= 0}
          />
          <List isRowIndicatorDisabled>
            {roles.map((role, idx) => {
              const roleId = role?.name ?? String(idx)

              return (
                <ServiceRoleCard
                  key={`role-${roleId}`}
                  role={role}
                  isSelected={selectedRoleIds.includes(roleId)}
                  onCheck={() =>
                    setSelectedRoles(
                      selectedRoles?.includes(roleId)
                        ? selectedRoles.filter((id) => id !== roleId)
                        : [...(selectedRoles ?? []), roleId]
                    )
                  }
                  onClick={() => handleSelect(roleId)}
                />
              )
            })}
          </List>
        </Box>

        <Box className="schedActionsTable">
          <Table
            columns={roleschedactionsTable.columns()}
            data={schedActions}
            isLoading={isFetchingSchedActions || isLoadingSchedActions}
            getRowId={getSchedActionRowId}
            rowSelection={selectedSchedActions}
            onRowSelectionChange={setSelectedSchedActions}
            isRowsSelectable
            isMultiRowSelection
            isCopyColumn
            size="medium"
            isEnableSearchBar
            isFullHeight
            toolbar={
              <>
                <Button
                  {...createAction}
                  type={STYLE_BUTTONS.TYPE.SECONDARY}
                  title={T.AddAction}
                  isDisabled={isActionsDisabled || createAction?.isDisabled}
                  sx={{
                    height: '100%',
                  }}
                />
                <Button
                  {...deleteAction}
                  type={STYLE_BUTTONS.TYPE.SECONDARY}
                  title={T.DeleteSelected}
                  isDestructive
                  isDisabled={
                    isActionsDisabled ||
                    deleteAction?.isDisabled ||
                    selectedSchedActionRows?.length <= 0
                  }
                  sx={{
                    height: '100%',
                  }}
                />
              </>
            }
            emptyContentProps={{
              title: T.NoScheduledActionsSelected,
              subtitle: T.SelectRoleConcept,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

ScheduledActions.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

ScheduledActions.id = 'sched_actions'
ScheduledActions.title = T.ScheduledActions
