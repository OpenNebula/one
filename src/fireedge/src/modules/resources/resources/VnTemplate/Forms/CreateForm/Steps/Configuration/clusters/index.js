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
import { Server as ClusterIcon } from 'iconoir-react'

import { FormWithSchema } from '@ComponentsV2Module'

import {
  FIELDS,
  TAB_ID,
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/clusters/schema'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import { T } from '@ConstantsModule'

import PropTypes from 'prop-types'

import { isRestrictedAttributes } from '@UtilsModule'

const ClustersContent = ({ oneConfig, adminGroup }) => {
  const readOnly =
    !adminGroup &&
    isRestrictedAttributes(
      'CLUSTER',
      undefined,
      oneConfig?.VNET_RESTRICTED_ATTR
    )

  return <FormWithSchema id={EXTRA_ID} cy={TAB_ID} fields={FIELDS(readOnly)} />
}

ClustersContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {object} */
const TAB = {
  id: 'clusters',
  name: T.Clusters,
  icon: ClusterIcon,
  Content: ClustersContent,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
