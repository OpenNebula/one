import React, { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as Types from 'client/types/provision'

import ProvidersIcon from '@material-ui/icons/Public'
import SelectCard from 'client/components/Cards/SelectCard'

import Image from 'client/components/Image'
import { isExternalURL } from 'client/utils'
import { PROVIDER_IMAGES_URL, PROVISION_IMAGES_URL } from 'client/constants'

const ProvisionTemplateCard = memo(
  ({ value, isProvider, isSelected, isValid, handleClick }) => {
    const { description, name, plain = {} } = value
    const { image = '' } = isProvider ? plain : value

    const IMAGES_URL = isProvider ? PROVIDER_IMAGES_URL : PROVISION_IMAGES_URL

    const isExternalImage = useMemo(() => isExternalURL(image), [image])

    const imageUrl = useMemo(
      () => isExternalImage ? image : `${IMAGES_URL}/${image}`,
      [isExternalImage]
    )

    return (
      <SelectCard
        dataCy={isProvider ? 'provider' : 'provision'}
        disableFilterImage={isExternalImage}
        handleClick={handleClick}
        icon={<ProvidersIcon />}
        cardActionAreaProps={{ disabled: !isValid }}
        isSelected={isSelected}
        mediaProps={{
          component: 'div',
          children: <Image src={imageUrl} withSources={image && !isExternalImage} />
        }}
        subheader={description}
        title={name}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

ProvisionTemplateCard.propTypes = {
  handleClick: PropTypes.func,
  isProvider: PropTypes.bool,
  isSelected: PropTypes.bool,
  isValid: PropTypes.bool,
  value: PropTypes.oneOfType([
    Types.ProviderTemplate,
    Types.ProvisionTemplate
  ])
}

ProvisionTemplateCard.defaultProps = {
  handleClick: undefined,
  isProvider: undefined,
  isSelected: false,
  isValid: true,
  value: { name: '', description: '' }
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
