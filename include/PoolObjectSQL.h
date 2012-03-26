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
        CLUSTER     = 0x0000200000000000LL
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

    const string& get_name() const
    {
        return name;
    };

    int get_uid() const
    {
        return uid;
    };

    int get_gid() const
    {
        return gid;
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
     *  Gets an removes a string based attribute (single)
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
     *  Gets an int based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (an int), will be 0 if not defined or
     *    not a single attribute
     */
    void get_template_attribute(
        const char *    name,
        int&            value) const
    {
        obj_template->get(name,value);
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
        SingleAttribute * sattr = new SingleAttribute(name,value);

        obj_template->erase(sattr->name());

        obj_template->set(sattr);

        return 0;
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
     *  Removes an Image attribute
     *    @param name of the attribute
     */
    int remove_template_attribute(const string& name)
    {
        return obj_template->erase(name);
    }

    /**
     *  Sets an error message for the VM in the template
     *    @param message
     *    @return 0 on success
     */
    void set_template_error_message(const string& message);

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
     *    @param tmpl string representation of the template
     */
    virtual int replace_template(const string& tmpl_str, string& error);


    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes
     *    @param auths to be filled
     */
    void get_permissions(PoolObjectAuth& auths);

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

    /**
     *  Name for the error messages attribute
     */
    static const char * error_attribute_name;
};

#endif /*POOL_OBJECT_SQL_H_*/
