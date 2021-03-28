import React, { memo } from 'react'
import PropTypes from 'prop-types'

import NetworkIcon from '@material-ui/icons/AccountTree'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { LinearProgressWithLabel } from 'client/components/Status'

const NetworkCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME, USED_LEASES = '', AR_POOL } = value

    const addresses = [AR_POOL?.AR ?? []].flat()
    const totalLeases = addresses.reduce((res, ar) => +ar.SIZE + res, 0)

    const percentOfUsed = +USED_LEASES * 100 / +totalLeases || 0
    const percentLabel = `${USED_LEASES} / ${totalLeases} (${Math.round(percentOfUsed)}%)`

    return (
      <SelectCard
        action={actions?.map(action =>
          <Action key={action?.cy} {...action} />
        )}
        icon={<NetworkIcon />}
        title={NAME}
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <div style={{ padding: '2em' }}>
          <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
        </div>
      </SelectCard>
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

NetworkCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string,
    USED_LEASES: PropTypes.string,
    AR_POOL: PropTypes.shape({
      AR: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
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

NetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
