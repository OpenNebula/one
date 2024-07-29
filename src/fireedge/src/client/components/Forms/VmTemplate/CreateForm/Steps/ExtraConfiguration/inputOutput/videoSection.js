/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { VIDEO_FIELDS } from './schema'
import { T, COMMON_RESOLUTIONS } from 'client/constants'
import { FormWithSchema } from 'client/components/Forms'
import { useFormContext } from 'react-hook-form'
export const SECTION_ID = 'VIDEO'

/**
 * Video section to set values about VIDEO attribute.
 *
 * @param {object} param - Properties to use in the form
 * @param {string} param.stepId - Name of the step
 * @param {string} param.hypervisor - Type of hypervisor
 * @param {object} param.oneConfig - ONE config
 * @param {boolean} param.adminGroup - If the user is admin
 * @returns {object} - The component rendered
 */
const VideoSection = ({ stepId, hypervisor, oneConfig, adminGroup }) => {
  // Check resolution value to get if it's a custom value or one of the common resolutions
  const { getValues, setValue } = useFormContext()

  // If the context has extra field, we are in template create/update that use extra.VIDEO fiel. If not, we are on update config on a vm, that uses VIDEO field
  const videoField = getValues('extra') ? 'extra.VIDEO' : 'VIDEO'

  const resolution = getValues(`${videoField}.RESOLUTION`)
  const commonsResolutions = Object.values(COMMON_RESOLUTIONS)

  // If resolution it's a custom value, set custom as resolution and set widht and height resolution
  if (resolution && !commonsResolutions.includes(resolution)) {
    setValue(`${videoField}.RESOLUTION`, 'custom')
    const resolutionValues = resolution.split('x')
    setValue(`${videoField}.RESOLUTION_WIDTH`, resolutionValues[0])
    setValue(`${videoField}.RESOLUTION_HEIGHT`, resolutionValues[1])
  }

  // Get video fields
  const fields = useMemo(
    () => VIDEO_FIELDS(hypervisor, oneConfig, adminGroup),
    [hypervisor]
  )

  // Generate a form from the schema
  return (
    <FormWithSchema
      cy={[stepId, 'io-video'].filter(Boolean).join('.')}
      fields={fields}
      legend={T.Video}
      rootProps={{ sx: { gridColumn: '1 / -1' } }}
      saveState={true}
      id={stepId}
    />
  )
}

VideoSection.propTypes = {
  hypervisor: PropTypes.string,
  stepId: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VideoSection.displayName = 'VideoSection'

export default VideoSection
