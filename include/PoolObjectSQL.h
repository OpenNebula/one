/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef POOL_OBJECT_SQL_H_
#define POOL_OBJECT_SQL_H_

#include "ObjectSQL.h"
#include "ObjectXML.h"
#include "Template.h"

#include <pthread.h>
#include <string.h>

using namespace std;

class PoolObjectAuth;

/**
 * PoolObject class. Provides a SQL backend interface for Pool components. Each
 * object is identified with and unique OID
 *
 * Note: The PoolObject provides a synchronization mechanism (mutex). This
 * implementation assumes that the mutex IS LOCKED when the class destructor
 * is called.
 */
class PoolObjectSQL : public ObjectSQL, public ObjectXML
{
public:
    /* ---------------------------------------------------------------------- */
    /* Class Constructors & Constants                                         */
    /* ---------------------------------------------------------------------- */

    /**
     *  OpenNebula objects. This definitions are used by other core components
     *  like the AuthZ/AuthN module
     */
    enum ObjectType
    {
        VM          = 0x0000001000000000LL,
        HOST        = 0x0000002000000000LL,
        NET         = 0x0000004000000000LL,
        IMAGE       = 0x0000008000000000LL,
        USER        = 0x0000010000000000LL,
        TEMPLATE    = 0x0000020000000000LL,
        GROUP       = 0x0000040000000000LL,
        ACL         = 0x0000080000000000LL,
        DATASTORE   = 0x0000100000000000LL,
        CLUSTER     = 0x0000200000000000LL,
        DOCUMENT    = 0x0000400000000000LL,
        ZONE        = 0x0000800000000000LL,
        SECGROUP    = 0x0001000000000000LL
    };

    static string type_to_str(ObjectType ob)
    {
        switch (ob)
        {
            case VM:        return "VM" ; break;
            case HOST:      return "HOST" ; break;
            case NET:       return "NET" ; break;
            case IMAGE:     return "IMAGE" ; break;
            case USER:      return "USER" ; break;
            case TEMPLATE:  return "TEMPLATE" ; break;
            case GROUP:     return "GROUP" ; break;
            case ACL:       return "ACL" ; break;
            case DATASTORE: return "DATASTORE" ; break;
            case CLUSTER:   return "CLUSTER" ; break;
            case DOCUMENT:  return "DOCUMENT" ; break;
            case ZONE:      return "ZONE" ; break;
            case SECGROUP:  return "SECGROUP" ; break;
            default:        return "";
        }
    };

    /* ---------------------------------------------------------------------- */

    PoolObjectSQL(int            id,
                  ObjectType    _obj_type,
                  const string& _name,
                  int           _uid,
                  int           _gid,
                  const string& _uname,
                  const string& _gname,
                  const char *  _table)
            :ObjectSQL(),
             ObjectXML(),
             oid(id),
             obj_type(_obj_type),
             name(_name),
             uid(_uid),
             gid(_gid),
             uname(_uname),
             gname(_gname),
             valid(true),
             owner_u(1),
             owner_m(1),
             owner_a(0),
             group_u(0),
             group_m(0),
             group_a(0),
             other_u(0),
             other_m(0),
             other_a(0),
             obj_template(0),
             table(_table)
    {
        pthread_mutex_init(&mutex,0);
    };

    virtual ~PoolObjectSQL()
    {
        pthread_mutex_unlock(&mutex);

        pthread_mutex_destroy(&mutex);
    };

    /* --------------------------------------------------------------------- */

    int get_oid() const
    {
        return oid;
    };

    ObjectType get_type() const
    {
        return obj_type;
    };

    /**
     *  Check if the object name contains invalid characters or exceed the max.
     *  length. By Default these are not allowed "&|:\;/'#{}()$
     *    @param obj_name for this object
     *    @param extra_chars aditional invalid characters to test
     *    @param error_str describing the error
     *    @return true if the name is valid
     */
    static bool name_is_valid(const string& obj_name, const string& extra_chars,
                              string& error_str);

