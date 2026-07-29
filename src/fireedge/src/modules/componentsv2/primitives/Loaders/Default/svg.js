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
 * @returns {Component} - LoaderCircleSvg component.
 */
export const LoaderCircleSvg = () => (
  <svg
    aria-hidden="true"
    className="loader-circle-svg"
    focusable="false"
    viewBox="0 0 50 50"
  >
    <circle cx="25" cy="5" r="2.25" />
    <circle cx="39.14" cy="10.86" r="2.25" />
    <circle cx="45" cy="25" r="2.25" />
    <circle cx="39.14" cy="39.14" r="2.25" />
    <circle cx="25" cy="45" r="2.25" />
    <circle cx="10.86" cy="39.14" r="2.25" />
    <circle cx="5" cy="25" r="2.25" />
    <circle cx="10.86" cy="10.86" r="2.25" />
  </svg>
)

LoaderCircleSvg.displayName = 'LoaderCircleSvg'
