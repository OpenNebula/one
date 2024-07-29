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
import { memo } from 'react'
import { number, string, oneOfType } from 'prop-types'

const GuacamoleLogo = memo(({ width, height, viewBox, ...props }) => (
  <svg viewBox={viewBox} width={width} height={height} {...props}>
    <g id="logo__guacamole" fill="currentColor">
      <path d="M21.104 10.951c.7-.371 1.351-.708 1.993-1.067.232-.13.333-.105.411.139a1.545 1.545 0 0 1-.259 1.436 5.464 5.464 0 0 1-2.568 1.767 17.565 17.565 0 0 1-5.285 1.1 20.533 20.533 0 0 1-7.063-.673 7.513 7.513 0 0 1-3.595-1.894 1.417 1.417 0 0 1-.135-2.181 4.557 4.557 0 0 0 .8-1.344.589.589 0 0 1 .382-.4 8.368 8.368 0 0 0 2.786-1.7 2.3 2.3 0 0 1 1.6-.411 4.551 4.551 0 0 0 2.317-.585 2.447 2.447 0 0 1 1.987-.157 6.926 6.926 0 0 0 2.749.39 3.46 3.46 0 0 1 2.094.893c.137.09.057.193.015.294-.165.4-.314.807-.5 1.2-.122.263-.041.417.219.528.108.047.207.113.316.151a.726.726 0 0 1 .524.492.951.951 0 0 0 .527.574.948.948 0 0 1 .586.885 4.96 4.96 0 0 0 .099.563Z" />
      <path d="M13.441 19.101a20.933 20.933 0 0 1-9.4-2.292 9.579 9.579 0 0 1-1.658-1.086 1.138 1.138 0 0 1-.51-.865c-.009-.306-.082-.608-.116-.912a1.794 1.794 0 0 0-.221-.8 2.621 2.621 0 0 1-.219-1.109 3.184 3.184 0 0 1 1.389-3.129 11.594 11.594 0 0 1 1.439-.935c.066-.036.142-.1.211-.057.1.066.012.15-.013.228a4.076 4.076 0 0 1-.753 1.314 2.379 2.379 0 0 0 .2 3.378 7.775 7.775 0 0 0 3.238 1.961 20.178 20.178 0 0 0 7.241 1.084 18.943 18.943 0 0 0 7.1-1.36 6.923 6.923 0 0 0 2.529-1.671 2.516 2.516 0 0 0 .533-3.05c-.022-.044-.059-.092-.053-.132.04-.231.72-.482.906-.329a2.349 2.349 0 0 1 .995 1.911 6.01 6.01 0 0 1-.308 2.314 6.109 6.109 0 0 0-.258 1.4 1.325 1.325 0 0 1-.565.876 14.3 14.3 0 0 1-4.1 2.053 23.312 23.312 0 0 1-7.607 1.208ZM3.062 19.252c.108-.065.2-.007.3.064a15.464 15.464 0 0 0 6.193 2.427 21.51 21.51 0 0 0 5.692.356 18.984 18.984 0 0 0 8.085-2.186c.225-.126.437-.27.652-.41.056-.035.106-.084.17-.036s.035.119.007.169a4.059 4.059 0 0 1-.227.343 10.036 10.036 0 0 1-5.773 3.942 16.682 16.682 0 0 1-10.429-.569 8.917 8.917 0 0 1-4.469-3.713c-.039-.063-.084-.125-.119-.19s-.142-.09-.082-.197Z" />
      <path d="M21.925 4.499a3.676 3.676 0 0 1 .388.1 7.965 7.965 0 0 1 2.894 1.755c.245.241.216.442 0 .695a11.193 11.193 0 0 1-3.085 2.207c-.159.093-.238.048-.3-.108a1.007 1.007 0 0 0-.547-.566.53.53 0 0 1-.292-.4.689.689 0 0 0-.469-.522c-.141-.045-.21-.1-.152-.264a12.325 12.325 0 0 1 1.191-2.636c.085-.133.17-.279.372-.261Z" />
    </g>
  </svg>
))

GuacamoleLogo.propTypes = {
  width: oneOfType([number, string]).isRequired,
  height: oneOfType([number, string]).isRequired,
  viewBox: string,
}

GuacamoleLogo.defaultProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 28 28',
}

GuacamoleLogo.displayName = 'GuacamoleLogo'

export default GuacamoleLogo
