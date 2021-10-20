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
/* eslint-disable jsdoc/require-jsdoc */
import { string } from 'yup'

import { T, INPUT_TYPES } from 'client/constants'

const HOST_REQ_FIELD = {
  name: 'SCHED_REQUIREMENTS',
  label: T.HostReqExpression,
  tooltip: T.HostReqExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

const HOST_RANK_FIELD = {
  name: 'SCHED_RANK',
  label: T.HostPolicyExpression,
  tooltip: T.HostPolicyExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

const DS_REQ_FIELD = {
  name: 'DS_SCHED_REQUIREMENTS',
  label: T.DatastoreReqExpression,
  tooltip: T.DatastoreReqExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

const DS_RANK_FIELD = {
  name: 'DS_SCHED_RANK',
  label: T.DatastorePolicyExpression,
  tooltip: T.DatastorePolicyExpressionConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired()
}

export const PLACEMENT_HOST_FIELDS = [HOST_REQ_FIELD, HOST_RANK_FIELD]

export const PLACEMENT_DS_FIELDS = [DS_REQ_FIELD, DS_RANK_FIELD]

export const PLACEMENT_FIELDS = [PLACEMENT_HOST_FIELDS, PLACEMENT_DS_FIELDS]
