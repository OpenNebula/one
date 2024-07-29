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
import {
  Alert,
  Fade,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import RefreshDouble from 'iconoir-react/dist/RefreshDouble'
import { ReactElement, useState } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH } from 'client/apps/sunstone/routesOne'

import { SubmitButton } from 'client/components/FormControl'
import { Translate, Tr } from 'client/components/HOC'
import { VmsTable } from 'client/components/Tables'
import AttachVms from 'client/components/Tabs/BackupJobs/VMs/Actions'
import { T } from 'client/constants'
import {
  useGetBackupJobQuery,
  useLazyGetBackupJobQuery,
} from 'client/features/OneApi/backupjobs'
import PropTypes from 'prop-types'

const useStyles = makeStyles(({ palette, typography }) => ({
  graphStyle: {
    '&': {
      width: '100% !important',
    },
  },
  title: {
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
    justifyContent: 'space-between',
  },
  stretch: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  center: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  box: {
    marginBottom: '15px',
  },
  alert: {
    '&': {
      margin: '15px 0',
      backgroundColor: palette.background.paper,
    },
  },
  submit: {
    fontSize: '1em',
  },
  checked: {
    '& svg': {
      color: 'rgba(168, 168, 168, 0.8)',
    },
  },
}))

const statBackingUp = 'backinUp'
const stateError = 'error'
const stateOutdated = 'outdated'
const stateAll = 'all'

const states = {
  [stateAll]: {
    select: T.All,
    title: T.VMsBackupJob,
    value: '',
  },
  [statBackingUp]: {
    select: T.VMsBackupJobBackingUpState,
    title: T.VMsBackupJobBackingUp,
    value: 'BACKING_UP_VMS',
  },
  [stateError]: {
    select: T.Error,
    title: T.VMsBackupJobError,
    value: 'ERROR_VMS',
  },
  [stateOutdated]: {
    select: T.VMsBackupJobOutdatedState,
    title: T.VMsBackupJobOutdated,
    value: 'OUTDATED_VMS',
  },
}

const AlertVmsErrors = ({ id, vmsOutdated, state }) => {
  const [get, { isFetching }] = useLazyGetBackupJobQuery()
  const classes = useStyles()

  return (
    <>
      <Fade in={!!vmsOutdated?.ID && state === stateError} unmountOnExit>
        <Alert
          variant="outlined"
          severity="warning"
          sx={{ gridColumn: 'span 2' }}
          className={classes.alert}
          action={
            <SubmitButton
              className={classes.submit}
              icon={<RefreshDouble />}
              tooltip={<Translate word={T.Refresh} />}
              isSubmitting={isFetching}
              onClick={() => get({ id })}
            />
          }
        >
          <Translate word={T.BackupJobRefresh} />
        </Alert>
      </Fade>
    </>
  )
}

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - backup job id
 * @returns {ReactElement} Information tab
 */
const VmsInfoTab = ({ id }) => {
  const [state, setState] = useState(stateAll)

  const classes = useStyles()

  const path = PATH.INSTANCE.VMS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const { data: backupJobData } = useGetBackupJobQuery({ id })
  const { TEMPLATE, OUTDATED_VMS = {}, ID } = backupJobData

  const handleChangeState = (evt) => setState(evt.target.value)

  return (
    <>
      <FormControl>
        <Paper
          variant="outlined"
          sx={{ height: 'fit-content' }}
          className={classes.box}
        >
          <List>
            <ListItem className={classes.title}>
              <Typography noWrap>
                <Translate word={T.FilterBy} />
              </Typography>
            </ListItem>
            <ListItem className={classes.center}>
              <RadioGroup
                row
                aria-labelledby="filter_vms"
                value={state}
                onChange={handleChangeState}
              >
                {Object.keys(states).map((type) => (
                  <FormControlLabel
                    className={state === type ? classes.checked : ''}
                    key={type}
                    value={type}
                    control={<Radio />}
                    label={Tr(states[type].select)}
                  />
                ))}
              </RadioGroup>
            </ListItem>
          </List>
        </Paper>
      </FormControl>

      <Paper
        variant="outlined"
        sx={{ height: 'fit-content' }}
        className={classes.box}
      >
        <List>
          <ListItem className={classes.title}>
            <Typography noWrap>
              <Translate word={states?.[state]?.title || ''} />
            </Typography>
            <AttachVms id={ID} template={TEMPLATE} />
          </ListItem>
          <ListItem className={classes.stretch}>
            <AlertVmsErrors vmsOutdated={OUTDATED_VMS} id={ID} state={state} />
            <VmsTable
              disableRowSelect
              disableGlobalSort
              backupjobs={backupJobData}
              backupjobsState={states?.[state]?.value || ''}
              onRowClick={(row) => handleRowClick(row.ID)}
            />
          </ListItem>
        </List>
      </Paper>
    </>
  )
}

AlertVmsErrors.propTypes = {
  vmsErrors: PropTypes.object,
  message: PropTypes.string,
  id: PropTypes.string,
  vmsOutdated: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  state: PropTypes.string,
}

AlertVmsErrors.displayName = 'AlertVmsErrors'

VmsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmsInfoTab.displayName = 'VmsInfoTab'

export default VmsInfoTab
