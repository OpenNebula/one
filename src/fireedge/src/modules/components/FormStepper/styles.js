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
/* eslint-disable jsdoc/require-jsdoc */
import { css } from '@emotion/css'

// Style to use when render a stepper
const FormStepperStyles = (theme) => ({
  stepperContainer: css({
    padding: '1rem 1rem 1rem 0rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  stepsContainer: css({
    width: '100%',
  }),
  mandatoryLabelContainer: css({
    width: '100%',
  }),
  buttonContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    padding: '1rem 0.5rem 1rem 0rem',
    textAlign: 'end',
    backdropFilter: 'blur(3px)',
    position: 'sticky',
    top: 85,
    zIndex: theme?.zIndex.mobileStepper + 1,
    backgroundColor: 'transparent',
    width: '100%',
    gap: '1rem',
  }),
})

export default FormStepperStyles
