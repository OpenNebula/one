Sunstone dependencies
=====================

1. Install nodejs and npm
2. Install the following npm packages:

  ```
  sudo npm install -g bower
  sudo npm install -g grunt
  sudo npm install -g grunt-cli
  ```

3. Move to the Sunstone public folder and run:

  ```
  npm install
  bower install
  ```

Building minified JS and CSS files
==================================

The dependencies defined in the previous section must be instaled before running these commands:

Option A - Grunt
----------------

* Run the following command to generate the app.css file in the css folder:

  ```
  grunt sass
  ```

* Run the following command to generate the minified js files in the dist foler
and the app.min.css in the css folder:

  ```
  grunt requirejs
  ```

These are the files generate by the grunt requirejs command:

  ```
  css
    app.min.css
  dist
    login.js, login.js.map main.js main.js.map
    console
      spice.js spice.js.map vnc.js vnc.js.map
  ```

Option B - Scons
----------------

Scons includes an option to build the minified JS and CSS files. 

  ```
  scons sunstone=yes
  ```

Install.sh
==========

By default the install.sh script will install all the files, including the non-minified ones. Providing the -p option, only the minified files will be installed.

Documentation
=============

[JSDoc](http://usejsdoc.org/) is used for the JS documentation.

Examples
--------

* Parameters with properties

  ```
  /**
   * Assign the project to an employee.
   * @param {Object} employee - The employee who is responsible for the project.
   * @param {string} employee.name - The name of the employee.
   * @param {string} employee.department - The employee's department.
   */
  Project.prototype.assign = function(employee) {
      // ...
  };
  ```

* Optional parameter

  ```
  /**
   * @param {string} [somebody] - Somebody's name.
   */
  function sayHello(somebody) {
      if (!somebody) {
          somebody = 'John Doe';
      }
      alert('Hello ' + somebody);
  }
  ```
  
* Returns

  ```
  /**
   * Returns the sum of a and b
   * @param {Number} a
   * @param {Number} b
   * @param {Boolean} retArr If set to true, the function will return an array
   * @returns {Number|Array} Sum of a and b or an array that contains a, b and the sum of a and b.
   */
  function sum(a, b, retArr) {
      if (retArr) {
          return [a, b, a + b];
      }
      return a + b;
  }
  ```

