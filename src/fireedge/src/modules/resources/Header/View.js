/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, ReactElement } from 'react'

import { MenuItem, Select } from '@mui/material'
import { NavArrowDown as ViewIcon } from 'iconoir-react'

import { useAuthApi, useViews } from '@FeaturesModule'
import { T } from '@ConstantsModule'

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
  const { changeView } = useAuthApi()
  const viewNames = useMemo(() => Object.keys(views), [currentView])

  return (
    <Select
      data-cy={'header-view-button'}
      labelId="view-select-label"
      id="view-select"
      value={currentView || viewNames?.[0] || ''}
      IconComponent={ViewIcon}
      label={T.SwitchView}
      variant="standard"
      disableUnderline
      onChange={(event) => {
        const view = event.target.value
        const isCurrentView = view === currentView

        view && !isCurrentView && changeView(view)
      }}
      sx={{
        display: 'flex',
        width: '250px',
        alignItems: 'center',
        minHeight: 'unset',
        height: '100%',
        gap: (theme) => `${theme.scale[200]}px`,
        padding: (theme) =>
          `${theme.scale[150]}px ${theme.scale[200]}px ${theme.scale[150]}px ${theme.scale[300]}px`,
        borderRadius: (theme) => `${theme.borderRadius.xlg}px`,
        borderTop: (theme) =>
          `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        borderRight: (theme) =>
          `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        borderLeft: (theme) =>
          `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        borderBottom: (theme) =>
          `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        backgroundColor: 'surface.primary',
        '& .MuiSelect-icon': {
          color: 'icon.action',
          alignSelf: 'center',
          top: '50%',
          transform: 'translateY(-50%)',
        },
      }}
    >
      {viewNames.map((view) => (
        <MenuItem key={view} value={view}>
          {view}
        </MenuItem>
      ))}
    </Select>
  )
}

export default View
