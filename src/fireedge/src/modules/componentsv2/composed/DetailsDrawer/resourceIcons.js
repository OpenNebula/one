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

import {
  Archive,
  BoxIso,
  CloudDownload,
  Clock,
  Db,
  EmptyPage,
  Folder,
  Group,
  HardDrive,
  HeadsetHelp,
  HistoricShield,
  List,
  MinusPinAlt,
  ModernTv,
  MultiplePagesEmpty,
  NetworkAlt,
  NewTab,
  Packages,
  RefreshDouble,
  Server,
  SettingsProfiles,
  Shuffle,
  SimpleCart,
  User,
  XrayView,
} from 'iconoir-react'
import { RESOURCE_ICON_NAMES } from '@ConstantsModule'

const ICONS = Object.freeze({
  Archive,
  BoxIso,
  CloudDownload,
  Clock,
  Db,
  EmptyPage,
  Folder,
  Group,
  HardDrive,
  HeadsetHelp,
  HistoricShield,
  List,
  MinusPinAlt,
  ModernTv,
  MultiplePagesEmpty,
  NetworkAlt,
  NewTab,
  Packages,
  RefreshDouble,
  Server,
  SettingsProfiles,
  Shuffle,
  SimpleCart,
  User,
  XrayView,
})

/**
 * Returns the icon component associated with a resource.
 *
 * @param {string} resource - Resource id
 * @returns {Function} Icon component
 */
export const getResourceIcon = (resource) =>
  ICONS[RESOURCE_ICON_NAMES[String(resource ?? '').toLowerCase()]] ?? NewTab
