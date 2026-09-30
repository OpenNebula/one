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

import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { CodeSnippet, StepList } from '@ComponentsModule'
import { getAboutStyles } from '@modules/resources/OneKs/Details/Application/Tabs/styles'

const text = (value) => (typeof value === 'string' ? value : '')
const codeForRelease = (code, releaseName) =>
  releaseName ? code.replace(/\$\{releaseName\}/g, () => releaseName) : code

/**
 * @param {object} props - About block properties
 * @param {object} props.section - About block from application metadata
 * @param {string} props.releaseName - Installed release name
 * @returns {object} About block with optional numbered steps
 */
const AboutSection = ({ section, releaseName }) => {
  const title = text(section?.title)
  const description = text(section?.description)
  const steps = (Array.isArray(section?.steps) ? section.steps : [])
    .filter((step) => step && typeof step === 'object')
    .map((step) => ({
      title: text(step.title),
      description: text(step.description),
      code: codeForRelease(text(step.code), releaseName),
    }))
    .filter((step) => step.title || step.description || step.code)

  if (!title && !description && !steps.length) return null

  return (
    <Box sx={(theme) => getAboutStyles({ theme })}>
      {title && <Typography variant="h6">{title}</Typography>}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          whiteSpace="pre-line"
        >
          {description}
        </Typography>
      )}
      {!!steps.length && (
        <StepList
          variant="timeline"
          items={steps.map((step, index) => (
            <Box key={index} className="about-step">
              {step.title && (
                <Typography variant="subtitle2">{step.title}</Typography>
              )}
              {step.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  whiteSpace="pre-line"
                >
                  {step.description}
                </Typography>
              )}
              {step.code && <CodeSnippet code={step.code} />}
            </Box>
          ))}
        />
      )}
    </Box>
  )
}

AboutSection.propTypes = {
  section: PropTypes.object,
  releaseName: PropTypes.string,
}

/**
 * @param {object} props - About content properties
 * @param {object[]} props.sections - Metadata about blocks
 * @param {string} props.releaseName - Installed release name
 * @returns {object} Application about sections
 */
export const About = ({ sections, releaseName }) =>
  (Array.isArray(sections) ? sections : [])
    .filter((section) => section && typeof section === 'object')
    .map((section, index) => (
      <AboutSection key={index} section={section} releaseName={releaseName} />
    ))

About.displayName = 'About'
About.propTypes = {
  sections: PropTypes.array,
  releaseName: PropTypes.string,
}
