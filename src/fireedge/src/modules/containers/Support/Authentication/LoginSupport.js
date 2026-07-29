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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Box, Paper } from '@mui/material'
import { Text } from '@ComponentsV2Module'

import Form from '@modules/containers/Support/Authentication/Form'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

/**
 * Section to login in Support portal.
 *
 * @param {object} props - Form
 * @param {function()} props.onSubmit - Submit action
 * @param {string} props.error - Error message to show
 * @param {boolean} props.isLoading - Indicates if the request is loading
 * @returns {ReactElement} Settings configuration UI
 */
export const LoginSupport = ({ onSubmit, error, isLoading }) => (
  <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
    <Box mt="0.5rem" p="1rem">
      <Text
        variant={TEXT_VARIANTS.BODY_LARGE}
        weight={TEXT_WEIGHTS.SEMIBOLD}
        value={T.CommercialSupport}
      />

      <Form onSubmit={onSubmit} error={error} isLoading={isLoading} />
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
