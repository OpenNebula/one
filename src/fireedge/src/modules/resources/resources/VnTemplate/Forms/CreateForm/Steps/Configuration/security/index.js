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
import { HistoricShield as SecurityIcon } from 'iconoir-react'
import PropTypes from 'prop-types'

import {
  FIELDS,
  TAB_ID,
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/security/schema'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import { alertWrapperStyles } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/styles'
import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { isRestrictedAttributes } from '@UtilsModule'

const SecurityContent = ({ oneConfig, adminGroup }) => {
  const readOnly =
    !adminGroup &&
    isRestrictedAttributes(TAB_ID, undefined, oneConfig?.VNET_RESTRICTED_ATTR)

  return (
    <>
      <Box sx={alertWrapperStyles}>
        <AlertNotification
          className="vn-template-alert"
          type="primary"
          status="information"
          description={T.MessageAddSecGroupDefault}
          isDismissible={false}
        />
      </Box>
      <FormWithSchema id={EXTRA_ID} cy={TAB_ID} fields={FIELDS(readOnly)} />
    </>
  )
}

SecurityContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {object} */
const TAB = {
  id: 'security',
  name: T.Security,
  icon: SecurityIcon,
  Content: SecurityContent,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
