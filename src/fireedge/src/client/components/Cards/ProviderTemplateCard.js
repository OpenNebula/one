import React, { memo } from 'react'
import PropTypes from 'prop-types'

import FileIcon from '@material-ui/icons/Description'
import SelectCard from 'client/components/Cards/SelectCard'

const ProviderTemplateCard = memo(
  ({ value, handleClick }) => {
    const { name } = value

    return (
      <SelectCard
        title={name}
        handleClick={handleClick}
        icon={<FileIcon />}
      />
    )
  }
)

ProviderTemplateCard.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  handleClick: PropTypes.func
}

ProviderTemplateCard.defaultProps = {
  value: {},
  handleClick: undefined
}

ProviderTemplateCard.displayName = 'ProviderTemplateCard'

export default ProviderTemplateCard
