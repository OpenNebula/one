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

import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { SCHEMA, FIELDS } from './schema'
import { AlertNotification, FormWithSchema } from '@ComponentsV2Module'
import { useFormContext } from 'react-hook-form'
import { useTheme } from '@mui/material'
import { css } from '@emotion/css'
import { useMemo } from 'react'

export const STEP_ID = 'vntemplates'

const Content = () => {
  const { translate } = useTranslation()
  const theme = useTheme()

  // Style for info message
  const useStyles = ({ palette }) => ({
    groupInfo: css({
      '&': {
        gridColumn: 'span 2',
        marginTop: '1em',
        backgroundColor: palette.background.paper,
      },
    }),
  })
  const classes = useMemo(() => useStyles(theme), [theme])

  const { watch } = useFormContext()

  const allVnets = watch('general.ALL_VNETS')
  if (allVnets === true) {
    return (
      <>
        <AlertNotification
          type="primary"
          status="information"
          description={translate(T['groups.actions.vlan-rule.hint'])}
          isDismissible={false}
          className={classes.groupInfo}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </>
    )
  } else {
    return <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
  }
}

/**
 * Drivers table selector.
 *
 * @param {object} props - Properties for the step
 * @param {boolean} props.update - Determine if this step is shown. False as default
 * @returns {object} Drivers table selector step
 */
const VNTemplatesStep = ({ update = false } = {}) => ({
  id: STEP_ID,
  label: T.SelectVirtualNetworkTemplates,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(),
  defaultDisabled: {
    condition: () => update,
  },
})

VNTemplatesStep.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default VNTemplatesStep
