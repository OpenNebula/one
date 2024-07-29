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
import { Box, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { useGetVNetworkQuery } from 'client/features/OneApi/network'

import {
  AddAddressRangeAction,
  DeleteAddressRangeAction,
  UpdateAddressRangeAction,
} from 'client/components/Buttons'
import AddressRangeCard from 'client/components/Cards/AddressRangeCard'

import { AddressRange, VN_ACTIONS } from 'client/constants'

const { ADD_AR, UPDATE_AR, DELETE_AR } = VN_ACTIONS

/**
 * Renders the list of address ranges from a Virtual Network.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Network id
 * @param {object} props.oneConfig - Open Nebula configuration
 * @param {boolean} props.adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} AR tab
 */
const AddressTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const { data: vnet } = useGetVNetworkQuery({ id })

  /** @type {AddressRange[]} */
  const addressRanges = [vnet?.AR_POOL?.AR ?? []].flat()

  return (
    <Box padding={{ sm: '0.8em' }}>
      {actions[ADD_AR] === true && (
        <AddAddressRangeAction
          vnetId={id}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
        />
      )}

      <Stack gap="1em" py="0.8em">
        {addressRanges.map((ar) => (
          <AddressRangeCard
            key={ar.AR_ID}
            vnet={vnet}
            ar={ar}
            actions={
              <>
                {actions[UPDATE_AR] === true && (
                  <UpdateAddressRangeAction
                    vnetId={id}
                    ar={ar}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                  />
                )}
                {actions[DELETE_AR] === true && (
                  <DeleteAddressRangeAction
                    vnetId={id}
                    ar={ar}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                  />
                )}
              </>
            }
          />
        ))}
      </Stack>
    </Box>
  )
}

AddressTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

AddressTab.displayName = 'AddressTab'

export default AddressTab