    /**
     *  Check if the object name is valid, no extra characters needed to be
     *  tested.
     */
    static bool name_is_valid(const string& obj_name, string& error_str)
    {
        return name_is_valid(obj_name, "", error_str);
    }

    const string& get_name() const
    {
        return name;
    };

    /**
     *  Set the name of the object and check if it is valid.
     *    @param _name the new name
     *    @param error_str describing the error if any
     *
     *    @return 0 if the name was changed
     */
    int set_name(const string& _name, string& error_str)
    {
        if (!name_is_valid(_name, error_str))
        {
            return -1;
        }

        name = _name;

        return 0;
    };

    int get_uid() const
    {
        return uid;
    };

    int get_gid() const
    {
        return gid;
    };

    const string& get_uname() const
    {
        return uname;
    };

    const string& get_gname() const
    {
        return gname;
    };

    /**
     * Changes the object's owner
     * @param _uid New User ID
     * @param _uname Name of the new user
     */
    void set_user(int _uid, const string& _uname)
    {
        uid   = _uid;
        uname = _uname;
    }

    /**
     * Changes the object's group id
     * @param _gid New Group ID
     * @param _gname Name of the new group
     */
    void set_group(int _gid, const string& _gname)
    {
        gid   = _gid;
        gname = _gname;
    };

    /**
     * Changes the object's permissions
     *
     * @param _owner_u New permission: 1 allow, 0 deny, -1 do not change
     * @param _owner_m New permission: 1 allow, 0 deny, -1 do not change
     * @param _owner_a New permission: 1 allow, 0 deny, -1 do not change
     * @param _group_u New permission: 1 allow, 0 deny, -1 do not change
     * @param _group_m New permission: 1 allow, 0 deny, -1 do not change
     * @param _group_a New permission: 1 allow, 0 deny, -1 do not change
     * @param _other_u New permission: 1 allow, 0 deny, -1 do not change
     * @param _other_m New permission: 1 allow, 0 deny, -1 do not change
     * @param _other_a New permission: 1 allow, 0 deny, -1 do not change
     * @param error_str Returns the error reason, if any
     *
     * @return 0 on success
     */
    virtual int set_permissions(int _owner_u,
                                int _owner_m,
                                int _owner_a,
                                int _group_u,
                                int _group_m,
                                int _group_a,
                                int _other_u,
                                int _other_m,
                                int _other_a,
                                string& error_str);

    /* --------------------------------------------------------------------- */

    /**
     *  Check if the object is valid
     *    @return true if object is valid
     */
    const bool& isValid() const
    {
       return valid;
    };

    /**
     *  Set the object valid flag
     *  @param _valid new valid flag
     */
    void set_valid(const bool _valid)
    {
        valid = _valid;
    };

    /**
     *  Function to lock the object
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the object
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };

    /**
     * Function to print the object into a string in XML format
     * base64 encoded
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    virtual string& to_xml64(string &xml64);

    /**
     * Function to print the object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    virtual string& to_xml(string& xml) const = 0;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    virtual int from_xml(const string &xml_str) = 0;

    // ------------------------------------------------------------------------
    // Template
    // ------------------------------------------------------------------------
    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        const char *              name,
        vector<const Attribute*>& values) const
    {
        return obj_template->get(name,values);
    };

    /**
     *  Gets a string based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined or
     *    not a single attribute
     */
    void get_template_attribute(
        const char * name,
        string&      value) const
    {
        obj_template->get(name,value);
    }

    /**
     *  Gets and removes a string based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined or
     *    not a single attribute
     *    @return the number of attributes erased
     */
    int erase_template_attribute(
        const char * name,
        string&      value)
    {
        obj_template->get(name,value);
        return obj_template->erase(name);
    }

