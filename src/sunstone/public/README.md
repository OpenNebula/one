Sunstone depnedencies
=====================

1. Install nodejs and npm
2. Install the following npm packages:
  `sudo npm install -g bower`
  `sudo npm install -g grunt`
  `sudo npm install -g grunt-cli`
3. Move to the Sunstone public folder and run:
  `npm install`
  `bower install`

Building minified JS and CSS files
==================================

4. Run the following command to generate the app.css file in the css folder:
  `grunt sass`
5. Run the following command to generate the minified js files in the dist foler
and the app.min.css in the css folder:
  `grunt requirejs`

These are the files generate by the grunt requirejs command:
  ```
  css
    app.min.css
  dist
    login.js, login.js.map main.js main.js.map 
    console
      spice.js spice.js.map vnc.js vnc.js.map
  ```

Scons
=====

Scons includes an option to build the minified JS and CSS files. Steps 1, 2 and 3 have to be performed before running this command
  `scons sunstone=yes`

Install.sh
==========

By default the install.sh script will install all the files, including the non-minified ones. Providing the -p option, only the minified files will be installed.