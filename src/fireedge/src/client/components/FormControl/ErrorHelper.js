/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import { oneOfType, string, node } from 'prop-types'

import { Stack, Typography, styled } from '@mui/material'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'

import { Tr, labelCanBeTranslated } from 'client/components/HOC'

const ErrorTypo = styled(Typography)(({ theme }) => ({
  ...theme.typography.body1,
  paddingLeft: theme.spacing(1),
  overflowWrap: 'anywhere'
}))

const ErrorHelper = memo(({ label, ...rest }) => (
  <Stack component='span' color='error.dark' direction='row' alignItems='center' {...rest}>
    <WarningIcon />
    <ErrorTypo component='span' data-cy='error-text'>
      {labelCanBeTranslated(label) ? Tr(label) : label}
    </ErrorTypo>
  </Stack>
))

ErrorHelper.propTypes = {
  label: oneOfType([string, node])
}

ErrorHelper.displayName = 'ErrorHelper'

export default ErrorHelper
