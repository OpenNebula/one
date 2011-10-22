/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "PoolObjectSQL.h"
#include "SSLTools.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& PoolObjectSQL::to_xml64(string &xml64)
{
    string *str64;
    
    to_xml(xml64);

    str64 = SSLTools::base64_encode(xml64);
   
    xml64 = *str64;

    delete str64;

    return xml64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db, const string& _name, int _uid)
{
    ostringstream oss;

    int rc;
    char * sql_name;

    sql_name = db->escape_str(_name.c_str());

    if ( sql_name == 0 )
    {
        return -1;
    }

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE name = '" << sql_name << "'";

    if ( _uid != -1 )
    {
        oss << " AND uid = " << _uid;
    }

    name  = "";
    uid   = -1;

    rc = db->exec(oss, this);

    unset_callback();

    db->free_str(sql_name);

    if ((rc != 0) || (_name != name) || (_uid != uid))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::drop(SqlDB *db)
{
    ostringstream oss;
    int rc;

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * PoolObjectSQL::error_attribute_name = "ERROR";

void PoolObjectSQL::set_template_error_message(const string& message)
{
    VectorAttribute *  attr;
    map<string,string> error_value;
    
    char   str[26];
    time_t the_time;

    the_time = time(NULL);

#ifdef SOLARIS
    ctime_r(&(the_time),str,sizeof(char)*26);
#else
    ctime_r(&(the_time),str);
#endif

    str[24] = '\0'; // Get rid of final enter character

    error_value.insert(make_pair("TIMESTAMP",str));
    error_value.insert(make_pair("MESSAGE",message));

    attr = new VectorAttribute(error_attribute_name,error_value);

    obj_template->set(attr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::replace_template(const string& tmpl_str, string& error)
{
    Template * new_tmpl  = get_new_template();
    char *     error_msg = 0;

    if ( new_tmpl == 0 )
    {
        error = "Can not allocate a new template";
        return -1;
    }
    
    if ( new_tmpl->parse(tmpl_str, &error_msg) != 0 )
    {
        ostringstream oss;
        
        oss << "Parse error";
         
        if (error_msg != 0)
        {
            oss << ": " << error_msg;
        }
        
        error = oss.str();

        return -1;
    }

    delete obj_template;

    obj_template = new_tmpl;

    return 0;
} 

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

