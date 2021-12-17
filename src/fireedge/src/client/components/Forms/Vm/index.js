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
import loadable, { Options } from '@loadable/component'
import { CreateFormCallback, CreateStepsCallback } from 'client/utils/schema'

/**
 * @param {object} properties - Dynamic properties
 * @param {string} properties.formPath - Form pathname
 * @param {string} [properties.componentToLoad] - Load different component instead of default
 * @param {Options} [properties.options] - Options
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback|CreateStepsCallback} Resolved form
 */
const AsyncLoadForm = async (properties = {}, ...args) => {
  const { formPath, componentToLoad = 'default', options } = properties

  const form = await loadable(() => import(`./${formPath}`), {
    cacheKey: () => formPath,
    ...options,
  }).load()

  return form[componentToLoad]?.(...args)
}

/**
 * @param {...any} args - Arguments
 * @returns {CreateStepsCallback} Asynchronous loaded form
 */
const ImageSteps = (...args) =>
  AsyncLoadForm({ formPath: 'AttachDiskForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateStepsCallback} Asynchronous loaded form
 */
const VolatileSteps = (...args) =>
  AsyncLoadForm({ formPath: 'AttachDiskForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const AttachNicForm = (...args) =>
  AsyncLoadForm({ formPath: 'AttachNicForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const ChangeUserForm = (...args) =>
  AsyncLoadForm({ formPath: 'ChangeUserForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const ChangeGroupForm = (...args) =>
  AsyncLoadForm({ formPath: 'ChangeGroupForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const CreateDiskSnapshotForm = (...args) =>
  AsyncLoadForm({ formPath: 'CreateDiskSnapshotForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const CreateSnapshotForm = (...args) =>
  AsyncLoadForm({ formPath: 'CreateSnapshotForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const MigrateForm = (...args) =>
  AsyncLoadForm({ formPath: 'MigrateForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const RecoverForm = (...args) =>
  AsyncLoadForm({ formPath: 'RecoverForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const ResizeCapacityForm = (...args) =>
  AsyncLoadForm({ formPath: 'ResizeCapacityForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const ResizeDiskForm = (...args) =>
  AsyncLoadForm({ formPath: 'ResizeDiskForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const SaveAsDiskForm = (...args) =>
  AsyncLoadForm({ formPath: 'SaveAsDiskForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const SaveAsTemplateForm = (...args) =>
  AsyncLoadForm({ formPath: 'SaveAsTemplateForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const CreateSchedActionForm = (...args) =>
  AsyncLoadForm({ formPath: 'CreateSchedActionForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeSchedActionForm = (...args) =>
  AsyncLoadForm(
    { formPath: 'CreateSchedActionForm', componentToLoad: 'RelativeForm' },
    ...args
  )

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const CreateCharterForm = (...args) =>
  AsyncLoadForm({ formPath: 'CreateCharterForm' }, ...args)

/**
 * @param {...any} args - Arguments
 * @returns {CreateFormCallback} Asynchronous loaded form
 */
const CreateRelativeCharterForm = (...args) =>
  AsyncLoadForm(
    { formPath: 'CreateCharterForm', componentToLoad: 'RelativeForm' },
    ...args
  )

export {
  AttachNicForm,
  ChangeGroupForm,
  ChangeUserForm,
  CreateCharterForm,
  CreateDiskSnapshotForm,
  CreateRelativeCharterForm,
  CreateRelativeSchedActionForm,
  CreateSchedActionForm,
  CreateSnapshotForm,
  ImageSteps,
  MigrateForm,
  RecoverForm,
  ResizeCapacityForm,
  ResizeDiskForm,
  SaveAsDiskForm,
  SaveAsTemplateForm,
  VolatileSteps,
}
