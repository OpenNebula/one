import React, { memo, useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import ProviderIcon from '@material-ui/icons/Public'
import ProvisionIcon from '@material-ui/icons/Cloud'

import SelectCard from 'client/components/Cards/SelectCard'
import Action from 'client/components/Cards/SelectCard/Action'
import { isExternalURL } from 'client/utils'
import { IMAGES_URL, DEFAULT_IMAGE } from 'client/constants'

const ProvisionCard = memo(
  ({ value, isSelected, handleClick, isProvider, actions }) => {
    const [image, setImage] = useState(undefined)
    const { NAME, TEMPLATE: { PLAIN = '{}' } } = value

    useEffect(() => {
      try {
        const plain = JSON.parse(PLAIN)
        setImage(plain?.image ?? DEFAULT_IMAGE)
      } catch {
        setImage(DEFAULT_IMAGE)
        console.warn('Image in plain property is not valid')
      }
    }, [])

    const onError = evt => { evt.target.src = DEFAULT_IMAGE }

    const imgSource = useMemo(() =>
      isExternalURL(image) ? image : `${IMAGES_URL}/${image}`
    , [image])

    return (
      <SelectCard
        title={NAME}
        isSelected={isSelected}
        handleClick={handleClick}
        action={actions?.map(action => <Action key={action?.cy} {...action} />)}
        icon={isProvider ? <ProviderIcon /> : <ProvisionIcon />}
        mediaProps={{
          component: 'img',
          image: imgSource,
          onError
        }}
      />
    )
  }, (prev, next) => prev.isSelected === next.isSelected
)

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
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  isProvider: PropTypes.bool,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      cy: PropTypes.string
    })
  )
}

ProvisionCard.defaultProps = {
  value: {},
  isSelected: undefined,
  handleClick: undefined,
  isProvider: false,
  actions: undefined
}

ProvisionCard.displayName = 'ProvisionCard'

export default ProvisionCard
