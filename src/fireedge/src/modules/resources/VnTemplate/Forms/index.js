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
import { createAsyncForm, CreateStepsCallback } from '@UtilsModule'
import { ReactElement } from 'react'

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const CreateForm = createAsyncForm(() =>
  import('@modules/resources/VnTemplate/Forms/CreateForm')
)

/**
 * @param {object} configProps - Configuration
 * @returns {ReactElement|CreateStepsCallback} Asynchronous loaded form
 */
const InstantiateForm = createAsyncForm(() =>
  import('@modules/resources/VnTemplate/Forms/InstantiateForm')
)

export { CreateForm, InstantiateForm }
export { SelectTemplateForm } from '@modules/resources/VnTemplate/Forms/SelectTemplateForm'
