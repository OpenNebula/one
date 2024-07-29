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
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import { Component, useState } from 'react'
import UserInputDialog from './UserInputDialog'
import { Typography, Box, useTheme, Grid } from '@mui/material'
import { WarningCircledOutline as MandatoryIcon } from 'iconoir-react'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * @param {object} root0 - Params
 * @param {object} root0.userInput - Node props
 *@returns {Component} - Subnode
 */
const SubNode = ({ userInput }) => {
  const { description, mandatory, name } = userInput
  const theme = useTheme()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { getValues } = useFormContext()
  const userInputValue =
    userInput.type === 'boolean'
      ? getValues(`user_inputs.${userInput.name}`) === 'YES'
        ? Tr(T.Yes)
        : Tr(T.No)
      : getValues(`user_inputs.${userInput.name}`) || undefined

  const toggleDialog = () => setDialogOpen(!dialogOpen)

  const handleSave = () => {
    toggleDialog()
  }

  return (
    <Box
      height={'100px'}
      width={'100%'}
      onClick={toggleDialog}
      mb={2}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        position: 'relative',
        '&:hover': {
          backgroundColor: theme?.palette?.action.hover,
        },
      }}
    >
      <Grid container spacing={1} padding={1}>
        {description && (
          <Grid item xs={12}>
            <Typography noWrap variant="subtitle1">
              {description}
            </Typography>
          </Grid>
        )}

        {userInputValue && (
          <Grid item xs={12}>
            <Typography noWrap variant="body1">
              {`${Tr(T.Value)}: ${userInputValue}`}
            </Typography>
          </Grid>
        )}

        {name && (
          <Grid item xs={12}>
            <Typography noWrap variant="body2">
              {name}
            </Typography>
          </Grid>
        )}
      </Grid>

      {mandatory && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            p: 1,
          }}
        >
          <MandatoryIcon />
        </Box>
      )}

      <UserInputDialog
        open={dialogOpen}
        onClose={toggleDialog}
        userInput={userInput}
        onSave={handleSave}
      />
    </Box>
  )
}

SubNode.propTypes = {
  userInput: PropTypes.object,
}

export default SubNode
