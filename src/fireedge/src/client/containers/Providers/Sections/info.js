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
import { memo } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { List, ListItem, Typography, Grid, Paper, Divider } from '@mui/material'
import { EyeEmpty as EyeIcon } from 'iconoir-react'

import {
  useLazyGetProviderConnectionQuery,
  useGetProviderQuery,
} from 'client/features/OneApi/provider'
import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import useStyles from 'client/containers/Providers/Sections/styles'

const Info = memo(({ id }) => {
  const classes = useStyles()
  const [
    getConnection,
    { data: decryptConnection, isLoading: noConnectionYet },
  ] = useLazyGetProviderConnectionQuery()
  const { data: provider } = useGetProviderQuery(id)

  const { NAME, TEMPLATE } = provider
  const {
    connection,
    description,
    provider: providerName,
    registration_time: time,
  } = TEMPLATE?.PROVISION_BODY

  const hasConnection = connection && Object.keys(connection).length > 0

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" className={classes.marginBottom}>
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(T.Information)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{'ID'}</Typography>
              <Typography>{id}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Name)}</Typography>
              <Typography data-cy="provider-name">{NAME}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Description)}</Typography>
              <Typography data-cy="provider-description" noWrap>
                {description}
              </Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Provider)}</Typography>
              <Typography data-cy="provider-type">{providerName}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.RegistrationTime)}</Typography>
              <Typography>{new Date(time * 1000).toLocaleString()}</Typography>
            </ListItem>
          </List>
        </Paper>
        {hasConnection && (
          <Paper variant="outlined">
            <List className={clsx(classes.list, 'w-50')}>
              <ListItem className={classes.title}>
                <Typography>{Tr(T.Credentials)}</Typography>
                {!decryptConnection && (
                  <span className={classes.alignToRight}>
                    <SubmitButton
                      data-cy="provider-connection"
                      icon={<EyeIcon />}
                      onClick={async () => await getConnection(id)}
                      isSubmitting={noConnectionYet}
                    />
                  </span>
                )}
              </ListItem>
              <Divider />
              {Object.entries(connection)?.map(
                ([key, value]) =>
                  typeof value === 'string' && (
                    <ListItem key={key}>
                      <Typography>{key}</Typography>
                      <Typography data-cy={`provider-${key}`}>
                        {decryptConnection?.[key] ?? value}
                      </Typography>
                    </ListItem>
                  )
              )}
            </List>
          </Paper>
        )}
      </Grid>
    </Grid>
  )
})

Info.propTypes = { id: PropTypes.string.isRequired }
Info.displayName = 'Info'

export default Info
