/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { T } from '@ConstantsModule'
import PropTypes from 'prop-types'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { SCHEMA, FIELDS } from './schema'

export const STEP_ID = 'deployments'

const Content = (providers, groupedDrivers, deploymentSteps) => (
  <FormWithSchema
    id={STEP_ID}
    cy={`${STEP_ID}`}
    fields={FIELDS(providers, groupedDrivers, deploymentSteps)}
  />
)

/**
 * @param {Array} providers - Array of providers
 * @param {Array} groupedDrivers - Array of drivers with deployment configurations fields
 * @param {Array} deploymentSteps - Array of deployment steps
 * @returns {object} Deployment configurations with associated next steps
 */
const Deployments = (providers, groupedDrivers, deploymentSteps) => ({
  id: STEP_ID,
  label: T.DeploymentTypes,
  resolver: SCHEMA(providers),
  optionsValidate: { abortEarly: false },
  content: () => Content(providers, groupedDrivers, deploymentSteps),
})

Deployments.propTypes = {
  providers: PropTypes.object,
}

export default Deployments
