import React, { memo } from 'react'
import PropTypes from 'prop-types'

import TemplateIcon from '@material-ui/icons/Description'
import SelectCard from 'client/components/Cards/SelectCard'

const ProviderCard = memo(({ value, actions }) => {
  const { ID, NAME } = value

  return (
    <SelectCard
      title={`${ID} - ${NAME}`}
      icon={<TemplateIcon />}
      actions={actions}
    />
  )
})

ProviderCard.propTypes = {
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

ProviderCard.defaultProps = {
  value: {},
  actions: undefined
}

ProviderCard.displayName = 'ProviderCard'

export default ProviderCard
