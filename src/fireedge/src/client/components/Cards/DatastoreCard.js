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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Typography } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Folder as DatastoreIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import {
  StatusBadge,
  StatusChip,
  LinearProgressWithLabel,
} from 'client/components/Status'

import * as DatastoreModel from 'client/models/Datastore'

const useStyles = makeStyles({
  title: {
    display: 'flex',
    gap: '0.5rem',
  },
  content: {
    padding: '2em',
    display: 'flex',
    flexFlow: 'column',
    gap: '1em',
  },
})

const DatastoreCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const classes = useStyles()

    const { ID, NAME } = value

    const type = DatastoreModel.getType(value)
    const state = DatastoreModel.getState(value)

    const { percentOfUsed, percentLabel } =
      DatastoreModel.getCapacityInfo(value)

    return (
      <SelectCard
        action={actions?.map((action) => (
          <Action key={action?.cy} {...action} />
        ))}
        icon={
          <StatusBadge stateColor={state.color}>
            <DatastoreIcon />
          </StatusBadge>
        }
        title={
          <span className={classes.title}>
            <Typography title={NAME} noWrap component="span">
              {NAME}
            </Typography>
            <StatusChip text={type} />
          </span>
        }
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <div className={classes.content}>
          <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
        </div>
      </SelectCard>
    )
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.value?.STATE === next.value?.STATE
)

DatastoreCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string,
    TOTAL_MB: PropTypes.string,
    FREE_MB: PropTypes.string,
    USED_MB: PropTypes.string,
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.node.isRequired,
      cy: PropTypes.string,
    })
  ),
}

DatastoreCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined,
}

DatastoreCard.displayName = 'DatastoreCard'

export default DatastoreCard
