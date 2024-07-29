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
import { Component, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { Trash as ClearIcon } from 'iconoir-react'
import SubNode from './SubNode'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * @param {object} root0 - Params
 * @param {Array} root0.userInputs - Array of user inputs
 * @returns {Component} - Node menu
 */
const NodeMenu = ({ userInputs }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showMandatoryOnly, setShowMandatoryOnly] = useState(false)

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  const handleShowMandatoryToggle = useCallback((event) => {
    setShowMandatoryOnly(event.target.checked)
  }, [])

  const filteredUserInputs = userInputs.filter((userInput) => {
    const matchesSearchTerm = userInput.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const isMandatory = !showMandatoryOnly || userInput.mandatory

    return matchesSearchTerm && isMandatory
  })

  return (
    <Box width={'100%'} height={'100%'} key={'NodeMenu'}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={`${Tr(T.Search)}...`}
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ paddingBottom: '6px' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={clearSearch}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={showMandatoryOnly}
              onChange={handleShowMandatoryToggle}
              sx={{
                marginBottom: '6px',
              }}
            />
          }
          label={Tr(T.VirtualRouterUserInputsShowMandatory)}
        />
      </FormGroup>
      {filteredUserInputs.map((userInput, index) => (
        <SubNode key={index} userInput={userInput} />
      ))}
    </Box>
  )
}

NodeMenu.propTypes = {
  userInputs: PropTypes.array,
}

NodeMenu.displayName = 'NodeMenu'

export default NodeMenu
