/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import * as React from 'react'

import { Button } from '@material-ui/core'
import { ViewGrid as ViewIcon, VerifiedBadge as SelectIcon } from 'iconoir-react'

import { useAuth, useAuthApi } from 'client/features/Auth'
import Search from 'client/components/Search'

import HeaderPopover from 'client/components/Header/Popover'
import headerStyles from 'client/components/Header/styles'

/**
 *
 */
const View = () => {
  const classes = headerStyles()
  const { view, views = {} } = useAuth()
  const { changeView } = useAuthApi()

  const handleChangeView = newView => {
    newView && newView !== view && changeView(newView)
  }

  /**
   * @param viewName
   * @param handleClose
   */
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
