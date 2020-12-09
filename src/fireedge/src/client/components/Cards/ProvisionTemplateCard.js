import React, { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import SelectCard from 'client/components/Cards/SelectCard'
import { isExternalURL } from 'client/utils'
import { IMAGES_URL } from 'client/constants'

const ProvisionTemplateCard = memo(
  ({ value, title, isSelected, handleClick }) => {
    const { plain: { image } = {} } = value

    const imgSource = useMemo(() =>
      isExternalURL(image) ? image : `${IMAGES_URL}/${image}`
    , [image])

    return (
      <SelectCard
        stylesProps={{ minHeight: 80 }}
        isSelected={isSelected}
        handleClick={handleClick}
        title={title}
        mediaProps={image && {
          component: 'img',
          image: imgSource
        }}
      />
    )
  }, (prev, next) => prev.isSelected === next.isSelected
)

ProvisionTemplateCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired,
    plain: PropTypes.shape({
      image: PropTypes.string
    })
  }),
  title: PropTypes.string,
  isProvider: PropTypes.bool,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

ProvisionTemplateCard.defaultProps = {
  value: {},
  title: undefined,
  isProvider: undefined,
  isSelected: undefined,
  handleClick: undefined
}

ProvisionTemplateCard.displayName = 'ProvisionTemplateCard'

export default ProvisionTemplateCard
