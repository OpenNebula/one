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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Stack, Typography, styled } from '@mui/material'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'

import { Translate } from 'client/components/HOC'

const ErrorTypo = styled(Typography)(({ theme }) => ({
  ...theme.typography.body1,
  paddingLeft: theme.spacing(1),
  overflowWrap: 'anywhere',
}))

const ErrorHelper = memo(({ label, children, ...rest }) => {
  const ensuredLabel = Array.isArray(label) && label[0]?.word ? label[0] : label

  const translateProps = ensuredLabel?.word
    ? { ...ensuredLabel }
    : { word: ensuredLabel }

  return (
    <Stack
      component="span"
      color="error.dark"
      direction="row"
      alignItems="center"
      {...rest}
    >
      <WarningIcon />
      <ErrorTypo component="span" data-cy="error-text">
        <Translate {...translateProps} />
        {children}
      </ErrorTypo>
    </Stack>
  )
})

ErrorHelper.propTypes = {
  children: PropTypes.any,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
    PropTypes.array,
    PropTypes.shape({
      word: PropTypes.string,
      values: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
        PropTypes.array,
      ]),
    }),
  ]),
}

ErrorHelper.displayName = 'ErrorHelper'

export default ErrorHelper
