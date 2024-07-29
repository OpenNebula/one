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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import AddIcon from 'iconoir-react/dist/AddCircledOutline'
import { useHistory } from 'react-router'
import { generatePath } from 'react-router-dom'
import { Box } from '@mui/material'

import { useViews } from 'client/features/Auth'
import { useGetSecGroupsQuery } from 'client/features/OneApi/securityGroup'
import { useGetVNetworkQuery } from 'client/features/OneApi/network'
// import {} from 'client/components/Tabs/VNetwork/Address/Actions'

import { SecurityGroupsTable, GlobalAction } from 'client/components/Tables'
import { T, VN_ACTIONS, RESOURCE_NAMES } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

import { isRestrictedAttributes } from 'client/utils'

const { SEC_GROUP } = RESOURCE_NAMES
const { ADD_SECGROUP } = VN_ACTIONS

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
  const { push: redirectTo } = useHistory()
  const { data: vnet } = useGetVNetworkQuery({ id })

  const { view, hasAccessToResource } = useViews()
  const detailAccess = useMemo(() => hasAccessToResource(SEC_GROUP), [view])

  const splittedSecGroups = vnet?.TEMPLATE.SECURITY_GROUPS?.split(',') ?? []
  const secGroups = [splittedSecGroups].flat().map((sgId) => +sgId)

  const redirectToSecGroup = (row) => {
    redirectTo(generatePath(PATH.NETWORK.SEC_GROUPS.DETAIL, { id: row.ID }))
  }

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
                form: undefined,
                onSubmit: () => async (formData) => {
                  console.log({ formData })
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
        onRowClick={detailAccess ? redirectToSecGroup : undefined}
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
