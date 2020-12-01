import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Chip, Box, Typography } from '@material-ui/core'
import { FolderOpen as DatastoreIcon } from '@material-ui/icons'

import SelectCard from 'client/components/Cards/SelectCard'
import Datastore from 'client/constants/datastore'

const useStyles = makeStyles(() => ({
  title: { display: 'flex', gap: '8px' },
  state: { backgroundColor: ({ stateColor }) => stateColor }
}))

const DatastoreCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME, TYPE, STATE } = value
    const type = Datastore.TYPES[TYPE]
    const state = Datastore.STATES[STATE]

    const classes = useStyles({ stateColor: state.color })

    const renderChip = ({ label, ...props }) =>
      <Chip size="small" title={label} label={label} {...props} />

    return (
      <SelectCard
        stylesProps={{ minHeight: 160 }}
        icon={<DatastoreIcon />}
        title={(
          <Box component="span" className={classes.title}>
            <Typography noWrap>{`${ID} - ${NAME}`}</Typography>
            {renderChip({ label: type.name })}
          </Box>
        )}
        subheader={renderChip({ label: state.name, className: classes.state })}
        cardHeaderProps={{ disableTypography: true }}
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
