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

import PropTypes from 'prop-types'
import { Component } from 'react'
import { Box, Button, List, ListItem } from '@mui/material'
import Legend from 'client/components/Forms/Legend'
import NicCard from './NicCard'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'
import { useGetSecGroupsQuery } from 'client/features/OneApi/securityGroup'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Renders a column of NICs with actions to add, remove, and select NICs.
 *
 * @param {object} props - The props object.
 * @param {Array} props.nics - An array of NIC objects.
 * @param {Function} props.addNic - A function to add a new NIC.
 * @param {Function} props.removeNic - A function to remove a NIC.
 * @param {Function} props.selectNic - A function to select a NIC.
 * @param {number} props.activeNic - The index of the currently active NIC.
 * @returns {Component} NicColumn.
 */
const NicColumn = ({ nics, addNic, removeNic, selectNic, activeNic } = {}) => {
  const { data: vnets } = useGetVNetworksQuery()
  const { data: secgroups } = useGetSecGroupsQuery()

  return (
    <Box
      pt={1}
      display="flex"
      flexDirection="column"
      height="100%"
      position="relative"
    >
      <Legend title={Tr(T.VirtualRouterNICConfigured)} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          flexGrow: 1,
          overflowY: 'auto',
          maxHeight: 'calc(100% - 2px)',
        }}
      >
        <List
          disablePadding
          sx={{
            width: '100%',
          }}
        >
          {Array.isArray(nics) &&
            nics?.length > 0 &&
            nics.map((nic, index) => (
              <ListItem disableGutters key={`${nic?.id}-${nic?.nicId}`}>
                <NicCard
                  info={{
                    ...nic,
                    ...(nic?.network_id && nic?.network_id !== ''
                      ? {
                          network: vnets?.find(
                            (vnet) => vnet?.ID === nic?.network_id
                          )?.NAME,
                        }
                      : { network: Tr(T.VirtualRouterNICNetworkName) }),

                    ...(nic?.secgroup !== ''
                      ? {
                          secgroup: secgroups?.find(
                            (secgroup) => secgroup?.ID === nic?.secgroup
                          )?.NAME,
                        }
                      : { secgroup: 'sadfasd' }),
                  }}
                  removeNic={removeNic}
                  selectNic={selectNic}
                  active={index === activeNic}
                />
              </ListItem>
            ))}
        </List>
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => addNic()}
        size="large"
        data-cy="add-nic"
        sx={{
          width: '100%',
          marginTop: 'auto',
        }}
      >
        {Tr(T.VirtualRouterNICAdd)}
      </Button>
    </Box>
  )
}

NicColumn.propTypes = {
  nics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
    })
  ),
  addNic: PropTypes.func,
  removeNic: PropTypes.func,
  selectNic: PropTypes.func,
  activeNic: PropTypes.number,
}

export default NicColumn
