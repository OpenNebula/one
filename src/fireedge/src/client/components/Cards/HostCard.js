import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'
import { HardDrive as HostIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { StatusBadge, StatusChip, LinearProgressWithLabel } from 'client/components/Status'

import * as HostModel from 'client/models/Host'

const useStyles = makeStyles({
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
})

const HostCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const classes = useStyles()

    const { ID, NAME, IM_MAD, VM_MAD } = value

    const {
      percentCpuUsed,
      percentCpuLabel,
      percentMemUsed,
      percentMemLabel
    } = HostModel.getAllocatedInfo(value)

    const state = HostModel.getState(value)

    const mad = IM_MAD === VM_MAD ? IM_MAD : `${IM_MAD}/${VM_MAD}`

    return (
      <SelectCard
        action={actions?.map(action =>
          <Action key={action?.cy} {...action} />
        )}
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
            <StatusChip text={mad} />
          </span>
        }
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <div className={classes.content}>
          <LinearProgressWithLabel value={percentCpuUsed} label={percentCpuLabel} />
          <LinearProgressWithLabel value={percentMemUsed} label={percentMemLabel} />
        </div>
      </SelectCard>
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
    VM_MAD: PropTypes.string,
    HOST_SHARE: PropTypes.shape({
      CPU_USAGE: PropTypes.string,
      TOTAL_CPU: PropTypes.string,
      MEM_USAGE: PropTypes.string,
      TOTAL_MEM: PropTypes.string
    })
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
