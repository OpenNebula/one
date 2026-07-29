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
import { Component } from 'react'

/**
 * @returns {Component} - RequiredSvg component.
 */
export const RequiredSvg = () => (
  <svg
    width="5"
    height="5"
    viewBox="0 0 5 5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={'textarea-required-svg'}
  >
    <path
      d="M1.90057 4.90909L1.98153 3.1108L0.464489 4.08665L0 3.27699L1.6108 2.45455L0 1.6321L0.464489 0.822443L1.98153 1.7983L1.90057 0H2.82528L2.74432 1.7983L4.26136 0.822443L4.72585 1.6321L3.11506 2.45455L4.72585 3.27699L4.26136 4.08665L2.74432 3.1108L2.82528 4.90909H1.90057Z"
      fill="currentColor"
    />
  </svg>
)

RequiredSvg.displayName = 'RequiredSvg'
