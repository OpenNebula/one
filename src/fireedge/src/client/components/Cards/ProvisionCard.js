import React, { memo } from 'react'
import PropTypes from 'prop-types'

import SelectCard from 'client/components/Cards/SelectCard'

const DEFAULT_IMAGE = '/client/assets/provision.jpg'

const ProvisionCard = memo(({ value, actions }) => {
  const { ID, NAME, TEMPLATE: { PLAIN = '{}' } } = value
  const { image = DEFAULT_IMAGE } = JSON.parse(PLAIN)

  return (
    <SelectCard
      title={`${ID} - ${NAME}`}
      actions={actions}
      mediaProps={{
        component: 'img',
        image,
        onError: evt => {
          evt.target.src = DEFAULT_IMAGE
        }
      }}
    />
  )
})

ProvisionCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TEMPLATE: PropTypes.shape({
      PLAIN: PropTypes.string,
      PROVISION_BODY: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
      ])
    })
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
