/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include <string>
#include <memory>

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
        NONE           = 0x0000000000000000LL,
        VM             = 0x0000001000000000LL,
        HOST           = 0x0000002000000000LL,
        NET            = 0x0000004000000000LL,
        IMAGE          = 0x0000008000000000LL,
        USER           = 0x0000010000000000LL,
        TEMPLATE       = 0x0000020000000000LL,
        GROUP          = 0x0000040000000000LL,
        ACL            = 0x0000080000000000LL,
        DATASTORE      = 0x0000100000000000LL,
        CLUSTER        = 0x0000200000000000LL,
        DOCUMENT       = 0x0000400000000000LL,
        ZONE           = 0x0000800000000000LL,
        SECGROUP       = 0x0001000000000000LL,
        VDC            = 0x0002000000000000LL,
        VROUTER        = 0x0004000000000000LL,
        MARKETPLACE    = 0x0008000000000000LL,
        MARKETPLACEAPP = 0x0010000000000000LL,
        VMGROUP        = 0x0020000000000000LL,
        VNTEMPLATE     = 0x0040000000000000LL,
        HOOK           = 0x0080000000000000LL,
        BACKUPJOB      = 0x0100000000000000LL,
        SCHEDULEDACTION= 0x0200000000000000LL
    };

    /**
     *  OpenNebula objects. This definitions are used for define the level of lock
     */
    enum LockStates
    {
        ST_NONE      = 0,
        ST_USE       = 1,
        ST_MANAGE    = 2,
        ST_ADMIN     = 3
    };

    static const long int LockableObject;

    static std::string type_to_str(ObjectType ob)
    {
        switch (ob)
        {
            case VM:             return "VM"; break;
            case HOST:           return "HOST"; break;
            case NET:            return "NET"; break;
            case IMAGE:          return "IMAGE"; break;
            case USER:           return "USER"; break;
            case TEMPLATE:       return "TEMPLATE"; break;
            case GROUP:          return "GROUP"; break;
            case ACL:            return "ACL"; break;
            case DATASTORE:      return "DATASTORE"; break;
            case CLUSTER:        return "CLUSTER"; break;
            case DOCUMENT:       return "DOCUMENT"; break;
            case ZONE:           return "ZONE"; break;
            case SECGROUP:       return "SECGROUP"; break;
            case VDC:            return "VDC"; break;
            case VROUTER:        return "VROUTER"; break;
            case MARKETPLACE:    return "MARKETPLACE"; break;
            case MARKETPLACEAPP: return "MARKETPLACEAPP"; break;
            case VMGROUP:        return "VMGROUP"; break;
            case VNTEMPLATE:     return "VNTEMPLATE"; break;
            case HOOK:           return "HOOK"; break;
            case BACKUPJOB:      return "BACKUPJOB"; break;
            default:             return "";
        }
    };

    static ObjectType str_to_type(const std::string& type)
    {
        if ( type == "VM" )                  return VM;
        else if ( type == "HOST" )           return HOST;
        else if ( type == "NET" )            return NET;
        else if ( type == "IMAGE" )          return IMAGE;
        else if ( type == "USER" )           return USER;
        else if ( type == "TEMPLATE" )       return TEMPLATE;
        else if ( type == "GROUP" )          return GROUP;
        else if ( type == "ACL" )            return ACL;
        else if ( type == "DATASTORE" )      return DATASTORE;
        else if ( type == "CLUSTER" )        return CLUSTER;
        else if ( type == "DOCUMENT" )       return DOCUMENT;
        else if ( type == "ZONE" )           return ZONE;
        else if ( type == "SECGROUP" )       return SECGROUP;
        else if ( type == "VDC" )            return VDC;
        else if ( type == "VROUTER" )        return VROUTER;
        else if ( type == "MARKETPLACE" )    return MARKETPLACE;
        else if ( type == "MARKETPLACEAPP" ) return MARKETPLACEAPP;
        else if ( type == "VMGROUP" )        return VMGROUP;
        else if ( type == "VNTEMPLATE" )     return VNTEMPLATE;
        else if ( type == "HOOK" )           return HOOK;
        else if ( type == "BACKUPJOB" )      return BACKUPJOB;
        else                                 return NONE;
    };

    static std::string lock_state_to_str(LockStates ob)
    {
        switch (ob)
        {
            case ST_NONE:        return "NONE"; break;
            case ST_USE:         return "USE"; break;
            case ST_MANAGE:      return "MANAGE"; break;
            case ST_ADMIN:       return "ADMIN"; break;
            default:             return "";
        }
    };

    /* ---------------------------------------------------------------------- */

    PoolObjectSQL(int                id,
                  ObjectType         _obj_type,
                  const std::string& _name,
                  int                _uid,
                  int                _gid,
                  const std::string& _uname,
                  const std::string& _gname,
                  const char *       _table)
            :ObjectSQL(),
             ObjectXML(),
             oid(id),
             obj_type(_obj_type),
             name(_name),
             uid(_uid),
             gid(_gid),
             uname(_uname),
             gname(_gname),
             owner_u(1),
             owner_m(1),
             owner_a(0),
             group_u(0),
             group_m(0),
             group_a(0),
             other_u(0),
             other_m(0),
             other_a(0),
             locked(LockStates::ST_NONE),
             lock_owner(-1),
             lock_req_id(-1),
             lock_time(0),
             ro(false),
             _mutex(nullptr),
             table(_table)
    {
    };

    virtual ~PoolObjectSQL()
    {
        if (!ro && _mutex != nullptr)
        {
            _mutex->unlock();
        }
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
    static bool name_is_valid(const std::string& obj_name,
                              const std::string& extra_chars,
                              std::string& error_str);

    /**
     *  Check if the object name is valid, no extra characters needed to be
     *  tested.
     */
    static bool name_is_valid(const std::string& obj_name,
                              std::string& error_str)
    {
        return name_is_valid(obj_name, "", error_str);
    }

    const std::string& get_name() const
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
    int set_name(const std::string& _name, std::string& error_str)
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

    const std::string& get_uname() const
    {
        return uname;
    };

    const std::string& get_gname() const
    {
        return gname;
    };

    /**
     * Changes the object's owner
     * @param _uid New User ID
     * @param _uname Name of the new user
     */
    void set_user(int _uid, const std::string& _uname)
    {
        uid   = _uid;
        uname = _uname;
    }

    /**
     * Changes the object's group id
     * @param _gid New Group ID
     * @param _gname Name of the new group
     */
    void set_group(int _gid, const std::string& _gname)
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
                                std::string& error_str);

    /**
     * Function to print the object into a string in XML format
     * base64 encoded
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    virtual std::string& to_xml64(std::string &xml64);

    /**
     * Function to print the object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    virtual std::string& to_xml(std::string& xml) const = 0;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    virtual int from_xml(const std::string &xml_str) = 0;

    // ------------------------------------------------------------------------
    // Template
    // ------------------------------------------------------------------------
    /**
     *  Gets the first VectorAttribute of the specified type with the given name.
     *  Const and non-const versions of this method is provided
     *    @param name the attribute name.
     *    @return true first attribute or 0 if not found or wrong type
     */
    const VectorAttribute * get_template_attribute(const std::string& s) const
    {
        return obj_template->get(s);
    }

    VectorAttribute * get_template_attribute(const std::string& s)
    {
        return obj_template->get(s);
    }

    /**
     *  Gets the values of a template attribute, as a list of VectorAttributes
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    template<typename T>
    int get_template_attribute(const std::string& name,
                               std::vector<const T*>& values) const
    {
        return obj_template->get(name, values);
    };

    /**
     *  These methods gets the value of a SingleAttribute and converts it to the
     *  target type
     *    @param name of the attribute
     *    @param value of the attribute, will be ""/0/false if not defined or
     *    not a single attribute
     *
     *    @return true if the attribute was found and is a valid type for the
     *    target value
     */
    template<typename T>
    bool get_template_attribute(const std::string& name, T& value) const
    {
        return obj_template->get(name, value);
    }

    /**
     *  These methods get and remove a string based attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be ""/0/false if not
     *    defined or  not a single attribute, depending on the target value type
     *    @return the number of attributes erased
     */
    template<typename T>
    int erase_template_attribute(const std::string& name, T& value)
    {
        obj_template->get(name, value);
        return obj_template->erase(name);
    }

    /**
     *  Adds a new attribute to the template (replacing it if
     *  already defined), the object's mutex SHOULD be locked
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    template<typename T>
    int replace_template_attribute(const std::string& name, const T& value)
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
    template<typename T>
    int remove_template_attribute(const std::string& n, std::vector<T *>& v)
    {
        return obj_template->remove(n, v);
    }

    /**
     *  Generates a XML string for the template of the Object
     *    @param xml the string to store the XML description.
     */
    std::string& template_to_xml(std::string &xml) const
    {
        return obj_template->to_xml(xml);
    }

    /**
     *  Removes an attribute
     *    @param name of the attribute
     */
    int remove_template_attribute(const std::string& name)
    {
        return obj_template->erase(name);
    }

    /**
     *  Sets an error message with timestamp in the template
     *    @param message Message string
     */
    virtual void set_template_error_message(const std::string& message);

    /**
     *  Deletes the error message from the template
     */
    virtual void clear_template_error_message();

    /**
     *  Adds a string attribute
     *    @param att_name Name for the attribute
     *    @param att_val Message string
     */
    template<typename T>
    void add_template_attribute(const std::string& name, const T& value)
    {
        obj_template->add(name, value);
    }

    template<typename T>
    void add_template_attribute(std::vector<T *>& values)
    {
        obj_template->set(values);
    }

    /**
     *  Factory method for templates, it should be implemented
     *  by classes that uses templates
     *    @return a new template
     */
    virtual std::unique_ptr<Template> get_new_template() const
    {
        return nullptr;
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
    virtual int replace_template(const std::string& tmpl_str,
                                 bool keep_restricted,
                                 std::string& error);

    /**
     *  Append new attributes to this object's template. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    virtual int append_template(const std::string& tmpl_str,
                                bool keep_restricted,
                                std::string& error);

    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes
     *    @param auths to be filled
     */
    virtual void get_permissions(PoolObjectAuth& auths);

    /**
     * Tries to get the DB lock. This is a mutex requested by external
     * applications, not related to the internal mutex lock. The object
     * must be locked (internal memory mutex) before this method is called
     *
     * @param owner String to identify who requested the lock
     *
     * @return 0 if the lock was granted, -1 if the object is already locked
     */
    int lock_db(const int owner,
                const int req_id,
                const int level,
                const bool is_admin);

    /**
     * Unlocks the DB lock for external applications. The object must be locked
     * (internal memory mutex) before this method is called
     *
     * @param owner String to identify who requested the lock. -1 to bypass check
     * @return 0 if object was unlocked -1 otherwise (owner != lock_owner)
     */
    int unlock_db(const int owner, const int req_id);

    /**
     * Unlocks the DB lock for external applications. The object must be locked
     * (internal memory mutex) before this method is called
     *
     * @param owner String to identify who requested the lock
     */
    LockStates get_lock_state() const
    {
        return locked;
    }

    /**
     * Checks if the object is currently locked
     *
     * @return 0 if not locked, return -1 if locked and fill the variable time
     *      with the current locked time
     */
    int test_lock_db(std::string& time)
    {
        if ( locked != LockStates::ST_NONE )
        {
            time = std::to_string(lock_time);

            return -1;
        }

        return 0;
    }

    /**
     *  Encrypt all secret attributes
     */
    virtual void encrypt();

    /**
     *  Decrypt all secret attributes
     */
    virtual void decrypt();

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
    int select(SqlDB *db) override;

    /**
     *  Reads the PoolObjectSQL (identified by its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int select(SqlDB *db, const std::string& _name, int _uid);

    /**
     *  Search oid by its name and owner
     *    @param db pointer to the db
     *    @param _table for the objects
     *    @param _name of the object
     *    @param _uid of owner
     *    @return -1 if not found or oid otherwise
     */
    static int select_oid(SqlDB *db, const char * _table, const std::string& _name,
            int _uid);

    /**
     *  Check if the object exists
     *    @param db pointer to the db
     *    @param _table for the objects
     *    @param _oid of the object
     *
     *    @return -1 if not found or oid otherwise
     */
    static int exist(SqlDB *db, const char * _table, int _oid);

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db) override;

    /**
     *  Function to output a pool object into a stream in XML format
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    static int dump(std::ostringstream& oss, int num, char **values, char **names)
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
    std::string& perms_to_xml(std::string& xml) const;

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
    virtual void set_template_error_message(const std::string& name,
                                            const std::string& message);

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    virtual int post_update_template(std::string& error)
    {
        return 0;
    };

    /**
     * Prints the lock info into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& lock_db_to_xml(std::string& xml) const;

    /**
     *  Rebuilds the lock info from the xml. ObjectXML::update_from_str
     *  must be called before this method
     *
     *    @return 0 on success, -1 otherwise
     */
    int lock_db_from_xml();


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
    std::string  name;

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
    std::string  uname;

    /**
     *  Name of the object's group,, empty if group is not used
     */
    std::string  gname;

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
    std::unique_ptr<Template> obj_template;

    /**
     *  Flag for the DB lock
     */
    LockStates    locked;

    /**
     *  Owner of the DB lock
     */
    int  lock_owner;

    /**
     *  Owner of the DB lock
     */
    int  lock_req_id;

    /**
     *  Expiration time for the DB lock
     */
    time_t  lock_time;

    /**
     * Attribute for check if is a read only object
     */
    bool  ro;

private:
    /**
     *  Characters that can not be in a name
     */
    static const std::string INVALID_NAME_CHARS;

    /**
     * Expiration time for the lock stored in the DB
     */
    static const int LOCK_DB_EXPIRATION;

    /**
     *  The PoolSQL, friend to easily manipulate its Objects
     */
    friend class PoolSQL;

    /**
     * The mutex for the PoolObject. This implementation assumes that the mutex
     * IS LOCKED when the class destructor is called.
     */
    std::mutex * _mutex;

    /**
     *  Pointer to the SQL table for the PoolObjectSQL
     */
    const char * table;
};

#endif /*POOL_OBJECT_SQL_H_*/
