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

#include <sqlite3.h>

#include "Template.h"
#include "template_syntax.h"
extern "C" 
{
#include "template_parser.h"
}

#include <iostream>
#include <sstream>

pthread_mutex_t Template::mutex = PTHREAD_MUTEX_INITIALIZER;

Template::~Template()
{
    multimap<string,Attribute *>::iterator  it;

    for ( it = attributes.begin(); it != attributes.end(); it++)
    {
        delete it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C"
{
    int template_parse(Template * tmpl, char ** errmsg);

    void template_lex_destroy();

    YY_BUFFER_STATE template__scan_string(const char * str);

    void template__delete_buffer(YY_BUFFER_STATE);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse(const char * filename, char **error_msg)
{
    int     rc;

    pthread_mutex_lock(&mutex);

    *error_msg = 0;

    template_in = fopen (filename, "r");

    if ( template_in == 0 )
    {
        goto error_open;
    }

    rc = template_parse(this,error_msg);

    fclose(template_in);

    template_lex_destroy();

    pthread_mutex_unlock(&mutex);

    return rc;

error_open:
    *error_msg = strdup("Error opening template file");

    pthread_mutex_unlock(&mutex);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse(const string &parse_str, char **error_msg)
{
    YY_BUFFER_STATE     str_buffer;
    const char *        str;
    int                 rc;
    
    pthread_mutex_lock(&mutex);

    *error_msg = 0;

    str = parse_str.c_str();

    str_buffer = template__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = template_parse(this,error_msg);

    template__delete_buffer(str_buffer);

    template_lex_destroy();

    pthread_mutex_unlock(&mutex);

    return rc;

error_yy:

    *error_msg=strdup("Error setting scan buffer");

    pthread_mutex_unlock(&mutex);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::marshall(string &str, const char delim)
{
    multimap<string,Attribute *>::iterator  it;
    string *                                attr;
 
    for(it=attributes.begin(),str="";it!=attributes.end();it++)
    {
        attr = it->second->marshall();

        if ( attr == 0 )
        {
            continue;
        }

        str += it->first + "=" + *attr + delim;
        
        delete attr;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::get(
    string& name, 
    vector<const Attribute*>& values) const
{
    multimap<string, Attribute *>::const_iterator       i;
    pair<multimap<string, Attribute *>::const_iterator,
    multimap<string, Attribute *>::const_iterator>      index;        
    int                                                 j;

    index = attributes.equal_range(name);

    for ( i = index.first,j=0 ; i != index.second ; i++,j++ )
    {
        values.push_back(i->second);
    }

    return j;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::get(
        string& name,
        string& value) const
{
    vector<const Attribute *>   attrs;
    const SingleAttribute *     sattr;
    int                         rc;

    transform (name.begin(),name.end(),name.begin(),(int(*)(int))toupper);

    rc = get(name,attrs);

    if  (rc == 0)
    {
        value = "";
        return;
    }
    
    sattr = dynamic_cast<const SingleAttribute *>(attrs[0]);

    if ( sattr != 0 )
    {
        value = sattr->value();    
    }
    else
    {
        value="";
    }                
}        

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::get(
        string& name,
        int&    value) const
{
    string sval;

    get(name, sval);

    if ( sval == "" )
    {
        value = 0;
        return;
    }

    istringstream iss(sval);

    iss >> value;   
}        

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator << (ostream& os, Template& t)
{
    multimap<string,Attribute *>::iterator  it;
    string *                                s;
    size_t									pos;
        
    for ( it = t.attributes.begin(); it!=t.attributes.end(); it++)
    {
        s = it->second->marshall();
        
        pos = s->find("\n");
        
        while (pos != string::npos)
        {
        	s->replace(pos++,1," ");
        	pos = s->find("\n",pos);
        }

        os << endl << "\t" << it->first << t.separator << *s;

        delete s;
    }
        
    return os;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
