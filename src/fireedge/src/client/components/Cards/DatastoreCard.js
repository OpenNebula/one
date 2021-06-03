import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'
import { Folder as DatastoreIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { StatusBadge, StatusChip, LinearProgressWithLabel } from 'client/components/Status'

import { prettyBytes } from 'client/utils'
import Datastore from 'client/constants/datastore'

const useStyles = makeStyles(({
  title: {
    display: 'flex',
    gap: '0.5rem'
  },
  content: {
    padding: '2em',
    display: 'flex',
    flexFlow: 'column',
    gap: '1em'
  }
}))

const DatastoreCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const classes = useStyles()

    const { ID, NAME, TYPE, STATE, TOTAL_MB, USED_MB } = value
    const type = Datastore.TYPES[TYPE]
    const state = Datastore.STATES[STATE]

    const percentOfUsed = +USED_MB * 100 / +TOTAL_MB || 0
    const usedBytes = prettyBytes(+USED_MB, 'MB')
    const totalBytes = prettyBytes(+TOTAL_MB, 'MB')
    const percentLabel = `${usedBytes} / ${totalBytes} (${Math.round(percentOfUsed)}%)`

    return (
      <SelectCard
        action={actions?.map(action =>
          <Action key={action?.cy} {...action} />
        )}
        icon={
          <StatusBadge stateColor={state.color}>
            <DatastoreIcon />
          </StatusBadge>
        }
        title={
          <span className={classes.title}>
            <Typography title={NAME} noWrap component='span'>
              {NAME}
            </Typography>
            <StatusChip stateColor={'#c6c6c6'}>{type.name}</StatusChip>
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
  (prev, next) => (
    prev.isSelected === next.isSelected &&
    prev.value?.STATE === next.value?.STATE
  )
)

DatastoreCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string,
    TOTAL_MB: PropTypes.string,
    FREE_MB: PropTypes.string,
    USED_MB: PropTypes.string
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.node.isRequired,
      cy: PropTypes.string
    })
  )
}

DatastoreCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined
}

DatastoreCard.displayName = 'DatastoreCard'

export default DatastoreCard
