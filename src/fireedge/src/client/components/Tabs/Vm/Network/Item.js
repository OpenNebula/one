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
import {
  withStyles,
  makeStyles,
  Typography,
  Accordion,
  AccordionSummary as MAccordionSummary,
  AccordionDetails,
  useMediaQuery,
  Paper
} from '@material-ui/core'

import { useVmApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import Multiple from 'client/components/Tables/Vms/multiple'

import { T, VM_ACTIONS } from 'client/constants'
import { Tr } from 'client/components/HOC'

const AccordionSummary = withStyles({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    borderBottom: '1px solid rgba(0, 0, 0, .125)',
    marginBottom: -1,
    minHeight: 56,
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, .07)'
    },
    '&$expanded': {
      backgroundColor: 'rgba(0, 0, 0, .07)',
      minHeight: 56
    }
  },
  content: {
    overflow: 'hidden',
    '&$expanded': {
      margin: '12px 0'
    }
  },
  expanded: {}
})(MAccordionSummary)

const useStyles = makeStyles(({
  row: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap'
  },
  labels: {
    display: 'inline-flex',
    gap: '0.5em',
    alignItems: 'center'
  },
  details: {
    marginLeft: '1em',
    flexDirection: 'column',
    gap: '0.5em'
  },
  securityGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5em',
    padding: '0.8em'
  }
}))

const NetworkItem = ({ vmId, nic = {}, actions }) => {
  const classes = useStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const { detachNic, getVm } = useVmApi()

  const { NIC_ID, NETWORK = '-', BRIDGE, IP, MAC, PCI_ID, ALIAS, SECURITY_GROUPS } = nic

  const hasDetails = React.useMemo(() =>
    !!ALIAS.length || !!SECURITY_GROUPS?.length,
  [ALIAS.length, SECURITY_GROUPS?.length]
  )

  const detachAction = () => actions.includes(VM_ACTIONS.DETACH_NIC) && (
    <Action
      cy={`${VM_ACTIONS.DETACH_NIC}-${NIC_ID}`}
      icon={<Trash size={18} />}
      stopPropagation
      handleClick={async () => {
        const response = await detachNic(vmId, NIC_ID)

        String(response) === String(vmId) && getVm(vmId)
      }}
    />
  )

  return (
    <Accordion variant='outlined'>
      <AccordionSummary>
        <div className={classes.row}>
          <Typography noWrap>
            {`${NIC_ID} | ${NETWORK}`}
          </Typography>
          <span className={classes.labels}>
            <Multiple
              limitTags={isMobile ? 1 : 4}
              tags={[IP, MAC, BRIDGE && `BRIDGE - ${BRIDGE}`, PCI_ID].filter(Boolean)}
            />
          </span>
          {!isMobile && detachAction()}
        </div>
      </AccordionSummary>
      {hasDetails && (
        <AccordionDetails className={classes.details}>
          {ALIAS?.map(({ NIC_ID, NETWORK = '-', BRIDGE, IP, MAC }) => (
            <div key={NIC_ID} className={classes.row}>
              <Typography noWrap variant='body2'>
                {`Alias ${NIC_ID} | ${NETWORK}`}
              </Typography>
              <span className={classes.labels}>
                <Multiple
                  limitTags={isMobile ? 1 : 4}
                  tags={[IP, MAC, BRIDGE && `BRIDGE - ${BRIDGE}`].filter(Boolean)}
                />
              </span>
              {!isMobile && detachAction()}
            </div>
          ))}
          {!!SECURITY_GROUPS?.length && (
            <Paper variant='outlined' className={classes.securityGroups}>
              <Typography variant='body1'>{Tr(T.SecurityGroups)}</Typography>

              {SECURITY_GROUPS
                ?.map(({ ID, NAME, PROTOCOL, RULE_TYPE, ICMP_TYPE, RANGE, NETWORK_ID }, idx) => (
                  <div key={`${idx}-${NAME}`} className={classes.row}>
                    <Typography noWrap variant='body2'>
                      {`${ID} | ${NAME}`}
                    </Typography>
                    <span className={classes.labels}>
                      <Multiple
                        limitTags={isMobile ? 2 : 5}
                        tags={[PROTOCOL, RULE_TYPE, RANGE, NETWORK_ID, ICMP_TYPE].filter(Boolean)}
                      />
                    </span>
                  </div>
                ))}
            </Paper>
          )}
        </AccordionDetails>
      )}
    </Accordion>
  )
}

NetworkItem.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  vmId: PropTypes.string,
  nic: PropTypes.object
}

NetworkItem.displayName = 'NetworkItem'

export default NetworkItem
