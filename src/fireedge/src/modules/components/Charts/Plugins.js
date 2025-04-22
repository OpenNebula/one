/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

/* eslint-disable  */
function wheelZoomPlugin(opts) {
  const {scaleX = true, scaleY = true} = opts
  const factor = opts.factor || 0.95

  let xMin, xMax, yMin, yMax, xRange, yRange

  function clamp(nRange, nMin, nMax, fRange, fMin, fMax) {
    if (nRange > fRange) {
      nMin = fMin
      nMax = fMax
    } else if (nMin < fMin) {
      nMin = fMin
      nMax = fMin + nRange
    } else if (nMax > fMax) {
      nMax = fMax
      nMin = fMax - nRange
    }

    return [nMin, nMax]
  }

  return {
    hooks: {
      init: (u) => {
        u.cursor.drag.setScale = false
      },
      ready: (u) => {
        xMin = u.scales.x.min
        xMax = u.scales.x.max
        yMin = u.scales.y.min
        yMax = u.scales.y.max

        xRange = xMax - xMin
        yRange = yMax - yMin

        const over = u.over

        const rect = over.getBoundingClientRect()

        // wheel scroll zoom
        over.addEventListener('wheel', (e) => {
          e.preventDefault()

          const { left, top } = u.cursor

          const leftPct = left / rect.width
          const btmPct = 1 - top / rect.height
          const xVal = u.posToVal(left, 'x')
          const yVal = u.posToVal(top, 'y')
          const oxRange = u.scales.x.max - u.scales.x.min
          const oyRange = u.scales.y.max - u.scales.y.min

          const nxRange = e.deltaY < 0 ? oxRange * factor : oxRange / factor
          let nxMin = xVal - leftPct * nxRange
          let nxMax = nxMin + nxRange
          ;[nxMin, nxMax] = clamp(nxRange, nxMin, nxMax, xRange, xMin, xMax)

          const nyRange = e.deltaY < 0 ? oyRange * factor : oyRange / factor
          let nyMin = yVal - btmPct * nyRange
          let nyMax = nyMin + nyRange
          ;[nyMin, nyMax] = clamp(nyRange, nyMin, nyMax, yRange, yMin, yMax)

          u.batch(() => {
            scaleX && u.setScale('x', {
              min: nxMin,
              max: nxMax,
            })

            scaleY && u.setScale('y', {
              min: nyMin,
              max: nyMax,
            })
          })
        })
      },
    },
  }
}

export { wheelZoomPlugin }
