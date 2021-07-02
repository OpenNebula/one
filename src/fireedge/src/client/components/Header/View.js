import * as React from 'react'

import { Button } from '@material-ui/core'
import { ViewGrid as ViewIcon, VerifiedBadge as SelectIcon } from 'iconoir-react'

import { useAuth, useAuthApi } from 'client/features/Auth'
import Search from 'client/components/Search'

import HeaderPopover from 'client/components/Header/Popover'
import headerStyles from 'client/components/Header/styles'

const View = () => {
  const classes = headerStyles()
  const { view, views } = useAuth()
  const { changeView } = useAuthApi()

  const handleChangeView = newView => {
    newView && newView !== view && changeView(newView)
  }

  const renderResult = (viewName, handleClose) => (
    <Button
      key={`view-${viewName}`}
      fullWidth
      className={classes.groupButton}
      onClick={() => {
        handleChangeView(viewName)
        handleClose()
      }}
    >
      {viewName}
      {viewName === view && <SelectIcon size='1em' />}
    </Button>
  )

  const viewNames = React.useMemo(() => Object.keys(views), [view])

  return (
    <HeaderPopover
      id='view-list'
      icon={<ViewIcon />}
      buttonProps={{ 'data-cy': 'header-view-button', variant: 'outlined' }}
      headerTitle='Switch view'
    >
      {({ handleClose }) => (
        <Search
          list={viewNames}
          maxResults={5}
          renderResult={item => renderResult(item, handleClose)}
        />
      )}
    </HeaderPopover>
  )
}

export default View
