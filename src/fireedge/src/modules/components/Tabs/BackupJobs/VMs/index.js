/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
  useTheme,
} from '@mui/material'
import { useMemo, ReactElement, useState } from 'react'
import { css } from '@emotion/css'
import { RefreshDouble } from 'iconoir-react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH } from '@modules/components/path'

import { SubmitButton } from '@modules/components/FormControl'
import { Translate, Tr } from '@modules/components/HOC'
import { VmsTable } from '@modules/components/Tables'
import AttachVms from '@modules/components/Tabs/BackupJobs/VMs/Actions'
import { T } from '@ConstantsModule'
import { BackupJobAPI } from '@FeaturesModule'
import PropTypes from 'prop-types'

const useStyles = ({ palette, typography }) => ({
  graphStyle: css({
    '&': {
      width: '100% !important',
    },
  }),
  title: css({
    fontWeight: typography.fontWeightBold,
    borderBottom: `1px solid ${palette.divider}`,
    justifyContent: 'space-between',
  }),
  stretch: css({
    flexDirection: 'column',
    alignItems: 'stretch',
  }),
  center: css({
    flexDirection: 'column',
    alignItems: 'center',
  }),
  box: css({
    marginBottom: '15px',
  }),
  alert: css({
    '&': {
      margin: '15px 0',
      backgroundColor: palette.background.paper,
    },
  }),
  submit: css({
    fontSize: '1em',
  }),
  checked: css({
    '& svg': {
      color: 'rgba(168, 168, 168, 0.8)',
    },
  }),
})

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
  const theme = useTheme()
  const [get, { isFetching }] = BackupJobAPI.useLazyGetBackupJobQuery()
  const classes = useMemo(() => useStyles(theme), [theme])

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
  const theme = useTheme()
  const [state, setState] = useState(stateAll)

  const classes = useMemo(() => useStyles(theme), [theme])

  const path = PATH.INSTANCE.VMS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const { data: backupJobData } = BackupJobAPI.useGetBackupJobQuery({ id })
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
            <VmsTable.Table
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
