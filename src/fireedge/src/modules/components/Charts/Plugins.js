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
import { timeFromSeconds } from '@ModelsModule'

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
            opts?.onScaled(xMax !== nxMax || xMin !== nxMin)
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


function tooltipPlugin({ dataset, tooltipClass, seriesColors, shiftX = 5, shiftY = 5, interpolation }) {
  let tooltipLeftOffset = 0;
  let tooltipTopOffset = 0;

  const tooltip = document.createElement("div");
  tooltip.className = tooltipClass;

  let seriesIdx = null;  
  let seriesLabel = "Series";
  let dataIdx = null;
  let over;
  let tooltipVisible = false;

  function showTooltip() {
    if (!tooltipVisible) {
      tooltip.style.display = "block";
      over.style.cursor = "pointer";
      tooltipVisible = true;
    }
  }

  function hideTooltip() {
    if (tooltipVisible) {
      tooltip.style.display = "none";
      over.style.cursor = null;
      tooltipVisible = false;
    }
  }

  function setTooltip(u) {
    if (seriesIdx == null || dataIdx == null || dataIdx < 0) return;

    const top = u.valToPos(u.data[seriesIdx][dataIdx], "y");
    const left = u.valToPos(u.data[0][dataIdx], "x");

    const value = u.data[seriesIdx][dataIdx];
    const time = u.data[0][dataIdx];
    const formattedTime = timeFromSeconds(time).toFormat("dd/MM/yyyy, hh:mm:ss a");

    const colorBox = `<span style="display:inline-block;width:10px;height:10px;background:${seriesColors[seriesIdx - 1]};border-radius:2px;margin-right:6px;"></span>`;

    tooltip.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        gap: 5.811px;
        align-items: flex-start;
      ">
        <div style="display: flex; align-items: center;">
          ${colorBox}
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="font-weight: 400;">${seriesLabel}:</span>
          <strong style="font-weight: 700; font-size: 14px;">${interpolation(value)}</strong>
        </span>
        </div>
        <div style="font-weight: 400; line-height: 16px;">
          ${formattedTime}
        </div>
      </div>
    `;

    tooltip.style.display = "block";
    tooltip.style.visibility = "hidden";
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    const container = u.root.querySelector(".u-wrap");
    const containerRect = container.getBoundingClientRect();

    const containerLeft = tooltipLeftOffset + left;
    const defaultLeft = containerLeft + shiftX;

    let finalLeft = defaultLeft;

    if (defaultLeft + tooltipWidth > containerRect.width) {
      finalLeft = containerLeft - tooltipWidth - shiftX;
    }

    let finalTop = tooltipTopOffset + top + shiftY;

    if (finalTop + tooltipHeight > containerRect.height) {
      finalTop = containerRect.height - tooltipHeight - 5;
    }
    if (finalTop < 0) finalTop = 0;

    tooltip.style.top = `${finalTop}px`;
    tooltip.style.left = `${finalLeft}px`;

    tooltip.style.visibility = "visible";

    showTooltip();
  }

  return {
    hooks: {
      ready: [
        (u) => {
          over = u.over;
          tooltipLeftOffset = parseFloat(over.style.left) || 0;
          tooltipTopOffset = parseFloat(over.style.top) || 0;
          u.root.querySelector(".u-wrap").appendChild(tooltip);
        },
      ],
    setSeries: [
        (u, sidx) => {
            if (seriesIdx != sidx) {
                seriesIdx = sidx;
                seriesLabel = u.series[seriesIdx]?.label ?? 'Serie';

                if (sidx == null)
                    hideTooltip();
                else if (dataIdx != null)
                    setTooltip(u);
            }
        }
    ],
    setCursor: [
            u => {
                let c = u.cursor;

                if (dataIdx != c.idx) {
                    dataIdx = c.idx;

                    if (seriesIdx != null)
                        setTooltip(u);
                }
            }
        ],
    },
  };
}
export { wheelZoomPlugin, tooltipPlugin }
