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
import { RESOURCE_NAMES, SERVICE_ACTION_ENUM, T } from '@ConstantsModule'
import { getServiceRoles, rolevmsTable } from '@ModelsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Table, List, Checkbox, MenuButton } from '@ComponentsV2Module'
import { Component, useMemo, useState } from 'react'
import { getStyles } from '@modules/resources/resources/Service/Tabs/Roles/styles'
import { ServiceRoleCard } from '@modules/resources/resources/Service/Tabs/RoleCard'
import {
  getRoleActionParams,
  getRoleActionForm,
} from '@modules/resources/resources/Service/Tabs/Roles/RoleActionForm'
import { Service } from '@modules/resources/resources'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - View config
 * @returns {Component} - Service roles tab
 */
export const Roles = ({ data, config }) => {
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
  const selectedRoleIds = selectedRoles.filter((roleId) =>
    roleIds.includes(roleId)
  )
  const selectedRoleResources = selectedRoleIds.map((name) => ({ name }))

  const handleSelect = (ID) =>
    setSelectedRoles(
      selectedRoles?.length === 1 && selectedRoles?.[0] === ID ? [] : [ID]
    )

  const {
    data: roleVms = [],
    isFetching: isFetchingRoleVms,
    isLoading: isLoadingRoleVms,
    refetch: refetchRoleVms,
  } = rolevmsTable.useData(
    { id: service?.ID, role: selectedRoleIds },
    { skip: !service?.ID }
  )

  const { actions, isLoading: isPerformingAction } = Service.Actions.useActions(
    {
      context:
        (fn) =>
        (params = {}) =>
          fn?.({
            id: service?.ID,
            ...params,
          }),
    }
  )

  const showRoleActionModal = (modalProps) =>
    showModal({
      ...modalProps,
      isConfirmDialog: false,
      form: getRoleActionForm(selectedRoleResources),
      onSubmit: async (params = {}) => {
        await Promise.all(
          selectedRoleIds.map((role) =>
            modalProps?.onSubmit?.({ ...getRoleActionParams(params), role })
          )
        )
        await refetchRoleVms?.()
      },
    })

  const performActions = Service.Actions.Utils.generateMenuOptions({
    keys: Service.Actions.Groups.RolePerformMenu,
    actions,
    viewConfig: config,
    showModal: showRoleActionModal,
  })

  const managementActions = Service.Actions.Utils.generateMenuOptions({
    keys: Service.Actions.Groups.RoleManagement,
    actions,
    viewConfig: config,
    formContext: { roleName: selectedRoleIds[0] },
    showModal,
  })?.map((option) =>
    option?.eACTION === SERVICE_ACTION_ENUM.SCALE_ROLE
      ? {
          ...option,
          isDisabled: option.isDisabled || selectedRoleIds.length !== 1,
        }
      : option
  )

  const isActionsDisabled = isPerformingAction || selectedRoleIds.length < 1

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Box className="rolesContainer">
        <Box className="roleList">
          <Checkbox
            className="select-all-container"
            text={`${T.SelectAll} \u2022 ${roleIds.length} ${T.Roles}`}
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

        <Box className="roleVmsTable">
          <Table
            columns={rolevmsTable.columns()}
            data={roleVms}
            isLoading={isLoadingRoleVms || isFetchingRoleVms}
            getRowId={(row) => String(row.ID)}
            openRowDetailsOnClick
            rowDetailsResourceId={RESOURCE_NAMES.VM}
            size="medium"
            isEnableSearchBar
            isFullHeight
            toolbar={
              <>
                <MenuButton
                  placeholder={T.Manage}
                  options={[managementActions]}
                  isDisabled={isPerformingAction}
                />
                <MenuButton
                  placeholder={T.PerformAction}
                  options={performActions}
                  isDisabled={isActionsDisabled}
                />
              </>
            }
            emptyContentProps={{
              title: T.NoRolesSelected,
              subtitle: T.SelectRoleConcept,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

Roles.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Roles.id = 'roles'
Roles.title = T.Roles
