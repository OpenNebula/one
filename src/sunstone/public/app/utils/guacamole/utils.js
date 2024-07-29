/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function() {

  /**
   * Create a new function that limits calls to func to once every given time frame.
   * 
   * @param {*} func Throttled function
   * @param {*} delay Time delay between calls
   */
  function throttle(func, delay) {
    var wait = false;
  
    return function() {
      if (!wait) {
        func();
        wait = true;
  
        setTimeout(function() {
          wait = false;
        }, delay)
      }
    }
  }

  // A function to modify the property's getters and 
  // setters so that a custom callback handler can be run in the main
  // program each time the property is changed
  function observe(subject, property, callbackHandler) {
    Object.defineProperty(subject, property, {
      // Return the default value of the property
      // ("this.value" automatically gives you the property's current value)
      get: function() {
        return this.value;
      },
  
      // Set the property with a new value
      set: function(newValue) {
        // Assign the new value
        this.value = newValue;
  
        // Bind the observer's changeHandler to the subject
        subject.changeHandler = callbackHandler;
  
        // Tell the subject to call the changeHandler when this property is changed.
        // (This is like a custom event dispatcher)
        subject.changeHandler(newValue)
      },
  
      // Set the default parameters for how this property can be accessed and changed.
      // You probably don't need to change these unless you want to lock down the 
      // property values to prevent your program from changing them
      enumerable: true,
      configurable: true,
      writeable: true
    });
  }

  // An optional function to stop watching properties.
  // It normalizes the getter and setter and removes the callback handler
  function unobserve(subject, property) {
    // Delete the changeHandler
    delete subject.changeHandler;

    // Reset the getter and setter
    Object.defineProperty(subject, property, {
      get: function() {
        return this.value;
      },
      set: function(newValue) {
        this.value = newValue;
      },
      enumerable: true,
      configurable: true,
      writeable: true
    });
  }

  var Utils = {
    throttle: throttle,
    observe: observe,
    unobserve: unobserve
  }

  return Utils;

});