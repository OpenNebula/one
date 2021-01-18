import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@material-ui/core'
import NetworkIcon from '@material-ui/icons/AccountTree'
import SelectCard from 'client/components/Cards/SelectCard'

const useStyles = makeStyles(theme => ({
  card: { backgroundColor: theme.palette.primary.main }
}))

const NetworkCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME } = value
    const classes = useStyles()

    return (
      <SelectCard
        stylesProps={{ minHeight: 120 }}
        cardProps={{ className: classes.card, elevation: 2 }}
        icon={<NetworkIcon />}
        title={NAME}
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
        actions={actions}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

NetworkCard.propTypes = {
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

NetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
