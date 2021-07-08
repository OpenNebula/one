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
import * as React from 'react'
import { makeStyles, Paper, Typography } from '@material-ui/core'

import { Action } from 'client/components/Cards/SelectCard'
import * as VirtualMachine from 'client/models/VirtualMachine'
import { prettyBytes } from 'client/utils'

const useStyles = makeStyles(theme => ({
  root: {
    padding: '1em'
  },
  grid: {
    padding: '1em',
    display: 'grid',
    gap: '1em',
    gridAutoFlow: 'column',
    [theme.breakpoints.down('sm')]: {
      gridAutoFlow: 'initial'
    }
  },
  item: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      gap: '1em',
      '& > *': {
        width: '50%'
      }
    }
  },
  actions: {
    [theme.breakpoints.down('sm')]: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: '1em'
    },
    [theme.breakpoints.up('md')]: {
      order: 1,
      textAlign: 'end'
    }
  },
  title: {
    fontWeight: theme.typography.fontWeightBold
  }
}))

const VmCapacityTab = data => {
  const classes = useStyles()

  const { TEMPLATE } = data

  const isVCenter = VirtualMachine.isVCenter(data)

  const capacity = [
    { key: 'Physical CPU', value: TEMPLATE?.CPU },
    { key: 'Virtual CPU', value: TEMPLATE?.VCPU ?? '-' },
    (isVCenter && {
      key: 'Virtual Cores',
      value: `
      Cores x ${TEMPLATE?.TOPOLOGY?.CORES || '-'} |
      Sockets ${TEMPLATE?.TOPOLOGY?.SOCKETS || '-'}`
    }),
    { key: 'Memory', value: prettyBytes(+TEMPLATE?.MEMORY, 'MB') },
    { key: 'Cost / CPU', value: TEMPLATE?.CPU_COST || 0 },
    { key: 'Cost / MByte', value: TEMPLATE?.MEMORY_COST || 0 }
  ].filter(Boolean)

  return (
    <div className={classes.root}>
      <Paper variant='outlined' className={classes.grid}>
        <div className={classes.actions}>
          <Action
            cy='resize'
            icon={false}
            label={'Resize'}
            size='small'
            color='secondary'
            handleClick={() => undefined}
          />
        </div>
        {capacity.map(({ key, value }) => (
          <div key={key} className={classes.item}>
            <Typography className={classes.title} noWrap title={key}>
              {key}
            </Typography>
            <Typography variant='body2' noWrap title={value}>
              {value}
            </Typography>
          </div>
        ))}
      </Paper>
    </div>
  )
}

VmCapacityTab.displayName = 'VmCapacityTab'

export default VmCapacityTab
