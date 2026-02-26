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
import { Box, Button, Stack, Typography, useTheme } from '@mui/material'
import { css } from '@emotion/css'
import {
  ModernTv as VmIcon,
  Server as HostIcon,
  Database as DatastoreIcon,
  Settings as SettingsIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { useViews } from '@FeaturesModule'
import { Translate, PATH } from '@ComponentsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'

const { VM_TEMPLATE, HOST, DATASTORE } = RESOURCE_NAMES

const styles = ({ palette, typography }) => ({
  root: css({
    padding: typography.pxToRem(24),
    borderRadius: typography.pxToRem(16),
    backgroundColor: palette.background.paper,
    height: '100%',
  }),
  title: css({
    marginBottom: typography.pxToRem(16),
    fontSize: typography.pxToRem(21),
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: typography.pxToRem(20),
  }),
})

/**
 * Quick Actions widget — navigation shortcuts for common admin actions.
 *
 * @param {object} props - Props
 * @param {string} props.view - Current view name
 * @returns {ReactElement} QuickActions panel
 */
const QuickActions = memo(({ view }) => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const { hasAccessToResource } = useViews()
  const { push: goTo } = useHistory()

  const templateAccess = useMemo(
    () => hasAccessToResource(VM_TEMPLATE),
    [view]
  )
  const hostAccess = useMemo(() => hasAccessToResource(HOST), [view])
  const datastoreAccess = useMemo(
    () => hasAccessToResource(DATASTORE),
    [view]
  )

  return (
    <Box className={classes.root}>
      <Typography variant="h6" className={classes.title}>
        <Translate word={T.QuickActions} />
      </Typography>
      <Stack spacing={2}>
        {templateAccess && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<VmIcon />}
            onClick={() => goTo(PATH.TEMPLATE.VMS.INSTANTIATE)}
          >
            <Translate word={T.CreateVM} />
          </Button>
        )}
        {hostAccess && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<HostIcon />}
            onClick={() => goTo(PATH.INFRASTRUCTURE.HOSTS.LIST)}
          >
            <Translate word={T.ViewHosts} />
          </Button>
        )}
        {datastoreAccess && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<DatastoreIcon />}
            onClick={() => goTo(PATH.STORAGE.DATASTORES.LIST)}
          >
            <Translate word={T.ViewDatastores} />
          </Button>
        )}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<SettingsIcon />}
          onClick={() => goTo(PATH.SETTINGS)}
        >
          <Translate word={T.Settings} />
        </Button>
      </Stack>
    </Box>
  )
})

QuickActions.displayName = 'QuickActions'

QuickActions.propTypes = {
  view: PropTypes.string,
}

export default QuickActions
