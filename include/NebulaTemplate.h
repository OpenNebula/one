/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#ifndef NEBULA_TEMPLATE_H_
#define NEBULA_TEMPLATE_H_

#include "Template.h"
#include <map>

class NebulaTemplate : public Template
{    
public:

    NebulaTemplate(string& nebula_location);
    
    ~NebulaTemplate(){};

    static const char * conf_name;
    
    int get(
        const char * name, 
        vector<const Attribute*>& values) const
    {
        string _name(name);
        
        return Template::get(_name,values);   
    };
       
private:
    friend class Nebula;
    
    string                  conf_file;
    
    map<string, Attribute*> conf_default;
    
    int load_configuration();
};


#endif /*NEBULA_TEMPLATE_H_*/