    /**
     *  Gets and removes a float based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a float), will be 0 if not defined or
     *    not a single attribute
     *    @return the number of attributes erased
     */
    int erase_template_attribute(
        const char * name,
        float&       value)
    {
        obj_template->get(name,value);
        return obj_template->erase(name);
    }

    /**
     *  Gets and removes a long long based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a long long), will be 0 if not defined or
     *    not a single attribute
     *    @return the number of attributes erased
     */
    int erase_template_attribute(
        const char * name,
        long long&   value)
    {
        obj_template->get(name,value);
        return obj_template->erase(name);
    }

    /**
     *  Gets and removes a boolean based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a boolean), will be false if not defined or
     *    not a single attribute
     *    @return the number of attributes erased
     */
    int erase_template_attribute(
        const char * name,
        bool&        value)
    {
        obj_template->get(name,value);
        return obj_template->erase(name);
    }

    /**
     *  Gets an int based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (an int), will be 0 if not defined or
     *    not a single attribute
     *
     *    @return True if the Single attribute was found and is a valid integer
     *    value
     */
    bool get_template_attribute(
        const char *    name,
        int&            value) const
    {
        return obj_template->get(name,value);
    }

    /**
     *  Gets a long long based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (long long), will be 0 if not defined or
     *    not a single attribute
     *
     *    @return True if the Single attribute was found and is a valid integer
     *    value
     */
    bool get_template_attribute(
        const char *    name,
        long long&      value) const
    {
        return obj_template->get(name,value);
    }

    /**
     *  Gets a float based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a float), will be 0 if not defined or
     *    not a single attribute
     *
     *    @return True if the Single attribute was found and is a valid float
     *    value
     */
    bool get_template_attribute(
        const char *    name,
        float&          value) const
    {
        return obj_template->get(name,value);
    }

    /**
     *  Gets a boolean attribute (single) (YES = true)
     *    @param name of the attribute
     *    @param value of the attribute (True if "YES", false otherwise)
     *
     *    @return True if the Single attribute was found and is a valid boolean
     *    value
     */
    bool get_template_attribute(
        const char *    name,
        bool&           value) const
    {
        return obj_template->get(name,value);
    }

    /**
     *  Adds a new attribute to the template (replacing it if
     *  already defined), the object's mutex SHOULD be locked
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    int replace_template_attribute(
        const string& name,
        const string& value)
    {
        return obj_template->replace(name, value);
    }

    /**
     *  Removes an attribute from the template. The attributes are returned, and
     *  MUST be freed by the calling funtion
     *    @param name of the attribute
     *    @param values a vector containing a pointer to the attributes
     *    @return the number of attributes removed
     */
    int remove_template_attribute(
        const string&        name,
        vector<Attribute *>& values)
    {
        return obj_template->remove(name, values);
    }

    /**
     *  Generates a XML string for the template of the Object
     *    @param xml the string to store the XML description.
     */
   string&  template_to_xml(string &xml) const
    {
        return obj_template->to_xml(xml);
    }

    /**
     *  Removes an attribute
     *    @param name of the attribute
     */
    int remove_template_attribute(const string& name)
    {
        return obj_template->erase(name);
    }

    /**
     *  Sets an error message with timestamp in the template
     *    @param message Message string
     */
    virtual void set_template_error_message(const string& message);

    /**
     *  Deletes the error message from the template
     */
    virtual void clear_template_error_message();

    /**
     *  Adds a string attribute
     *    @param att_name Name for the attribute
     *    @param att_val Message string
     */
    void add_template_attribute(const string& name, const string& value)
    {
        obj_template->add(name, value);
    }

    /**
     *  Adds an int attribute
     *    @param att_name Name for the attribute
     *    @param att_val integer
     */
    void add_template_attribute(const string& name, int value)
    {
        obj_template->add(name, value);
    }

    /**
     *  Adds a float attribute
     *    @param att_name Name for the attribute
     *    @param att_val integer
     */
    void add_template_attribute(const string& name, float value)
    {
        obj_template->add(name, value);
    }

