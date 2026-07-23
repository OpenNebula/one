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

/**
 * @param {object} params - Theme params
 * @param {object} params.palette - Theme palette
 * @returns {object} Table layout
 */
export const Graphs = ({ palette }) => ({
  legend: palette.text.disabled,
  tooltip: palette.border.information,
  grid: palette.surface.mute,
  vm: {
    cpu: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    memory: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    diskReadBytes: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    diskReadIOPS: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    diskWriteBytes: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    diskWriteIOPS: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    netDownloadSpeed: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
    netUploadSpeed: {
      real: palette.text.information,
      forecast: palette.text.warning,
      forecastFar: palette.text.onDisabled,
    },
  },
  host: {
    cpu: {
      free: {
        real: palette.text.information,
        forecast: palette.text.warning,
        forecastFar: palette.text.onDisabled,
      },
      used: {
        real: palette.text.information,
        forecast: palette.text.warning,
        forecastFar: palette.text.onDisabled,
      },
    },
    memory: {
      free: {
        real: palette.text.information,
        forecast: palette.text.warning,
        forecastFar: palette.text.onDisabled,
      },
      used: {
        real: palette.text.information,
        forecast: palette.text.warning,
        forecastFar: palette.text.onDisabled,
      },
    },
  },
})
