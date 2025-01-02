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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import {
  List,
  ListItem,
  Typography,
  Grid,
  Paper,
  Divider,
  useTheme,
} from '@mui/material'

import { ProvisionAPI } from '@FeaturesModule'
import useStyles from '@modules/containers/Provisions/DialogInfo/styles'
import { StatusChip, Tr } from '@ComponentsModule'
import { T, PROVISIONS_STATES } from '@ConstantsModule'

export const Info = memo(({ id }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  const { data = {} } = ProvisionAPI.useGetProvisionQuery(id)
  const { ID, TEMPLATE } = data
  const {
    state,
    description,
    name,
    provider: providerName,
    start_time: time,
    provision: { infrastructure = {} },
  } = TEMPLATE?.BODY

  const { id: clusterId = '', name: clusterName = '' } =
    infrastructure?.clusters?.[0] ?? {}
  const stateInfo = PROVISIONS_STATES[state]

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(T.Information)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{'ID'}</Typography>
              <Typography>{ID}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Name)}</Typography>
              <Typography data-cy="provision-name">{name}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Description)}</Typography>
              <Typography data-cy="provision-description" noWrap>
                {description}
              </Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Provider)}</Typography>
              <Typography data-cy="provider-name">{providerName}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Cluster)}</Typography>
              <Typography data-cy="provider-cluster">{`${clusterId} - ${clusterName}`}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.StartTime)}</Typography>
              <Typography>{new Date(time * 1000).toLocaleString()}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.State)}</Typography>
              <StatusChip
                stateColor={stateInfo?.color}
                text={stateInfo?.name}
              />
            </ListItem>
          </List>
        </Paper>
      </Grid>
    </Grid>
  )
})

Info.propTypes = { id: PropTypes.string.isRequired }
Info.displayName = 'Info'
