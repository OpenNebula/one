import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'
import { Computer as HostIcon } from '@material-ui/icons'

import SelectCard from 'client/components/Cards/SelectCard'
import { StatusBadge, StatusChip } from 'client/components/Status'
import Host from 'client/constants/host'

const useStyles = makeStyles(() => ({
  title: { display: 'flex', gap: '0.5rem' }
}))

const HostCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const classes = useStyles()

    const { ID, NAME, STATE, IM_MAD: imMad, VM_MAD: vmMad } = value
    const state = Host.STATES[STATE]
    const mad = imMad === vmMad ? imMad : `${imMad}/${vmMad}`

    return (
      <SelectCard
        stylesProps={{ minHeight: 160 }}
        icon={
          <StatusBadge title={state?.name} stateColor={state.color}>
            <HostIcon />
          </StatusBadge>
        }

        title={
          <span className={classes.title}>
            <Typography title={NAME} noWrap component='span'>
              {NAME}
            </Typography>
            <StatusChip stateColor={'#c6c6c6'}>{mad}</StatusChip>
          </span>
        }
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
        actions={actions}
      />
    )
  },
  (prev, next) => (
    prev.isSelected === next.isSelected &&
    prev.value?.STATE === next.value?.STATE
  )
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
