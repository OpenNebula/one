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
import {
  CheckCircle,
  Group as GroupIcon,
  NavArrowDown,
  Search as SearchIcon,
  UserStar,
} from 'iconoir-react'

import { AuthAPI, useAuth, useFunctionalityApi } from '@FeaturesModule'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { TextField } from '@modules/componentsv2/primitives/TextField'
import { FILTER_POOL, T } from '@ConstantsModule'
import { isSameId, toLowerCaseString } from '@UtilsModule'
import { getStyles } from '@modules/componentsv2/primitives/Header/Default/slots/userGroupDropdown/styles'
import { useTranslation } from '@ProvidersModule'

const {
  ALL_RESOURCES,
  PRIMARY_GROUP_RESOURCES,
  USER_GROUPS_RESOURCES,
  USER_RESOURCES,
} = FILTER_POOL

const getSpecialOptions = (translate) => [
  {
    ID: ALL_RESOURCES,
    NAME: translate(T.ShowAll),
  },
  {
    ID: USER_GROUPS_RESOURCES,
    NAME: translate(T.ShowBelongingUserAndGroups),
  },
  {
    ID: USER_RESOURCES,
    NAME: translate(T.ShowBelongingUser),
  },
]

const optionMatches = (option, query) =>
  !query || toLowerCaseString(option?.NAME).includes(toLowerCaseString(query))

const GroupOption = ({ dataCy, disabled, icon, isSelected, name, onClick }) => (
  <button
    className={`usergroup-option ${isSelected ? 'selected' : ''}`}
    data-cy={dataCy}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {icon && <span className="icon">{icon}</span>}
    <span className="label">{name}</span>
    <span className={`check ${isSelected ? 'selected' : ''}`}>
      <CheckCircle />
    </span>
  </button>
)

GroupOption.propTypes = {
  dataCy: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  isSelected: PropTypes.bool,
  name: PropTypes.string,
  onClick: PropTypes.func,
}

/**
 * UserGroupDropdownSlot component.
 *
 * @param {object} root0 - Params
 * @param {Array} root0.groups - Optional group override for tests/custom slots
 * @returns {Component} - User group switcher slot
 */
export const UserGroupDropdownSlot = forwardRef(
  ({ groups: groupsProp }, ref) => {
    const { translate } = useTranslation()
    const { setSelectedItems } = useFunctionalityApi()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [anchorEl, setAnchorEl] = useState(null)
    const [changeGroup, { isLoading }] = AuthAPI.useChangeAuthGroupMutation()
    const { filterPool, groups: authGroups = [], user } = useAuth()

    const specialOptions = useMemo(
      () => getSpecialOptions(translate),
      [translate]
    )
    const groups = groupsProp ?? authGroups
    const selectedId =
      filterPool === PRIMARY_GROUP_RESOURCES || !filterPool
        ? user?.GID
        : filterPool

    const selectedOption = useMemo(
      () =>
        specialOptions.find(({ ID }) => isSameId(ID, selectedId)) ??
        groups.find(({ ID }) => isSameId(ID, user?.GID)),
      [groups, selectedId, specialOptions, user?.GID]
    )

    const filteredSpecialOptions = useMemo(
      () => specialOptions.filter((option) => optionMatches(option, query)),
      [query, specialOptions]
    )

    const filteredGroups = useMemo(
      () =>
        groups
          .filter(Boolean)
          .filter((group) => optionMatches(group, query))
          .sort((a, b) =>
            isSameId(a?.ID, user?.GID) ? -1 : isSameId(b?.ID, user?.GID) ? 1 : 0
          ),
      [groups, query, user?.GID]
    )

    const handleClose = () => {
      setOpen(false)
      setQuery('')
    }

    const handleToggle = (event) => {
      setAnchorEl(event.currentTarget)
      setOpen((isOpen) => !isOpen)
    }

    const handleSelect = (groupId) => async () => {
      if (!groupId) return
      await changeGroup({ group: groupId })
      setSelectedItems([])
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
          className={`header-usergroup-button${open ? ' is-open' : ''}`}
          data-cy="header-group-button"
          endIcon={<NavArrowDown />}
          isDisabled={isLoading}
          onClick={handleToggle}
          startIcon={<GroupIcon />}
          type="secondary"
        >
          <span className="label">
            {selectedOption?.NAME ?? translate(T.Groups)}
          </span>
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
            <Paper
              id="header-usergroup-menu"
              className="header-usergroup-menu"
              data-cy="header-group-menu"
            >
              <Typography className="title">
                {translate(T.SwitchGroup)}
              </Typography>

              <Box className="search-container">
                <Divider className="divider" />

                <TextField
                  key={open ? 'open' : 'closed'}
                  className="search"
                  initialValue=""
                  inputProps={{
                    'aria-label': translate(T.Search),
                  }}
                  onChange={setQuery}
                  placeholder={`${translate(T.Search)}...`}
                  startIcon={SearchIcon}
                />

                <Divider className="divider" />
              </Box>

              <Box className="usergroup-options">
                {filteredSpecialOptions.map(({ ID, NAME }) => (
                  <GroupOption
                    dataCy={`group-${ID}`}
                    disabled={isLoading}
                    isSelected={isSameId(ID, selectedId)}
                    key={`header-filter-${ID}`}
                    name={NAME}
                    onClick={handleSelect(ID)}
                  />
                ))}

                <Divider className="divider" />

                {!!filteredGroups.length && (
                  <Typography className="section">
                    {translate(T.Groups)}
                  </Typography>
                )}

                {filteredGroups.map(({ ID, NAME }) => (
                  <GroupOption
                    dataCy={`group-${ID}`}
                    disabled={isLoading}
                    icon={
                      isSameId(ID, user?.GID) ? <UserStar /> : <GroupIcon />
                    }
                    isSelected={
                      isSameId(ID, user?.GID) &&
                      (!filterPool || filterPool === PRIMARY_GROUP_RESOURCES)
                    }
                    key={`header-group-${ID}`}
                    name={NAME}
                    onClick={handleSelect(ID)}
                  />
                ))}

                {!filteredSpecialOptions.length && !filteredGroups.length && (
                  <Typography className="header-usergroup-empty">
                    {translate(T.NoDataAvailable)}
                  </Typography>
                )}
              </Box>
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Box>
    )
  }
)

UserGroupDropdownSlot.propTypes = {
  groups: PropTypes.array,
}

UserGroupDropdownSlot.displayName = 'UserGroupDropdownSlot'
