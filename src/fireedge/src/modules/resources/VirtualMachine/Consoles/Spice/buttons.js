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
import { Box, useTheme } from '@mui/material'
import { Refresh } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

import { SkeletonLoading, ToggleGroup } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

const ICON_SIZE = '16px'
const LOADING_SIZE = 20

const getIconProps = () => ({
  width: ICON_SIZE,
  height: ICON_SIZE,
})

const useStyles = (theme) => ({
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: String(theme?.scale?.[500] ?? 16) + 'px',
  },
  actionGroup: {
    flex: '0 1 auto',
    alignItems: 'stretch',
  },
})

/**
 * @param {object} props - Component props
 * @param {string} props.id - SPICE session identifier
 * @param {Function} props.handleReconnect - Reconnect callback
 * @param {boolean} props.isLoading - Session loading state
 * @returns {ReactElement} SPICE console action buttons
 */
const SpiceActionButtons = ({ id, handleReconnect, isLoading = false }) => {
  const { translate } = useTranslation()
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  const options = useMemo(
    () => [
      [
        {
          startIcon: isLoading ? (
            <SkeletonLoading
              loading
              variant="circular"
              width={LOADING_SIZE}
              height={LOADING_SIZE}
            />
          ) : (
            <Refresh {...getIconProps()} />
          ),
          onClick: handleReconnect,
          value: 'reconnect',
          tooltip: translate(T.Reconnect),
          isDisabled: isLoading || !handleReconnect,
          'data-cy': `${id}-reconnect-button`,
        },
      ],
    ],
    [handleReconnect, id, isLoading, translate]
  )

  return (
    <Box sx={classes.actionsContainer}>
      <ToggleGroup
        size="medium"
        isSelectable={false}
        options={options}
        sx={classes.actionGroup}
      />
    </Box>
  )
}

SpiceActionButtons.propTypes = {
  id: PropTypes.string.isRequired,
  handleReconnect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
}

SpiceActionButtons.displayName = 'SpiceActionButtons'

export { SpiceActionButtons }
