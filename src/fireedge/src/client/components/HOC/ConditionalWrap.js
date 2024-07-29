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
import {
  cloneElement,
  Component,
  ReactElement,
  JSXElementConstructor,
} from 'react'

/**
 * @param {object} props - Props
 * @param {boolean} props.condition - Condition
 * @param {JSXElementConstructor} props.children - Children
 * @param {Component|ReactElement} props.wrap - Wrapper
 * @returns {JSXElementConstructor} Returns children with wrapper component
 */
const ConditionalWrap = ({ condition, children, wrap }) =>
  condition ? cloneElement(wrap(children)) : children

export default ConditionalWrap
