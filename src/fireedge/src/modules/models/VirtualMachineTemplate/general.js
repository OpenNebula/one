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
import { VmTemplate } from '@ConstantsModule'

import { getLocked } from '@UtilsModule'

/**
 * @param {VmTemplate} vmTemplate - Virtual machine template
 * @returns {string} - Return if virtual machine template is locked/unlocked
 */
export const getVMTemplateLocked = getLocked

/**
 * @param {VmTemplate} vmTemplate - Virtual machine template
 * @returns {number} Number of defined virtual networks
 */
export const getVmTemplateNetworkCount = ({ TEMPLATE = {} } = {}) =>
  []
    .concat(TEMPLATE?.NIC ?? [])
    .flat()
    .filter(Boolean).length

/**
 * @param {VmTemplate} vmTemplate - Virtual machine template
 * @returns {number} Number of image-backed disks
 */
export const getVmTemplateImageCount = ({ TEMPLATE = {} } = {}) =>
  []
    .concat(TEMPLATE?.DISK ?? [])
    .flat()
    .filter((disk) => disk?.IMAGE !== undefined || disk?.IMAGE_ID !== undefined)
    .length
