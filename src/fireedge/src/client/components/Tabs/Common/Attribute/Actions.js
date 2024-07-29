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
import { memo, useMemo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import {
  Copy as CopyIcon,
  AddSquare as AddIcon,
  Edit as EditIcon,
  Trash as DeleteIcon,
  Check as AcceptIcon,
  Cancel as CancelIcon,
} from 'iconoir-react'

import { useClipboard } from 'client/hooks'
import { Translate } from 'client/components/HOC'
import { Action } from 'client/components/Cards/SelectCard'
import { camelCase } from 'client/utils'
import { T } from 'client/constants'

/**
 * @param {string} action - Action name
 * @param {string} attr - Attribute name
 * @returns {string} Merge action and attributes name
 */
const getAttributeCy = (action, attr) =>
  `${action}-${camelCase(attr.toLowerCase())}`

/**
 * @typedef {object} ActionButtonProps
 * @property {string} action - Action name
 * @property {string} name - Attribute name
 * @property {JSXElementConstructor} icon - Icon
 * @property {Function} handleClick - Click event
 */

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const ActionButton = ({ action, name, icon: Icon, handleClick, ...props }) => {
  const dataCy = useMemo(() => getAttributeCy(action, name), [name])

  return (
    <Action cy={dataCy} icon={<Icon />} handleClick={handleClick} {...props} />
  )
}

ActionButton.propTypes = {
  action: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired,
}

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const Copy = memo(
  ({ value, ...props }) => {
    const { copy, isCopied } = useClipboard(1000)

    return (
      <ActionButton
        action="copy"
        tooltip={
          <>
            {'✔️'}
            <Translate word={T.CopiedToClipboard} />
          </>
        }
        tooltipprops={{ open: isCopied }}
        handleClick={async () => await copy(value)}
        icon={CopyIcon}
        {...props}
      />
    )
  },
  (prev, next) => prev.value === next.value
)

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const Add = (props) => <ActionButton action="add" icon={AddIcon} {...props} />

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const Edit = (props) => (
  <ActionButton action="edit" icon={EditIcon} {...props} />
)

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const Delete = (props) => (
  <ActionButton action="delete" icon={DeleteIcon} {...props} />
)

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const Accept = (props) => (
  <ActionButton action="accept" icon={AcceptIcon} {...props} />
)

/**
 * @param {ActionButtonProps} props - Action button props
 * @returns {JSXElementConstructor} Action button with props
 */
const Cancel = (props) => (
  <ActionButton action="cancel" icon={CancelIcon} {...props} />
)

Copy.displayName = 'CopyActionButton'

Copy.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
}

export { getAttributeCy, ActionButton, Copy, Add, Accept, Cancel, Delete, Edit }
