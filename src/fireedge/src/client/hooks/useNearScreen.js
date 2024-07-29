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
import { useEffect, useState, useRef, RefObject } from 'react'

/**
 * Hook to manage the intersection of a target element with
 * an ancestor element or with a top-level document's viewport.
 *
 * @param {object} props - Props
 * @param {RefObject} props.externalRef - Element to be observed
 * @param {string} props.distance - Margin around the element
 * @param {boolean} props.once - If `true`, the observer will be triggered once
 * @returns {{
 * isNearScreen: boolean,
 * fromRef: RefObject
 * }} - Intersection observer information
 */
const useNearScreen = ({ externalRef, distance, once = true }) => {
  const [isNearScreen, setShow] = useState(false)
  const fromRef = useRef()

  useEffect(() => {
    let observer
    const element = externalRef ? externalRef.current : fromRef.current

    const onChange = (entries) => {
      observer &&
        element &&
        entries.forEach(({ isIntersecting }) => {
          if (isIntersecting) {
            setShow(true)
            once && observer.disconnect()
          } else {
            !once && setShow(false)
          }
        })
    }

    Promise.resolve(
      typeof IntersectionObserver !== 'undefined'
        ? IntersectionObserver
        : import('intersection-observer')
    ).then(() => {
      observer = new IntersectionObserver(onChange, {
        rootMargin: distance,
      })

      if (element) observer.observe(element)
    })

    return () => observer && observer.disconnect()
  })

  return { isNearScreen, fromRef }
}

export default useNearScreen
