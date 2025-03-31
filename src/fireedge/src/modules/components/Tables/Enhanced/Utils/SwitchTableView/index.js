/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'

import { useGeneral, useGeneralApi } from '@FeaturesModule'
import { Stack, useTheme, Button } from '@mui/material'
import SwitchTableViewStyles from '@modules/components/Tables/Enhanced/Utils/SwitchTableView/styles'

import { Tr } from '@modules/components/HOC'
import { T, TABLE_VIEW_MODE } from '@ConstantsModule'
import clsx from 'clsx'
import { Check } from 'iconoir-react'

/**
 * Button to change between card and list views.
 *
 * @returns {ReactElement} The switch table view button
 */
const SwitchTableView = () => {
  // Get theme and classes
  const theme = useTheme()
  const classes = useMemo(() => SwitchTableViewStyles(theme), [theme])

  // Get table view mode
  const { setTableViewMode } = useGeneralApi()
  const { tableViewMode } = useGeneral()

  return (
    <Stack direction="row" spacing={0}>
      <Button
        className={clsx(classes.button, classes.leftButton, {
          [classes.selected]: tableViewMode === TABLE_VIEW_MODE.CARD,
        })}
        onClick={() => setTableViewMode(TABLE_VIEW_MODE.CARD)}
      >
        <Stack direction="row" className={classes.buttonContent}>
          {tableViewMode === TABLE_VIEW_MODE.CARD && (
            <Check className={classes.logo} />
          )}
          <span className={classes.buttonText}>{Tr(T.CardView)}</span>
        </Stack>
      </Button>
      <Button
        className={clsx(classes.button, classes.rightButton, {
          [classes.selected]: tableViewMode === TABLE_VIEW_MODE.LIST,
        })}
        onClick={() => setTableViewMode(TABLE_VIEW_MODE.LIST)}
      >
        <Stack direction="row" className={classes.buttonContent}>
          {tableViewMode === TABLE_VIEW_MODE.LIST && (
            <Check className={classes.logo} />
          )}
          <span className={classes.buttonText}>{Tr(T.ListView)}</span>
        </Stack>
      </Button>
    </Stack>
  )
}

SwitchTableView.displayName = 'SwitchTableView'

export default SwitchTableView
