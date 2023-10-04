/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { string, ObjectSchema, boolean, number } from 'yup'

import {
  Field,
  arrayToOptions,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  HYPERVISORS,
  VIDEO_TYPES,
  COMMON_RESOLUTIONS,
} from 'client/constants'

const { kvm, dummy } = HYPERVISORS

/**
 * Schema for VIDEO section of the template. Considerations about fields behavior according to the core:
 * - Only if the hypervisor it's kvm.
 * - If the user select VIDEO_TYPE auto, the rest of the fields will be hidden and the request has not any VIDEO section.
 * - If the user select VIDEO_TYPE none, the rest of the fields will be hidden and the request has VIDEO section but only with type=none.
 * - If the user select VIDEO_TYPE cirrus, ATS, IOMMU and resolution will be hidden.
 * - If the user select VIDEO_TYPE vga, ATS and IOMMU will be hidden.
 * - If the user select VIDEO_TYPE virtio, all attributes will be show to the user.
 * - Resolution will be one of the values of the COMMON_RESOLUTIONS or a custom resolution.
 */

/** @type {Field} Type field */
export const VIDEO_TYPE = {
  name: 'VIDEO.TYPE',
  type: INPUT_TYPES.SELECT,
  label: T.VideoType,
  tooltip: T.VideoTypeConcept,
  onlyOnHypervisors: [kvm, dummy],
  values: arrayToOptions(Object.values(VIDEO_TYPES), { addEmpty: false }),
  validation: string()
    .trim()
    .default(() => VIDEO_TYPES.auto)
    .afterSubmit((value, { context }) => {
      // A valid hypervisor will be if the hypervisor it's kvm (when creating or updating templates) or when it's undefined (when updating the config of a vm)
      const validHypervisor =
        context?.general?.HYPERVISOR === kvm ||
        context?.general?.HYPERVISOR === dummy ||
        !context?.general?.HYPERVISOR

      // Not send to the request the value if it's not a valid hypervisor
      return validHypervisor && value !== VIDEO_TYPES.auto ? value : undefined
    }),
  grid: { sm: 3, md: 3 },
}

/** @type {Field} IOMMU field */
export const IOMMU = {
  name: 'VIDEO.IOMMU',
  label: T.IOMMU,
  tooltip: T.IOMMUConcept,
  onlyOnHypervisors: [kvm, dummy],
  type: INPUT_TYPES.SWITCH,
  dependOf: VIDEO_TYPE.name,
  htmlType: (type) =>
    (!type || type !== VIDEO_TYPES.virtio) && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo(false)
    .afterSubmit((value, { context }) => {
      // A valid hypervisor will be if the hypervisor it's kvm (when creating or updating templates) or when it's undefined (when updating the config of a vm)
      const validHypervisor =
        context?.general?.HYPERVISOR === kvm ||
        context?.general?.HYPERVISOR === dummy ||
        !context?.general?.HYPERVISOR

      // Get video type from the context on extra step (templates) or no step (vm)
      const videoType = context?.extra?.VIDEO?.TYPE || context?.VIDEO?.TYPE

      // Not send to the request the value if it's not a valid hypervisor
      return validHypervisor && videoType === VIDEO_TYPES.virtio
        ? value
          ? 'YES'
          : 'NO'
        : undefined
    }),
  grid: { sm: 12, md: 12 },
}

/** @type {Field} ATS field */
export const ATS = {
  name: 'VIDEO.ATS',
  label: T.ATS,
  tooltip: T.ATSConcept,
  onlyOnHypervisors: [kvm, dummy],
  type: INPUT_TYPES.SWITCH,
  dependOf: VIDEO_TYPE.name,
  htmlType: (type) =>
    (!type || type !== VIDEO_TYPES.virtio) && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo(false)
    .afterSubmit((value, { context }) => {
      //  A valid hypervisor will be if the hypervisor it's kvm (when creating or updating templates) or when it's undefined (when updating the config of a vm)
      const validHypervisor =
        context?.general?.HYPERVISOR === kvm ||
        context?.general?.HYPERVISOR === dummy ||
        !context?.general?.HYPERVISOR

      // Get video type from the context on extra step (templates) or no step (vm)
      const videoType = context?.extra?.VIDEO?.TYPE || context?.VIDEO?.TYPE

      // Not send to the request the value if it's not a valid hypervisor
      return validHypervisor && videoType === VIDEO_TYPES.virtio
        ? value
          ? 'YES'
          : 'NO'
        : undefined
    }),
  grid: { sm: 12, md: 12 },
}

/** @type {Field} VRAM field */
export const VRAM = {
  name: 'VIDEO.VRAM',
  label: T.VRAM,
  tooltip: T.VRAMConcept,
  onlyOnHypervisors: [kvm, dummy],
  type: INPUT_TYPES.TEXT,
  dependOf: VIDEO_TYPE.name,
  htmlType: (type) =>
    (!type || type === VIDEO_TYPES.auto || type === VIDEO_TYPES.none) &&
    INPUT_TYPES.HIDDEN,
  validation: number()
    .min(1024)
    .afterSubmit((value, { context }) => {
      // A valid hypervisor will be if the hypervisor it's kvm (when creating or updating templates) or when it's undefined (when updating the config of a vm)
      const validHypervisor =
        context?.general?.HYPERVISOR === kvm ||
        context?.general?.HYPERVISOR === dummy ||
        !context?.general?.HYPERVISOR

      // Get video type from the context on extra step (templates) or no step (vm)
      const videoType = context?.extra?.VIDEO?.TYPE || context?.VIDEO?.TYPE

      // Not send to the request the value if it's not a valid hypervisor
      return validHypervisor &&
        videoType !== VIDEO_TYPES.auto &&
        videoType !== VIDEO_TYPES.none
        ? value
        : undefined
    }),
  grid: { sm: 3, md: 3 },
}

