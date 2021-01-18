import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'
import DatastoreIcon from '@material-ui/icons/FolderOpen'

import SelectCard from 'client/components/Cards/SelectCard'
import { StatusBadge, StatusChip } from 'client/components/Status'
import Datastore from 'client/constants/datastore'

const useStyles = makeStyles(theme => ({
  card: { backgroundColor: theme.palette.primary.main },
  title: { display: 'flex', gap: '0.5rem' }
}))
const DatastoreCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const classes = useStyles()

    const { ID, NAME, TYPE, STATE } = value
    const type = Datastore.TYPES[TYPE]
    const state = Datastore.STATES[STATE]

    return (
      <SelectCard
        stylesProps={{ minHeight: 160 }}
        cardProps={{ className: classes.card, elevation: 2 }}
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
        actions={actions}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

DatastoreCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string
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
