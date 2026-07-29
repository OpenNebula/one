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

import { TablePanel } from '@ComponentsV2Module'
import { secGroupVmTable, SECGROUP_VM_COLUMNS } from '@ModelsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { Component } from 'react'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Security Group VMs tab
 */
export const Vms = ({ data, config }) => {
  const { selected } = data ?? {}

  const selectedVmIds = [
    ...new Set(
      []
        .concat(selected?.ERROR_VMS?.ID)
        .concat(selected?.OUTDATED_VMS?.ID)
        .concat(selected?.UPDATED_VMS?.ID)
    ),
  ]

  const { data: vms = [], isFetching: isLoadingVms } = secGroupVmTable.useData(
    { ids: selectedVmIds },
    { refetchOnMountOrArgChange: true }
  )

  return (
    <Box className="vmsContainer">
      <TablePanel
        key={'Vms-tab'}
        columns={secGroupVmTable.columns([...SECGROUP_VM_COLUMNS])}
        data={vms}
        isLoading={isLoadingVms}
        openRowDetailsOnClick
        rowDetailsResourceId={RESOURCE_NAMES.VM}
      />
    </Box>
  )
}

Vms.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Vms.id = 'vms'
Vms.title = T.VMs
