import * as React from 'react'
import PropTypes from 'prop-types'

import { CardContent } from '@material-ui/core'
import SelectCard from 'client/components/Cards/SelectCard'

const WidgetCard = React.memo(({ value }) => {
  const { title, widget, actions } = value

  return (
    <SelectCard
      actions={actions}
      cardActionsProps={{ style: { justifyContent: 'center' } }}
      title={title}
      cardHeaderProps={{
        titleTypographyProps: {
          variant: 'h4',
          style: { textAlign: 'center' }
        }
      }}
    >
      <CardContent>{widget}</CardContent>
    </SelectCard>
  )
})

WidgetCard.propTypes = {
  value: PropTypes.shape({
    icon: PropTypes.node,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    widget: PropTypes.node,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        handleClick: PropTypes.func.isRequired,
        icon: PropTypes.object.isRequired,
        cy: PropTypes.string
      })
    )
  })
}

WidgetCard.defaultProps = {
  value: {
    icon: undefined,
    title: undefined,
    subtitle: undefined,
    widget: undefined,
    actions: []
  }
}

WidgetCard.displayName = 'WidgetCard'

export default WidgetCard
