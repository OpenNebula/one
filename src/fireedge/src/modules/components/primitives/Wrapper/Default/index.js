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

/**
 * Wraps the children with a specified component if the condition is true.
 *
 * @param {object} props - Wrapper props
 * @param {boolean} props.condition - Whether to render the wrapper component.
 * @param {object} props.component - The component to wrap around the children.
 * @param {object} props.children - The children elements to be wrapped.
 * @returns {object} The wrapped children.
 */
export const Wrapper = ({
  condition,
  component: Component,
  children,
  ...rest
}) => {
  if (!condition || !Component) {
    return children
  }

  return <Component {...rest}>{children}</Component>
}

Wrapper.propTypes = {
  condition: PropTypes.bool,
  component: PropTypes.elementType,
  children: PropTypes.node,
}

Wrapper.displayName = 'Wrapper'
