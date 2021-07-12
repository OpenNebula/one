/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import * as React from 'react'
import PropTypes from 'prop-types'

import { Trash } from 'iconoir-react'
import { Typography } from '@material-ui/core'

// import { useVmApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import { VM_ACTIONS } from 'client/constants'

const NetworkItem = ({ nic = {}, actions }) => {
  const classes = rowStyles()

  const {
    NIC_ID,
    NETWORK = '-',
    BRIDGE,
    IP,
    MAC,
    PCI_ID,
    ALIAS
  } = nic

  const detachAction = () => actions.includes(VM_ACTIONS.DETACH_NIC) && (
    <Action
      cy={`${VM_ACTIONS.DETACH_NIC}-${NIC_ID}`}
      icon={<Trash size={18} />}
      handleClick={() => undefined}
    />
  )

  const renderLabels = labels => labels
    ?.filter(Boolean)
    ?.map(label => (
      <StatusChip key={label} text={label} style={{ marginInline: '0.5em' }}/>
    ))

  return (
    <div className={classes.root}>
      <div className={classes.main}>
        <div style={{ borderBottom: ALIAS.length ? '1px solid #c6c6c6' : '' }}>
          <Typography className={classes.titleText}>
            {`${NIC_ID} | ${NETWORK}`}
            {renderLabels([IP, MAC, BRIDGE && `BRIDGE - ${BRIDGE}`, PCI_ID])}
            {detachAction()}
          </Typography>
        </div>
        <div style={{ marginLeft: '1em' }}>
          {ALIAS?.map(({ NIC_ID, NETWORK = '-', BRIDGE, IP, MAC }) => (
            <Typography variant='body2' key={NIC_ID}>
              {`${NIC_ID} | ${NETWORK}`}
              {renderLabels([IP, MAC, BRIDGE && `BRIDGE - ${BRIDGE}`])}
              {detachAction()}
            </Typography>
          ))}
        </div>
      </div>
    </div>
  )
}

NetworkItem.propTypes = {
  nic: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string)
}

NetworkItem.displayName = 'NetworkItem'

export default NetworkItem
