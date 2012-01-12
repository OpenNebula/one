#!/usr/bin/js
/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

if (!arguments[0] || !arguments[1]){
    print("Usage: upgrade_translation.js <old_translation> <empty_template> > <new_translation>");
    quit();
};

var from = arguments[0];
var to = arguments[1];

load(from);
var tr="";
var locale_old= {};
for (tr in locale){
    locale_old[tr] = locale[tr];
};

var lang_old = lang;
var dt_lang_old = datatable_lang

load(to);
for (tr in locale){
    if (locale_old[tr]){
        locale[tr] = locale_old[tr]
    };
};

print("//Translated by");
print('lang="'+lang_old+'"');
print('datatable_lang="'+dt_lang_old+'"');
print("locale={");

for (tr in locale){
    print('    "'+tr+'":"'+locale[tr]+'",');
};

print("};");