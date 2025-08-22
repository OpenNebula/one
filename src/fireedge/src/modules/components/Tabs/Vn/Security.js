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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import {
  bindSecGroupTemplate,
  isRestrictedAttributes,
  unbindSecGroupTemplate,
} from '@UtilsModule'

import { Box } from '@mui/material'
import { Plus, Trash as DeleteIcon } from 'iconoir-react'

import { SecurityGroupAPI, VnAPI, useGeneralApi } from '@FeaturesModule'

import { T, VN_ACTIONS, STYLE_BUTTONS } from '@ConstantsModule'
import { GlobalAction, SecurityGroupsTable } from '@modules/components/Tables'

import { ChangeForm } from '@modules/components/Forms/SecurityGroups'

import { SecurityGroupCard } from '@modules/components/Cards'
import { SubmitButton } from '@modules/components/FormControl'

import { jsonToXml } from '@ModelsModule'

const { ADD_SECGROUP } = VN_ACTIONS

const RowComponent = ({ secgroup, vnet, extra }) => {
  const {
    headerList,
    onClickLabel,
    rowDataCy,
    isSelected,
    toggleRowSelected,
    ...rest
  } = extra
  const [update] = VnAPI.useUpdateVNetMutation()

  const { enqueueSuccess } = useGeneralApi()

  return (
    <SecurityGroupCard
      securityGroup={secgroup}
      rootProps={rest}
      actions={
        <SubmitButton
          data-cy={`provision-secgroup-unbind-${secgroup.ID}`}
          icon={<DeleteIcon />}
          onClick={async (evt) => {
            evt.stopPropagation()

            const newTemplate = unbindSecGroupTemplate(vnet, secgroup)

            const xml = jsonToXml(newTemplate)

            const response = await update({
              id: vnet.ID,
              template: xml,
            })
            response && enqueueSuccess(T.UnbindSecurityGroupSuccess)
          }}
        />
      }
    />
  )
}

RowComponent.propTypes = {
  secgroup: PropTypes.object,
  vnet: PropTypes.object,
  extra: PropTypes.object,
}

RowComponent.displayName = 'SecurityTab'

/**
 * Renders the list of security groups from a Virtual Network.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Network id
 * @param {object} props.oneConfig - OpenNebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to the oneadmin group
 * @returns {ReactElement} Security Groups tab
 */
const SecurityTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const { data: vnet } = VnAPI.useGetVNetworkQuery({ id })

  const [update] = VnAPI.useUpdateVNetMutation()
  const splittedSecGroups = vnet?.TEMPLATE.SECURITY_GROUPS?.split(',') ?? []
  const secGroups = [splittedSecGroups].flat().map((sgId) => +sgId)

  const { enqueueSuccess } = useGeneralApi()

  const useQuery = () =>
    SecurityGroupAPI.useGetSecGroupsQuery(undefined, {
      selectFromResult: ({ data: result = [], ...rest }) => ({
        data: result?.filter((secgroup) => secGroups.includes(+secgroup.ID)),
        ...rest,
      }),
    })

  /** @type {GlobalAction[]} */
  const globalActions =
    adminGroup ||
    !isRestrictedAttributes(
      'SECURITY_GROUPS',
      undefined,
      oneConfig?.VNET_RESTRICTED_ATTR
    )
      ? [
          actions[ADD_SECGROUP] && {
            accessor: VN_ACTIONS.ADD_SECGROUP,
            dataCy: VN_ACTIONS.ADD_SECGROUP,
            tooltip: T.SecurityGroup,
            icon: Plus,
            label: T.Create,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            options: [
              {
                dialogProps: { title: T.SecurityGroup },
                form: () => ChangeForm({ initialValues: vnet }),
                onSubmit: () => async (formData) => {
                  const { secgroups } = formData

                  const newTemplate = bindSecGroupTemplate(vnet, secgroups)

                  const xml = jsonToXml(newTemplate)

                  const response = await update({
                    id: vnet.ID,
                    template: xml,
                  })
                  response && enqueueSuccess(T.BindSecurityGroupSuccess)
                },
              },
            ],
          },
        ].filter(Boolean)
      : undefined

  return (
    <Box padding={{ sm: '0.8em', overflow: 'auto' }}>
      <SecurityGroupsTable.Table
        disableGlobalSort
        disableRowSelect
        pageSize={5}
        rowComponent={({ original: secgroup, handleClick: _, ...props }) => (
          <RowComponent secgroup={secgroup} vnet={vnet} extra={props} />
        )}
        globalActions={globalActions}
        useQuery={useQuery}
      />
    </Box>
  )
}

SecurityTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

SecurityTab.displayName = 'SecurityTab'

export default SecurityTab