/** @type {Field} Resolution field */
export const RESOLUTION = {
  name: 'VIDEO.RESOLUTION',
  type: INPUT_TYPES.SELECT,
  label: T.Resolution,
  tooltip: T.ResolutionConcept,
  onlyOnHypervisors: [kvm, dummy],
  dependOf: VIDEO_TYPE.name,
  htmlType: (type) =>
    (!type ||
      type === VIDEO_TYPES.auto ||
      type === VIDEO_TYPES.none ||
      type === VIDEO_TYPES.cirrus) &&
    INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.values(COMMON_RESOLUTIONS), { addEmpty: true }),
  validation: string()
    .trim()
    .afterSubmit((value, { context }) => {
      // Video type could be on extra (when creating or updating templates) or VIDEO (when updating the config of a vm) attributes
      const videoType = context?.extra?.VIDEO?.TYPE || context?.VIDEO?.TYPE

      // A valid hypervisor will be if the hypervisor it's kvm (when creating or updating templates) or when it's undefined (when updating the config of a vm)
      const validHypervisor =
        context?.general?.HYPERVISOR === kvm ||
        context?.general?.HYPERVISOR === dummy ||
        !context?.general?.HYPERVISOR

      // Resolution (width and height, that only is set by the user when resolution it's custom) could be on extra (when creating or updating templates) or VIDEO (when updating the config of a vm) attributes
      const resolutionWidth =
        context?.extra?.VIDEO?.RESOLUTION_WIDTH ||
        context?.VIDEO?.RESOLUTION_WIDTH
      const resolutionHeight =
        context?.extra?.VIDEO?.RESOLUTION_HEIGHT ||
        context?.VIDEO?.RESOLUTION_HEIGHT

      // Return resolution only if the video type is not auto/none/cirrus and hypervisor is kvm (templates) or undefined (vms)
      return !validHypervisor ||
        videoType === VIDEO_TYPES.auto ||
        videoType === VIDEO_TYPES.none ||
        videoType === VIDEO_TYPES.cirrus
        ? undefined
        : value === 'custom'
        ? resolutionWidth + 'x' + resolutionHeight
        : value
    }),
  grid: { sm: 6, md: 6 },
}

/** @type {Field} RESOLUTION_WIDTH field */
export const RESOLUTION_WIDTH = {
  name: 'VIDEO.RESOLUTION_WIDTH',
  label: T.ResolutionWidth,
  tooltip: T.ResolutionWidthConcept,
  onlyOnHypervisors: [kvm, dummy],
  type: INPUT_TYPES.TEXT,
  dependOf: [RESOLUTION.name, VIDEO_TYPE.name],
  htmlType: (type) =>
    (!type ||
      type[0] !== COMMON_RESOLUTIONS.custom ||
      type[1] === VIDEO_TYPES.auto ||
      type[1] === VIDEO_TYPES.none ||
      type[1] === VIDEO_TYPES.cirrus) &&
    INPUT_TYPES.HIDDEN,
  validation: number()
    .positive()
    .afterSubmit(() => undefined),
  grid: { sm: 3, md: 3 },
}

/** @type {Field} RESOLUTION_HEIGHT field */
export const RESOLUTION_HEIGHT = {
  name: 'VIDEO.RESOLUTION_HEIGHT',
  label: T.ResolutionHeight,
  tooltip: T.ResolutionHeightConcept,
  onlyOnHypervisors: [kvm, dummy],
  type: INPUT_TYPES.TEXT,
  dependOf: [RESOLUTION.name, VIDEO_TYPE.name],
  htmlType: (type) =>
    (!type ||
      type[0] !== COMMON_RESOLUTIONS.custom ||
      type[1] === VIDEO_TYPES.auto ||
      type[1] === VIDEO_TYPES.none ||
      type[1] === VIDEO_TYPES.cirrus) &&
    INPUT_TYPES.HIDDEN,
  validation: number()
    .positive()
    .afterSubmit(() => undefined),
  grid: { sm: 3, md: 3 },
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Field[]} List of Video fields
 */
export const VIDEO_FIELDS = (hypervisor, oneConfig, adminGroup) =>
  disableFields(
    filterFieldsByHypervisor(
      [
        VIDEO_TYPE,
        VRAM,
        RESOLUTION,
        RESOLUTION_WIDTH,
        RESOLUTION_HEIGHT,
        IOMMU,
        ATS,
      ],
      hypervisor
    ),
    'VIDEO',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} Video schema */
export const VIDEO_SCHEMA = (hypervisor) =>
  getObjectSchemaFromFields(VIDEO_FIELDS(hypervisor))
