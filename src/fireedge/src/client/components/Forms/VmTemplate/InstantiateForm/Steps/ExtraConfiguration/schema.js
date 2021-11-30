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
import { ObjectSchema } from 'yup'

// get schemas from VmTemplate/CreateForm
import { SCHEMA as CREATE_EXTRA_SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { HYPERVISORS } from 'client/constants'

/**
 * @param {HYPERVISORS} hypervisor - VM hypervisor
 * @returns {ObjectSchema} Extra configuration schema
 */
export const SCHEMA = (hypervisor) =>
  CREATE_EXTRA_SCHEMA(hypervisor).noUnknown(false)
