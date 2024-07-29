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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useHistory, generatePath } from 'react-router-dom'

import { PATH } from 'client/apps/sunstone/routesOne'

import { GroupsTable } from 'client/components/Tables'
import { useGetUserQuery } from 'client/features/OneApi/user'
import { useGetGroupsQuery } from 'client/features/OneApi/group'

import { Chip, Box, Grid, Typography } from '@mui/material'

import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Datastore id
 * @returns {ReactElement} Information tab
 */
const GroupsInfoTab = ({ id }) => {
  const path = PATH.SYSTEM.GROUPS.DETAIL
  const history = useHistory()
  const { data = [] } = useGetGroupsQuery()
  const { data: user } = useGetUserQuery({ id })
  const { GROUPS } = user

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const primaryGroup = GROUPS.ID[0]
  const secondaryGroups = GROUPS.ID.slice(1)

  const primaryGroupName = useMemo(() => {
    const primary = data.find(
      (group) =>
        group.ID === primaryGroup || String(group.ID) === String(primaryGroup)
    )

    return primary?.NAME
  }, [data, primaryGroup])

  const secondaryGroupNames = useMemo(() => {
    const foundGroups = data.filter((group) =>
      secondaryGroups.includes(String(group.ID))
    )

    return foundGroups.map((group) => group.NAME)
  }, [data, secondaryGroups])

  return (
    <div>
      <Grid container spacing={2} alignItems="center">
        {primaryGroupName && (
          <Grid item xs={12}>
            <Typography variant="h7">{Tr(T.Primary)}</Typography>
          </Grid>
        )}

        {primaryGroupName && (
          <Grid item>
            <Chip
              data-cy="primary-group"
              label={
                <Typography variant="subtitle2" component="span">
                  {primaryGroupName}
                </Typography>
              }
              color="primary"
            />
          </Grid>
        )}

        {secondaryGroupNames.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="body2">{Tr(T.Secondary)}</Typography>
          </Grid>
        )}

        {secondaryGroupNames.length > 0 &&
          secondaryGroupNames.map((name, index) => (
            <Grid item key={index}>
              <Chip
                data-cy={`secondary-group-${+index}`}
                label={
                  <Typography variant="body2" component="span">
                    {name}
                  </Typography>
                }
                color="secondary"
              />
            </Grid>
          ))}
      </Grid>

      <Box mt={2}>
        <GroupsTable
          disableRowSelect
          disableGlobalSort
          onRowClick={(row) => handleRowClick(row.ID)}
        />
      </Box>
    </div>
  )
}

GroupsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupsInfoTab.displayName = 'GroupsInfoTab'

export default GroupsInfoTab
