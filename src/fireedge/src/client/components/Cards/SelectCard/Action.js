import React, { memo } from 'react'
import PropTypes from 'prop-types'

import useFetch from 'client/hooks/useFetch'
import { SubmitButton } from 'client/components/FormControl'

const Action = memo(({ handleClick, icon, cy, ...props }) => {
  const { fetchRequest, data, loading } = useFetch(
    () => Promise.resolve(handleClick())
  )

  return (
    <SubmitButton
      data-cy={cy}
      icon
      isSubmitting={loading}
      label={icon}
      onClick={fetchRequest}
      disabled={!!data}
      {...props}
    />
  )
})

Action.propTypes = {
  handleClick: PropTypes.func.isRequired,
  icon: PropTypes.node.isRequired,
  cy: PropTypes.string
}

Action.defaultProps = {
  handleClick: () => undefined,
  icon: undefined,
  cy: 'action-card'
}

Action.displayName = 'ActionCard'

export default Action
