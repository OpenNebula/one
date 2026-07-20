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

import { forwardRef, useMemo, useState, Component } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  ClickAwayListener,
  Divider,
  Paper,
  Popper,
  Typography,
} from '@mui/material'
import { NavArrowDown } from 'iconoir-react'

import { useGeneral, useGeneralApi, ZoneAPI } from '@FeaturesModule'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { STATES, T } from '@ConstantsModule'
import { getZoneState } from '@ModelsModule'
import { isSameId } from '@UtilsModule'
import { getStyles } from '@modules/componentsv2/primitives/Header/Default/slots/zoneDropdown/styles'
import { Tag } from '@modules/componentsv2/primitives/Tags/Default'
import { useTranslation } from '@ProvidersModule'

const ZoneStatusDot = ({ state }) => (
  <span
    aria-hidden="true"
    className={`status-dot ${
      state?.name === STATES.ENABLED ? 'enabled' : 'disabled'
    }`}
  />
)

ZoneStatusDot.propTypes = {
  state: PropTypes.object,
}

const ZoneOption = ({ disabled, isCurrent, onClick, state, zone }) => {
  const { translate } = useTranslation()
  const { NAME, ID } = zone

  return (
    <button
      className={`zone-option ${isCurrent ? 'selected' : ''}`}
      data-cy={`header-zone-${ID}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <ZoneStatusDot state={state} />

      <span className="copy">
        <span className="name">{NAME}</span>
      </span>

      {isCurrent && <Tag title={translate(T.Current)} />}
    </button>
  )
}

ZoneOption.propTypes = {
  disabled: PropTypes.bool,
  isCurrent: PropTypes.bool,
  onClick: PropTypes.func,
  state: PropTypes.object,
  zone: PropTypes.object,
}

/**
 * ZoneDropdownSlot component.
 *
 * @param {object} root0 - Params
 * @param {Array} root0.zones - Optional zone override for tests/custom slots
 * @returns {Component} - Zone switcher slot
 */
export const ZoneDropdownSlot = forwardRef(({ zones: zonesProp }, ref) => {
  const { translate } = useTranslation()
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { data: fetchedZones = [], isLoading } = ZoneAPI.useGetZonesQuery()
  const { zone: selectedZone } = useGeneral()
  const { changeZone } = useGeneralApi()

  const zones = zonesProp ?? fetchedZones

  const currentZone = useMemo(
    () => zones.find(({ ID }) => isSameId(ID, selectedZone)) ?? zones[0],
    [selectedZone, zones]
  )

  const currentState = getZoneState(currentZone)
  const currentName = currentZone?.NAME ?? translate(T.Zones)

  const handleClose = () => setOpen(false)

  const handleToggle = (event) => {
    setAnchorEl(event.currentTarget)
    setOpen((isOpen) => !isOpen)
  }

  const handleSelect = (zoneId) => () => {
    if (!zoneId) return

    changeZone(parseInt(zoneId, 10))
  }

  return (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      <Button
        className={`header-zone-button${open ? ' is-open' : ''}`}
        data-cy="header-zone-button"
        endIcon={<NavArrowDown />}
        onClick={handleToggle}
        startIcon={<ZoneStatusDot state={currentState} />}
        type="secondary"
      >
        <span className="label">{currentName}</span>
      </Button>

      <Popper
        anchorEl={anchorEl}
        disablePortal
        open={open}
        placement="bottom-end"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper id="header-zone-menu" className="header-zone-menu">
            <Typography className="zone-title">
              {translate(T.CurrentZone)}
            </Typography>

            <Divider className="divider" />

            <Box className="zone-options">
              {zones.length ? (
                zones.map((zone) => {
                  const isCurrent = isSameId(zone?.ID, selectedZone)

                  return (
                    <ZoneOption
                      disabled={isLoading}
                      isCurrent={isCurrent}
                      key={`header-zone-${zone?.ID}`}
                      onClick={handleSelect(zone?.ID)}
                      state={getZoneState(zone)}
                      zone={zone}
                    />
                  )
                })
              ) : (
                <Typography className="zone-empty">
                  {translate(T.LoadingZones)}
                </Typography>
              )}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  )
})

ZoneDropdownSlot.propTypes = {
  zones: PropTypes.array,
}

ZoneDropdownSlot.displayName = 'ZoneDropdownSlot'
