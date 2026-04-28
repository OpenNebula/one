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
import { boolean, object } from 'yup'

import { getValidationFromFields } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Alert } from '@mui/material'
import { Translate } from '@modules/components/HOC'
import PropTypes from 'prop-types'

const VisualAlert = ({ children }) => <Alert severity="error">{children}</Alert>

VisualAlert.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}
VisualAlert.displayName = 'VisualAlert'

const formFieldNames = {
  force: 'force',
}

const ALERT_TEXT_FIELD = {
  name: 'ALERT_TEXT',
  type: INPUT_TYPES.TYPOGRAPHY,
  grid: { md: 12 },
  text: (
    <VisualAlert>
      <Translate word={T.WarningDeleteOneKsCluster} />
    </VisualAlert>
  ),
  dependOf: [formFieldNames.force],
}

const FORCE = {
  name: formFieldNames.force,
  label: T.Force,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

export const FIELDS = [ALERT_TEXT_FIELD, FORCE]

export const SCHEMA = object(getValidationFromFields([FORCE]))
