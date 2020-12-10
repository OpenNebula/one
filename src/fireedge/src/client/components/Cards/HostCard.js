import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Avatar, Chip, Box, Typography } from '@material-ui/core'

import SelectCard from 'client/components/Cards/SelectCard'
import { StatusBadge } from 'client/components/Status'
import Host from 'client/constants/host'

const useStyles = makeStyles(theme => ({
  title: { display: 'flex', gap: '8px' },
  avatar: {
    width: '5ch',
    height: '5ch',
    color: theme.palette.primary.contrastText
  },
  card: { backgroundColor: theme.palette.primary.main }
}))

const HostCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME, STATE, IM_MAD: imMad, VM_MAD: vmMad } = value
    const state = Host.STATES[STATE]
    const mad = imMad === vmMad ? imMad : `${imMad}/${vmMad}`

    const classes = useStyles()

    const renderChip = ({ label, ...props }) =>
      <Chip size="small" title={label} label={label} {...props} />

    return (
      <SelectCard
        stylesProps={{ minHeight: 160 }}
        cardProps={{ className: classes.card, elevation: 2 }}
        icon={
          <StatusBadge stateColor={state.color}>
            <Avatar className={classes.avatar} title={state.name}>{ID}</Avatar>
          </StatusBadge>
        }
        title={(
          <Box component="span" className={classes.title}>
            <Typography noWrap>{NAME}</Typography>
            {renderChip({ label: mad })}
          </Box>
        )}
        isSelected={isSelected}
        handleClick={handleClick}
        actions={actions}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

HostCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string,
    IM_MAD: PropTypes.string,
    VM_MAD: PropTypes.string
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

HostCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined
}

HostCard.displayName = 'HostCard'

export default HostCard
