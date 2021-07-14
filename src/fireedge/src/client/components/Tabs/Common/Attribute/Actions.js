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
import * as React from 'react'
import PropTypes from 'prop-types'

import {
  Edit as EditIcon,
  Trash as DeleteIcon,
  Check as AcceptIcon,
  Cancel as CancelIcon
} from 'iconoir-react'

import { Action } from 'client/components/Cards/SelectCard'
import { stringToCamelCase } from 'client/utils'

/**
 * @param {string} action - Action name
 * @param {string} attr - Attribute name
 * @returns {string} Merge action and attributes name
 */
const getAttributeCy = (action, attr) => `${action}-${stringToCamelCase(attr.toLowerCase())}`

/**
 * @typedef {object} ActionButtonProps
 * @property {string} action - Action name
 * @property {string} name - Attribute name
 * @property {React.FunctionComponent} icon - Icon
 * @property {Function} handleClick - Click event
 */

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {React.JSXElementConstructor} Action button with props
 */
const ActionButton = ({ action, name, icon: Icon, handleClick, ...props }) => (
  <Action
    cy={getAttributeCy(action, name)}
    icon={<Icon size={18} />}
    handleClick={handleClick}
    {...props}
  />
)

ActionButton.propTypes = {
  action: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired
}

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {React.JSXElementConstructor} Action button with props
 */
const Edit = props => <ActionButton action='edit' icon={EditIcon} {...props}/>

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {React.JSXElementConstructor} Action button with props
 */
const Delete = props => <ActionButton action='delete' icon={DeleteIcon} {...props}/>

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {React.JSXElementConstructor} Action button with props
 */
const Accept = props => <ActionButton action='accept' icon={AcceptIcon} {...props}/>

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {React.JSXElementConstructor} Action button with props
 */
const Cancel = props => <ActionButton action='cancel' icon={CancelIcon} {...props}/>

export {
  getAttributeCy,
  ActionButton,
  Edit,
  Delete,
  Accept,
  Cancel
}
