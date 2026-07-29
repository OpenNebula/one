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
import { Box } from '@mui/material'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import { alertWrapperStyles } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/styles'
import {
  FIELDS,
  SECTIONS,
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/qos/schema'
import { DataTransferBoth as QoSIcon } from 'iconoir-react'
import PropTypes from 'prop-types'

import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'

const QoSContent = ({ oneConfig, adminGroup }) => (
  <>
    <Box sx={alertWrapperStyles}>
      <AlertNotification
        className="vn-template-alert"
        type="primary"
        status="information"
        description={T.MessageQos}
        isDismissible={false}
      />
    </Box>
    {SECTIONS(oneConfig, adminGroup).map(({ id, ...section }) => (
      <FormWithSchema
        key={id}
        id={EXTRA_ID}
        cy={`${EXTRA_ID}-${id}`}
        {...section}
      />
    ))}
  </>
)

QoSContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {object} */
const TAB = {
  id: 'qos',
  name: T.QoS,
  icon: QoSIcon,
  Content: QoSContent,
  getError: (error) => FIELDS().some(({ name }) => error?.[name]),
}

export default TAB
