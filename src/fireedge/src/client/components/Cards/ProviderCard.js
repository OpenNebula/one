import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Avatar } from '@material-ui/core'
import SelectCard from 'client/components/Cards/SelectCard'

const DEFAULT_IMAGE = '/client/assets/provider.png'

const ProviderCard = memo(
  ({ value, isSelected, handleClick, imgAsAvatar, actions }) => {
    const { ID, NAME, TEMPLATE: { PLAIN = '{}' } } = value
    const { image = DEFAULT_IMAGE } = JSON.parse(PLAIN)

    const onError = evt => { evt.target.src = DEFAULT_IMAGE }

    return (
      <SelectCard
        title={`${ID} - ${NAME}`}
        isSelected={isSelected}
        handleClick={handleClick}
        actions={actions}
        {...(imgAsAvatar
          ? {
            icon: <Avatar
              src={image ?? DEFAULT_IMAGE}
              variant="rounded"
              style={{ width: 100, height: 80 }}
              imgProps={{ onError }}
            />
          }
          : { mediaProps: { component: 'img', image, onError } }
        )}
      />
    )
  }
)

ProviderCard.propTypes = {
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
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  imgAsAvatar: PropTypes.bool,
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
  isSelected: undefined,
  handleClick: undefined,
  imgAsAvatar: false,
  actions: undefined
}

ProviderCard.displayName = 'ProviderCard'

export default ProviderCard