    /**
     *  Factory method for templates, it should be implemented
     *  by classes that uses templates
     *    @return a new template
     */
    virtual Template * get_new_template() const
    {
        return 0;
    }

    /**
     *  Replace template for this object. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    virtual int replace_template(const string& tmpl_str, bool keep_restricted, string& error);

    /**
     *  Append new attributes to this object's template. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    virtual int append_template(const string& tmpl_str, bool keep_restricted, string& error);

    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes
     *    @param auths to be filled
     */
    virtual void get_permissions(PoolObjectAuth& auths);

protected:

    /**
     *  Callback function to unmarshall a PoolObjectSQL
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names)
    {
        if ( (!values[0]) || (num != 1) )
        {
            return -1;
        }

        return from_xml(values[0]);
    };

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int select(SqlDB *db);

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int select(SqlDB *db, const string& _name, int _uid);

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int drop(SqlDB *db);

    /**
     *  Function to output a pool object into a stream in XML format
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    static int dump(ostringstream& oss, int num, char **values, char **names)
    {
        if ( (!values[0]) || (num != 1) )
        {
            return -1;
        }

        oss << values[0];
        return 0;
    };

    /**
     * Prints the permissions into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& perms_to_xml(string& xml) const;

    /**
     *  Rebuilds the object permissions from the xml. ObjectXML::update_from_str
     *  must be called before this method
     *
     *    @return 0 on success, -1 otherwise
     */
    int perms_from_xml();

    /**
     * Sets the permission attribute to the new_perm value, if it is different
     * from -1
     *
     *   @param perm the permissions attribute, must be -1, 0 or 1, its value
     *   must be checked before
     *   @param new_perm the new value. If it is -1, it will be ignored
     */
    void set_perm(int &perm, const int &new_perm)
    {
        if ( new_perm != -1 )
        {
            perm = new_perm;
        }
    };

    /**
     * Initializes the object's permissions, according to the provided umask.
     *
     * @param umask Permission mask, similar to unix umask.
     * For example a umask of 137 will set the permissions "um- u-- ---"
     */
    void set_umask(int umask);

    /**
     *  Sets an error message with timestamp in the template
     *    @param name of the error attribute
     *    @param message Message string
     */
    virtual void set_template_error_message(const string& name, const string& message);

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    virtual int post_update_template(string& error)
    {
        return 0;
    };

    /**
     *  The object's unique ID
     */
    int     oid;

    /**
     *  The object type
     */
    ObjectType obj_type;

    /**
     *  The object's name
     */
    string  name;

    /**
     *  Object's owner, set it to -1 if owner is not used
     */
    int     uid;

    /**
     *  Object's group, set it to -1 if group is not used
     */
    int     gid;

    /**
     *  Name of the object's owner, empty if owner is not used
     */
    string  uname;

    /**
     *  Name of the object's group,, empty if group is not used
     */
    string  gname;

    /**
     *  The contents of this object are valid
     */
    bool    valid;

    /**
     *  Permissions for the owner user
     */
    int     owner_u;
    int     owner_m;
    int     owner_a;

    /**
     *  Permissions for users in the object's group
     */
    int     group_u;
    int     group_m;
    int     group_a;

    /**
     *  Permissions for the rest
     */
    int     other_u;
    int     other_m;
    int     other_a;

    /**
     *  Template for this object, will be allocated if needed
     */
    Template * obj_template;

private:
    /**
     *  Characters that can not be in a name
     */
    static const string INVALID_NAME_CHARS;

    /**
     *  The PoolSQL, friend to easily manipulate its Objects
     */
    friend class PoolSQL;

    /**
     * The mutex for the PoolObject. This implementation assumes that the mutex
     * IS LOCKED when the class destructor is called.
     */
    pthread_mutex_t mutex;

    /**
     *  Pointer to the SQL table for the PoolObjectSQL
     */
    const char * table;
};

#endif /*POOL_OBJECT_SQL_H_*/
