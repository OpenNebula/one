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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import {
  AddVLANRuleAction,
  VLANRuleActionsMenu,
} from '@modules/resources/resources/Group/Tabs/VLANRules/Actions'
import { GroupAPI } from '@FeaturesModule'
import { jsonToXml } from '@UtilsModule'
import {
  getGroupId,
  groupTabPropTypes,
} from '@modules/resources/resources/Group/Tabs/common'

import { VLANRule, GROUP_ACTIONS, T } from '@ConstantsModule'
import { Table } from '@ComponentsV2Module'

const { ADD_VLAN_RULE, UPDATE_VLAN_RULE, DELETE_VLAN_RULE } = GROUP_ACTIONS

const DEFAULT_VLAN_RULE_ACTIONS = {
  [ADD_VLAN_RULE]: true,
  [UPDATE_VLAN_RULE]: true,
  [DELETE_VLAN_RULE]: true,
}

const getNetworkTemplates = ({ VNTEMPLATE } = {}) =>
  VNTEMPLATE === '-1' ? T.All : VNTEMPLATE || '-'

const handleAdd = async ({ value, id, update, template }) => {
  const vlanRules = [template?.RULE ?? []].flat()
  vlanRules.push(value)
  const templateJson = { ...template, RULE: vlanRules }

  const newTemplate = jsonToXml(templateJson)
  await update({ id, vlanRule: newTemplate }).unwrap()
}

const handleUpdate = async ({ value, id, vlanRuleID, update, template }) => {
  let templateJson = { ...template, RULE: value }

  if (Array.isArray(template?.RULE)) {
    const vlanRules = [template.RULE ?? []].flat()
    vlanRules[vlanRuleID] = value
    templateJson = { ...template, RULE: vlanRules }
  }

  const newTemplate = jsonToXml(templateJson)
  await update({ id, vlanRule: newTemplate }).unwrap()
}

const handleDelete = async ({ id, vlanRuleID, update, template }) => {
  const { RULE, ...rest } = template
  let templateJson = { ...rest }

  if (Array.isArray(template?.RULE)) {
    const vlanRules = [template.RULE ?? []].flat()
    vlanRules.splice(vlanRuleID, 1)
    templateJson = { ...template, RULE: vlanRules }
  }

  const newTemplate = jsonToXml(templateJson)
  await update({ id, vlanRule: newTemplate }).unwrap()
}

/**
 * Renders the list of VLAN Rules from a Group.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Group id
 * @param {object} props.oneConfig - Open Nebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} VLAN Rules tab
 */
const VLANRuleTab = ({
  tabProps: { actions = {} } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const { data: group } = GroupAPI.useGetGroupQuery({ id })
  const [vlanRuleGroup] = GroupAPI.useVlanRuleGroupMutation()

  /** @type {VLANRule[]} */
  const vlanRules = [group?.VLAN_RULES?.RULE ?? []]
    .flat()
    .filter(Boolean)
    .map((vlanRule, index) => ({ ...vlanRule, INDEX: index }))
  const template = group?.VLAN_RULES
  const canUpdate = actions[UPDATE_VLAN_RULE] === true
  const canDelete = actions[DELETE_VLAN_RULE] === true

  const columns = [
    {
      accessorKey: 'INDEX',
      header: T.ID,
      grow: false,
      cell: ({ row }) => `#${row.original.INDEX}`,
    },
    {
      accessorKey: 'SCOPE',
      header: T.Scope,
    },
    {
      accessorKey: 'ID',
      header: T.VlanId,
      grow: false,
    },
    {
      id: 'vntemplate',
      header: T.NetworkTemplates,
      accessorFn: getNetworkTemplates,
      truncate: true,
    },
  ]

  if (canUpdate || canDelete) {
    columns.push({
      header: '',
      id: 'actions',
      grow: false,
      meta: { disableCellTooltip: true },
      cell: ({ row }) => {
        const vlanRule = row.original
        const vlanRuleID = vlanRule.INDEX

        return (
          <VLANRuleActionsMenu
            groupId={id}
            vlanRule={vlanRule}
            vlanRuleId={vlanRuleID}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onUpdate={(value) =>
              handleUpdate({
                value,
                id,
                vlanRuleID,
                update: vlanRuleGroup,
                template,
              })
            }
            onDelete={() =>
              handleDelete({
                id,
                vlanRuleID,
                update: vlanRuleGroup,
                template,
              })
            }
          />
        )
      },
    })
  }

  return (
    <Box padding={{ sm: '0.8em' }}>
      {actions[ADD_VLAN_RULE] === true && (
        <AddVLANRuleAction
          groupId={id}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
          onSubmit={(value) =>
            handleAdd({
              value,
              id,
              update: vlanRuleGroup,
              template,
            })
          }
        />
      )}

      <Box py="0.8em">
        <Table
          columns={columns}
          data={vlanRules}
          getRowId={(row) => String(row.INDEX)}
          isEnableSearchBar
          size="medium"
        />
      </Box>
    </Box>
  )
}

VLANRuleTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VLANRuleTab.displayName = 'VLANRuleTab'
VLANRuleTab.label = 'VLAN Rules'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @param {object} root0.config - Tab view configuration
 * @returns {ReactElement} VLAN rules tab
 */
export const VLANRules = ({ data, config }) => (
  <VLANRuleTab
    id={getGroupId(data)}
    tabProps={{
      ...config,
      actions: config?.actions ?? DEFAULT_VLAN_RULE_ACTIONS,
    }}
  />
)

VLANRules.propTypes = groupTabPropTypes

VLANRules.id = 'vlanrules'
VLANRules.title = 'VLAN Rules'

export default VLANRuleTab
