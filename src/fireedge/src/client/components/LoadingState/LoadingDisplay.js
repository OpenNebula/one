/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Component, useEffect } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { InfoEmpty, CloudError } from 'iconoir-react'
import { useGeneralApi } from 'client/features/General'

/**
 * Renders a display message based on the presence of an error.
 *
 * @param {object} props - The properties for the component.
 * @param {boolean} props.error - Indicates if there was an error fetching data.
 * @param {boolean} props.isLoading - Indicates if data is still being fetched.
 * @param {boolean} props.isEmpty - Flag set when transformed data was empty.
 * @returns {Component} The rendered loading display component.
 */
export const LoadingDisplay = ({ isLoading, error, isEmpty }) => {
  const { enqueueError } = useGeneralApi()

  useEffect(() => {
    if (error && error.length > 0) {
      enqueueError(error)
    }
  }, [error])

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <CircularProgress />
      </Box>
    )
  }

  let displayMessage = 'No data available'
  let DisplayIcon = InfoEmpty

  if (error && error.length > 0) {
    displayMessage = error
    DisplayIcon = CloudError
  } else if (isEmpty) {
    displayMessage = 'No data available'
    DisplayIcon = InfoEmpty
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      borderRadius={4}
      boxShadow={2}
      padding={3}
    >
      <DisplayIcon style={{ fontSize: 40 }} />
      <Typography variant="h6" color="textSecondary" marginTop={2}>
        {displayMessage}
      </Typography>
    </Box>
  )
}

LoadingDisplay.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  isEmpty: PropTypes.bool,
}

LoadingDisplay.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  isEmpty: PropTypes.bool,
}
