import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Avatar } from '@material-ui/core'
import SelectCard from 'client/components/Cards/SelectCard'

const PROVIDER_IMAGE = '/client/assets/provider.png'
const PROVISION_IMAGE = '/client/assets/provision.jpg'

const ProvisionTemplateCard = memo(
  ({ value, isProvider, isSelected, handleClick }) => {
    const { name, plain: { image } = {} } = value
    const DEFAULT_IMG = isProvider ? PROVIDER_IMAGE : PROVISION_IMAGE

    return (
      <SelectCard
        stylesProps={{ minHeight: 80 }}
        title={name}
        isSelected={isSelected}
        handleClick={handleClick}
        icon={
          <Avatar
            src={image ?? DEFAULT_IMG}
            variant="rounded"
            style={{ width: 100, height: 80 }}
            imgProps={{
              onError: evt => {
                evt.target.src = DEFAULT_IMG
              }
            }}
          />
        }
      />
    )
  }
)

ProvisionTemplateCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired,
    plain: PropTypes.shape({
      image: PropTypes.string
    })
  }),
  isProvider: PropTypes.bool,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

ProvisionTemplateCard.defaultProps = {
  value: {},
  isProvider: undefined,
  isSelected: undefined,
  handleClick: undefined
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
