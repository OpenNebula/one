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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Box, Paper, Typography } from '@mui/material'

import Form from 'client/containers/Support/Authentication/Form'
import * as FORMS from 'client/containers/Support/Authentication/schema'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Section to login in Support portal.
 *
 * @param {object} props - Form
 * @param {function()} props.onSubmit - Submit action
 * @param {string} props.error - Error message to show
 * @param {boolean} props.isLoading - Indicates if the request is loading
 * @returns {ReactElement} Settings configuration UI
 */
const LoginSupport = ({ onSubmit, error, isLoading }) => (
  <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
    <Box mt="0.5rem" p="1rem">
      <Typography variant="underline">
        <Translate word={T.CommercialSupport} />
      </Typography>

      <Form
        onSubmit={onSubmit}
        resolver={FORMS.FORM_USER_SCHEMA}
        fields={FORMS.FORM_USER_FIELDS}
        error={error}
        isLoading={isLoading}
      />
    </Box>
  </Paper>
)

LoginSupport.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  isLoading: PropTypes.bool,
}

LoginSupport.defaultProps = {
  onSubmit: () => undefined,
  error: undefined,
  isLoading: false,
}

export default LoginSupport
