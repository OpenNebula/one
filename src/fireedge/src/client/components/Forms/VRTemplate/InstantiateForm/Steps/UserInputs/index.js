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
import PropTypes from 'prop-types'
import {
  FIELDS,
  SCHEMA,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/UserInputs/schema'
import { T, UserInputObject } from 'client/constants'
import { generateTabs } from 'client/utils'
import { Component } from 'react'
export const STEP_ID = 'user_inputs'

/**
 * Return the content for the user inputs step.
 *
 * @param {object} props - Object with the info about user inputs
 * @param {object} props.userInputsLayout - Info about user inputs
 * @param {boolean} props.showMandatoryOnly - Show only mandatory inputs
 * @returns {Component} React component with the content of the step
 */
const Content = ({ userInputsLayout, showMandatoryOnly }) =>
  generateTabs(userInputsLayout, STEP_ID, FIELDS, showMandatoryOnly)

Content.propTypes = {
  props: PropTypes.any,
  userInputsLayout: PropTypes.object,
}

/**
 * User inputs step.
 *
 * @param {UserInputObject[]} userInputs - User inputs
 * @param {object} userInputsLayout - Info about user inputs
 * @returns {object} User inputs step
 */
const UserInputsStep = (userInputs, userInputsLayout) => ({
  id: STEP_ID,
  label: T.UserInputs,
  optionsValidate: { abortEarly: false },
  resolver: SCHEMA(userInputs),
  enableShowMandatoryOnly: true,
  content: (props) => Content({ ...props, userInputsLayout }),
})

export default UserInputsStep
