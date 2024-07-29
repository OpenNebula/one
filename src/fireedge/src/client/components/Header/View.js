/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, memo, ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Button } from '@mui/material'
import {
  ViewGrid as ViewIcon,
  VerifiedBadge as SelectIcon,
} from 'iconoir-react'

import { useAuthApi, useViews } from 'client/features/Auth'
import Search from 'client/components/Search'
import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const ButtonView = memo(
  ({ view, handleClick }) => {
    const { changeView } = useAuthApi()
    const { view: currentView } = useViews()
    const isCurrentView = currentView === view

    return (
      <Button
        fullWidth
        color="debug"
        variant="outlined"
        data-cy={`view-${view}`}
        onClick={() => {
          view && !isCurrentView && changeView(view)
          handleClick()
        }}
        sx={{
          color: (theme) => theme.palette.text.primary,
          justifyContent: 'start',
          '& svg:first-of-type': { my: 0, mx: 2 },
        }}
      >
        {view}
        {isCurrentView && <SelectIcon />}
      </Button>
    )
  },
  (prev, next) => prev.view === next.view
)

ButtonView.propTypes = {
  view: PropTypes.string.isRequired,
  handleClick: PropTypes.func,
}

ButtonView.displayName = 'ButtonView'

/**
 * Menu to select the view that
 * will be used to filter the resources.
 *
 * These views are defined in yaml config.
 *
 * @returns {ReactElement} Returns interface views list
 */
const View = () => {
  const { view: currentView, views = {} } = useViews()
  const viewNames = useMemo(() => Object.keys(views), [currentView])

  return (
    <HeaderPopover
      id="view-list"
      icon={<ViewIcon />}
      tooltip={<Translate word={T.SwitchView} />}
      buttonProps={{ 'data-cy': 'header-view-button' }}
      headerTitle={<Translate word={T.SwitchView} />}
    >
      {({ handleClose }) => (
        <Search
          list={viewNames}
          maxResults={5}
          renderResult={(view) => (
            <ButtonView
              key={`view-${view}`}
              view={view}
              handleClick={handleClose}
            />
          )}
        />
      )}
    </HeaderPopover>
  )
}

export default View
