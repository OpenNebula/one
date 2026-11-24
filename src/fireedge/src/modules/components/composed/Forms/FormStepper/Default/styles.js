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
 * @param {object} root0 - Params
 * @param {object} root0.theme - Current theme in use
 * @param {boolean} root0.isPopup - Whether the stepper is rendered in a popup
 * @param {string|number} root0.progressHeight - Height of the progress section
 * @param {number} root0.canvasHeight - Available content height of the form container
 * @param {boolean} root0.hasStepper - Whether the form has multiple steps
 * @param {boolean} root0.hasExtra - Whether there is extra content section
 * @param {'wide'|'medium'|'narrow'} root0.layout - Layout for the available canvas width
 * @param {number|string} root0.maxContentWidth - Optional maximum width for centered form content
 * @returns {object} - Button SX style
 */
export const getStyles = ({
  theme,
  isPopup,
  progressHeight,
  canvasHeight,
  hasStepper = true,
  hasExtra,
  layout = 'wide',
  maxContentWidth,
}) => {
  const stepperWidth = '200px'
  const extraWidth = '280px'
  const contentWidth = '1024px'

  const stepperPopup = {
    padding: `${theme.scale[600]}px`,
    height: '100%',
    minHeight: 0,
    width: '100%',
    flex: '1 1 auto',

    '& > .content > *': {
      padding: `${theme.scale[100]}px`,
      boxSizing: 'border-box',
      overflow: 'visible',
    },
  }

  const formStepperFooter = {
    backgroundColor: theme.palette.surface.page,
    position: 'sticky',
    bottom: 0,
    marginTop: 'auto',
    zIndex: 1,
    boxShadow: `0 100vh 0 100vh ${theme.palette.surface.page}`,
    gridArea: 'actions',

    '& .help-buttons': {
      position: 'absolute',
      bottom: '100%',
      right: 0,
      display: 'flex',
      justifyContent: 'flex-end',
    },

    '& .stepper-buttons': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: `${theme.scale[600]}px`,
      borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

      '& .form-stepper-buttons-progress': {
        display: 'flex',
        flexDirection: 'row',
        gap: `${theme.scale[200]}px`,
      },
    },
  }

  return {
    width: `calc(${stepperWidth} + ${contentWidth} + ${extraWidth})`,
    alignSelf: 'center',
    height: 'auto',
    minHeight: '100%',
    flex: '1 0 auto',
    maxWidth: '100%',
    display: 'grid',
    gridTemplateColumns: hasExtra
      ? `${stepperWidth} minmax(0, 1fr) ${extraWidth}`
      : `${stepperWidth} minmax(0, 1fr)`,
    columnGap: `${theme.scale[700]}px`,
    gridTemplateAreas: hasExtra
      ? `
      "progress content extra"
      "progress actions ."
    `
      : `
      "progress content"
      "progress actions"
    `,

    '& .stepper': {
      gridArea: 'progress',
      position: 'sticky',
      top: 0,
      alignSelf: 'start',
      ...(layout === 'wide' && {
        maxHeight: canvasHeight,
      }),
      ...(layout !== 'wide' && {
        backgroundColor: theme.palette.surface.page,
        top: `-${theme.scale[700]}px`,
        marginTop: `-${theme.scale[700]}px`,
        paddingTop: `${theme.scale[700]}px`,
      }),
    },

    '& .content': {
      gridArea: 'content',
      paddingBottom: layout === 'narrow' ? 0 : `${theme.scale[1600]}px`,
      color: 'text.body',
      containerType: 'inline-size',
      containerName: 'form-stepper-main',
    },

    '& .extra': {
      gap: `${theme.scale[500]}px`,
      gridArea: 'extra',
      position: 'sticky',
      top: 0,
      display: hasExtra ? 'flex' : 'none',
      flexDirection: 'column',
      flexWrap: 'wrap',
      alignSelf: 'start',
      ...(hasStepper &&
        layout === 'medium' && {
          top: `calc(${progressHeight}px - ${theme.scale[700]}px)`,
        }),
      ...(layout === 'narrow' && {
        flexDirection: 'row',
        paddingTop: `${theme.scale[700]}px`,
        marginTop: `${theme.scale[700]}px`,
        borderTop: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,
        paddingBottom: `${theme.scale[1600]}px`,
      }),
    },

    '& .footer': formStepperFooter,

    ...(maxContentWidth != null && {
      '& > .content': {
        width: '100%',
        maxWidth: maxContentWidth,
        minWidth: 0,
        justifySelf: 'center',
      },
    }),

    ...(isPopup && stepperPopup),

    ...(layout === 'medium' && {
      gridTemplateColumns: hasExtra
        ? `minmax(0, 1fr) ${extraWidth}`
        : 'minmax(0, 1fr)',
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateAreas: hasExtra
        ? `
      "progress progress"
      "content extra"
      "actions ."
      `
        : `
      "progress"
      "content"
      "actions"
      `,
    }),

    ...(layout === 'narrow' && {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateAreas: hasExtra
        ? `
      "progress"
      "content"
      "extra"
      "actions"
    `
        : `
      "progress"
      "content"
      "actions"
    `,
    }),

    ...(!hasStepper && {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: '1fr auto',
      gridTemplateAreas: `
        "content"
        "actions"
      `,
      ...(hasExtra && {
        gridTemplateColumns:
          layout === 'narrow'
            ? 'minmax(0, 1fr)'
            : `minmax(0, 1fr) ${extraWidth}`,
        gridTemplateRows: layout === 'narrow' ? '1fr auto auto' : '1fr auto',
        gridTemplateAreas:
          layout === 'narrow'
            ? `"content" "extra" "actions"`
            : `"content extra" "actions ."`,
      }),
    }),
  }
}
