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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import {
  AddCircledOutline as AddIcon,
  Trash as DeleteIcon,
} from 'iconoir-react/dist'
import { Box } from '@mui/material'

import { useGetSecGroupsQuery } from 'client/features/OneApi/securityGroup'
import {
  useGetVNetworkQuery,
  useUpdateVNetMutation,
} from 'client/features/OneApi/network'
import { unbindSecGroupTemplate } from 'client/utils/secgroup'

import { SecurityGroupsTable, GlobalAction } from 'client/components/Tables'
import { T, VN_ACTIONS } from 'client/constants'

import { isRestrictedAttributes } from 'client/utils'
import { ChangeForm } from 'client/components/Forms/SecurityGroups'

import { SecurityGroupCard } from 'client/components/Cards'
import { SubmitButton } from 'client/components/FormControl'

import { useGeneralApi } from 'client/features/General'
import { jsonToXml } from 'client/models/Helper'

const { ADD_SECGROUP } = VN_ACTIONS

const RowComponent = ({ secgroup, vnet, updateVNet, extra }) => {
  const { headerList, onClickLabel, rowDataCy, ...rest } = extra

  const { enqueueSuccess } = useGeneralApi()

  return (
    <SecurityGroupCard
      securityGroup={secgroup}
      rootProps={rest}
      actions={
        <>
          <SubmitButton
            data-cy={`provision-secgroup-unbind-${secgroup.ID}`}
            icon={<DeleteIcon />}
            onClick={async (evt) => {
              evt.stopPropagation()

              const newTemplate = unbindSecGroupTemplate(vnet, secgroup)

              const xml = jsonToXml(newTemplate)

              const response = await updateVNet({
                id: vnet.ID,
                template: xml,
              })
              response && enqueueSuccess(T.UnbindSecurityGroupSuccess)
            }}
          />
        </>
      }
    />
  )
}

RowComponent.propTypes = {
  secgroup: PropTypes.object,
  vnet: PropTypes.object,
  updateVNet: PropTypes.func,
  extra: PropTypes.shape({
    headerList: PropTypes.boolean,
    onClickLabel: PropTypes.func,
    rowDataCy: PropTypes.string,
  }),
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
  const { data: vnet } = useGetVNetworkQuery({ id })

  const splittedSecGroups = vnet?.TEMPLATE.SECURITY_GROUPS?.split(',') ?? []
  const secGroups = [splittedSecGroups].flat().map((sgId) => +sgId)

  const [updateVNet] = useUpdateVNetMutation()

  const { enqueueSuccess } = useGeneralApi()

  const useQuery = () =>
    useGetSecGroupsQuery(undefined, {
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
            icon: AddIcon,
            options: [
              {
                dialogProps: { title: T.SecurityGroup },
                form: () => ChangeForm({ initialValues: vnet }),
                onSubmit: () => async (xml) => {
                  const response = await updateVNet({
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
      <SecurityGroupsTable
        disableGlobalSort
        disableRowSelect
        pageSize={5}
        rowComponent={({ original: secgroup, handleClick: _, ...props }) => (
          <RowComponent
            secgroup={secgroup}
            vnet={vnet}
            updateVNet={updateVNet}
            extra={props}
          />
        )}
        // onRowClick={detailAccess ? redirectToSecGroup : undefined}
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
