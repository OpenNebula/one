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
import React from 'react'
import { Box, Typography } from '@mui/material'
import { InfoEmpty, CloudError } from 'iconoir-react'

/**
 * Renders a display message based on the presence of an error.
 *
 * @param {object} props - The properties for the component.
 * @param {boolean} props.error - Indicates if there was an error fetching data.
 * @returns {React.Component} The rendered loading display component.
 */
export const LoadingDisplay = ({ error }) => {
  const displayMessage = error ? 'Error fetching data' : 'No data available'
  const DisplayIcon = error ? CloudError : InfoEmpty

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="500px"
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
  error: PropTypes.bool,
}
