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
import { isValidElement, memo } from 'react'
import PropTypes from 'prop-types'
import { Stack, Typography, styled } from '@mui/material'
import { WarningCircle as WarningIcon } from 'iconoir-react'
import { Translate } from '@ProvidersModule'

const ErrorTypo = styled(Typography)(({ theme }) => ({
  ...theme.typography.body1,
  paddingLeft: theme.spacing(1),
  overflowWrap: 'anywhere',
}))

const getTranslateProps = (label) => {
  const ensuredLabel = Array.isArray(label) && label[0]?.word ? label[0] : label

  if (ensuredLabel?.word) return { ...ensuredLabel }

  return { word: ensuredLabel }
}

const renderLabel = (label) => {
  if (!label && label !== 0) return null
  if (isValidElement(label)) return label
  if (label?.message) return renderLabel(label.message)

  return <Translate {...getTranslateProps(label)} />
}

export const ErrorHelper = memo(({ label, children, sx, ...rest }) => (
  <Stack
    component="span"
    color="text.error"
    direction="row"
    alignItems="center"
    sx={[
      (theme) => ({ gap: `${theme.scale[100]}px` }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...rest}
  >
    <WarningIcon width="16px" height="16px" strokeWidth={1.6} />
    <ErrorTypo component="span" data-cy="error-text">
      {renderLabel(label)}
      {!!children && children}
    </ErrorTypo>
  </Stack>
))

ErrorHelper.propTypes = {
  children: PropTypes.any,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.func, PropTypes.array]),
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
