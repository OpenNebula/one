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
import { ReactElement, memo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { rowStyles } from 'client/components/Tables/styles'
import { StatusChip } from 'client/components/Status'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const PciCard = memo(
  /**
   * @param {object} props - Props
   * @param {object} props.pci - PCI device
   * @param {object} props.indexPci - Index of pci in the pci list
   * @param {object} props.actions - Actions on card
   * @returns {ReactElement} - Card
   */
  ({ pci = {}, indexPci, actions }) => {
    const classes = rowStyles()

    const {
      DEVICE,
      VENDOR,
      CLASS,
      DEVICE_NAME,
      VENDOR_NAME,
      CLASS_NAME,
      SHORT_ADDRESS,
      NAME,
      PCI_ID,
    } = pci

    const name = PCI_ID ? `PCI${PCI_ID}` : `${NAME}`

    const title = DEVICE_NAME
      ? `${name}: ${DEVICE_NAME}`
      : SHORT_ADDRESS && `${name}: ${SHORT_ADDRESS}`

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`pci-${indexPci}`}
        sx={{ flexWrap: 'wrap', boxShadow: 'none !important' }}
      >
        <Box className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" data-cy={`pci-name`}>
              <span title={`${Tr(T.Device)}: ${DEVICE}`}>{title}</span>
            </Typography>
            <span className={classes.labels}>
              {SHORT_ADDRESS && (
                <span key={`pci-${indexPci}`} title={`${Tr(T.ShortAddress)}`}>
                  <StatusChip
                    text={`${SHORT_ADDRESS}`}
                    dataCy={`pci-address-${indexPci}`}
                    stateColor={'info'}
                  />
                </span>
              )}
            </span>
          </div>
          <div className={classes.caption}>
            <span>{`#${indexPci}`}</span>
            {VENDOR && (
              <span title={`${Tr(T.Vendor)}: ${VENDOR}`}>{`${Tr(
                T.Vendor
              )}: ${VENDOR_NAME}`}</span>
            )}
            {CLASS && (
              <span title={`${Tr(T.Class)}: ${CLASS}`}>{`${Tr(
                T.Class
              )}: ${CLASS_NAME}`}</span>
            )}
          </div>
        </Box>
        <div className={classes.actions}>{actions}</div>
      </Paper>
    )
  }
)

PciCard.propTypes = {
  indexPci: PropTypes.number,
  pci: PropTypes.object,
  actions: PropTypes.node,
}

PciCard.displayName = 'PciCard'

export default PciCard
