import React, { memo } from 'react'
import PropTypes from 'prop-types'

import ProvisionIcon from '@material-ui/icons/Cloud'
import SelectCard from 'client/components/Cards/SelectCard'

const ProvisionCard = memo(({ value, actions }) => {
  const { ID, NAME } = value

  return (
    <SelectCard
      title={`${ID} - ${NAME}`}
      icon={<ProvisionIcon />}
      actions={actions}
    />
  )
})

ProvisionCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired
  }),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      iconColor: PropTypes.oneOf([
        'inherit', 'primary', 'secondary', 'action', 'error', 'disabled'
      ]),
      cy: PropTypes.string
    })
  )
}

ProvisionCard.defaultProps = {
  value: {},
  actions: undefined
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
