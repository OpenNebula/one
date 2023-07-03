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

#ifndef REQUEST_H_
#define REQUEST_H_

#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/registry.hpp>

#include "RequestManager.h"
#include "AuthRequest.h"
#include "PoolObjectSQL.h"
#include "Quotas.h"
#include "UserPool.h"

/**
 * This class represents the dynamic attributes: specific for a request of the
 * same method.
 */
struct RequestAttributes
{
public:
    int uid;                  /**< id of the user */
    int gid;                  /**< id of the user's group */

    std::string uname;        /**< name of the user */
    std::string gname;        /**< name of the user's group */

    std::string password;     /**< password of the user */

    std::set<int> group_ids;  /**< set of user's group ids */

    std::string session;      /**< Session from ONE XML-RPC API */
    int    req_id;            /**< Request ID for log messages */

    int umask;                /**< User umask for new objects */

    xmlrpc_c::value * retval; /**< Return value from libxmlrpc-c */
    std::string retval_xml;   /**< Return value in XML format */
    std::string extra_xml;    /**< Extra information returned for API Hooks */

    PoolObjectSQL::ObjectType resp_obj; /**< object type */
    int                       resp_id;  /**< Id of the object */
    std::string               resp_msg; /**< Additional response message */

    uint64_t replication_idx;

    AuthRequest::Operation auth_op;   /**< Auth operation for the request */

    bool success; /**< True if the call was successfull false otherwise */

    RequestAttributes(AuthRequest::Operation api_auth_op)
        : uid(-1)
        , gid(-1)
        , req_id(-1)
        , umask(0)
        , retval(nullptr)
        , resp_obj(PoolObjectSQL::NONE)
        , resp_id(-1)
        , replication_idx(UINT64_MAX)
        , auth_op(api_auth_op)
        , success(false)
    {}

    RequestAttributes(AuthRequest::Operation api_auth_op,
                      int _uid,
                      int _gid,
                      PoolObjectSQL::ObjectType object_type)
        : uid(_uid)
        , gid(_gid)
        , req_id(-1)
        , umask(0)
        , retval(nullptr)
        , resp_obj(object_type)
        , resp_id(-1)
        , replication_idx(UINT64_MAX)
        , auth_op(api_auth_op)
        , success(false)
    {}

    RequestAttributes(const RequestAttributes& ra) = default;

    RequestAttributes(int _uid, int _gid, const RequestAttributes& ra)
        : uid(_uid)
        , gid(_gid)
        , uname()
        , gname()
        , password()
        , group_ids(ra.group_ids)
        , session(ra.session)
        , req_id(ra.req_id)
        , umask(ra.umask)
        , retval(ra.retval)
        , retval_xml(ra.retval_xml)
        , extra_xml()
        , resp_obj(PoolObjectSQL::NONE)
        , resp_id(-1)
        , resp_msg()
        , replication_idx(UINT64_MAX)
        , auth_op(ra.auth_op)
        , success(ra.success)
    {}

    bool is_admin() const
    {
        return uid == UserPool::ONEADMIN_ID ||
            group_ids.count(GroupPool::ONEADMIN_ID) == 1;
    }

    bool is_oneadmin() const
    {
        return uid == UserPool::ONEADMIN_ID;
    }

    bool is_oneadmin_group() const
    {
        return gid == GroupPool::ONEADMIN_ID;
    }

    /**
     *  Set the operation level (admin, manage or use) associated to this
     *  request. Precedence is: user > group > system.
     *
     *  @param action perfomed on the VM object
     */
    void set_auth_op(VMActions::Action action);
};

class ParamList
{
public:

    ParamList(const xmlrpc_c::paramList * paramList,
              const std::set<int>& hidden):
        _paramList(paramList), _hidden(hidden){};

    std::string& to_string(std::string& str) const
    {
        std::ostringstream oss;

        oss << get_value_as_string(0);

        for (unsigned int i = 1; i < _paramList->size(); i++)
        {
            oss << " " << get_value_as_string(i);
        }

        str = oss.str();

        return str;
    };

    std::string get_value_as_string(int index) const
    {
        if ( index == 0 || _hidden.count(index) == 1 )
        {
            return "****";
        }

        std::ostringstream oss;
        xmlrpc_c::value::type_t type((*_paramList)[index].type());

        if( type == xmlrpc_c::value::TYPE_INT)
        {
            oss << _paramList->getInt(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_I8 )
        {
            oss << _paramList->getI8(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_BOOLEAN )
        {
            oss << _paramList->getBoolean(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_STRING )
        {
            oss << _paramList->getString(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_DOUBLE )
        {
            oss << _paramList->getDouble(index);
            return oss.str();
        }

        return oss.str();
    };

    int size() const
    {
        return _paramList->size();
    };

private:
    const xmlrpc_c::paramList * _paramList;

    const std::set<int>& _hidden;
};

/**
 *  The Request Class represents the basic abstraction for the OpenNebula
 *  XML-RPC API. This interface must be implemented by any XML-RPC API call
 */
class Request: public xmlrpc_c::method2
{
public:
    /**
     *  Error codes for the XML-RPC API
     */
    enum ErrorCode {
        SUCCESS        = 0x00000,
        AUTHENTICATION = 0x00100,
        AUTHORIZATION  = 0x00200,
        NO_EXISTS      = 0x00400,
        ACTION         = 0x00800,
        XML_RPC_API    = 0x01000,
        INTERNAL       = 0x02000,
        ALLOCATE       = 0x04000,
        LOCKED         = 0x08000,
        REPLICATION    = 0x10000
    };

    /**
     *  Gets a string representation for the Auth object in the
     *  request.
     *    @param ob object for the auth operation
     *    @return string equivalent of the object
     */
    static std::string object_name(PoolObjectSQL::ObjectType ob);

    /**
     *  Sets the format string to log xml-rpc method calls. The format string
     *  interprets the following sequences:
     *    %i -- request id
     *    %m -- method name
     *    %u -- user id
     *    %U -- user name
     *    %l -- param list
     *    %p -- user password
     *    %g -- group id
     *    %G -- group name
     *    %a -- auth token
     *    %A -- client IP address (only IPv4)
     *    %a -- client port (only IPv4)
     *    %% -- %
     */
    static void set_call_log_format(const std::string& log_format)
    {
        format_str = log_format;
    }

    /**
     *  Performs a basic quota check for this request using the uid/gid
     *  from the request. Usage counters are updated for the user/group.
     *  On case of error, the failure_response return values is not set, instead
     *  the error reason is returned in error_str
     *
     *    @param tmpl describing the object
     *    @param object type of the object
     *    @param att the specific request attributes
     *
     *    @param error_str Error reason, if any
     *    @return true if the user is authorized.
     */
    static bool quota_authorization(Template * tmpl, Quotas::QuotaType qtype,
        const RequestAttributes& att, std::string& error_str);

    /**
     *  Performs rollback on usage counters for a previous  quota check operation
     *  for the request.
     *    @param tmpl describing the object
     *    @param att the specific request attributes
     */
    static void quota_rollback(Template * tmpl, Quotas::QuotaType qtype,
        const RequestAttributes& att);

    static std::string failure_message(ErrorCode ec, RequestAttributes& att,
        const std::string& method_name,
        PoolObjectSQL::ObjectType auth_object = PoolObjectSQL::NONE);

    /**
     *  Performs a basic authorization for this request using the uid/gid
     *  from the request. The function gets the object from the pool to get
     *  the public attribute and its owner. The authorization is based on
     *  object and type of operation for the request.
     *    @param pool object pool
     *    @param oid of the object, can be -1 for objects to be created, or
     *    pools.
     *    @param att the specific request attributes
     *
     *    @return SUCCESS if the user is authorized.
     */
    static ErrorCode basic_authorization(
            PoolSQL*                pool,
            int                     oid,
            PoolObjectSQL::ObjectType auth_object,
            RequestAttributes&      att);

protected:
    /* ---------------------------------------------------------------------- */
    /* Global configuration attributes por API calls                          */
    /* ---------------------------------------------------------------------- */
    static std::string format_str;
    static const long long xmlrpc_timeout; //Timeout (ms) for request forwarding

    /* ---------------------------------------------------------------------- */
    /* Static Request Attributes: shared among request of the same method     */
    /* ---------------------------------------------------------------------- */
    PoolSQL *     pool;
    std::string   method_name;

    // Configuration for authentication level of the API call
    PoolObjectSQL::ObjectType auth_object = PoolObjectSQL::ObjectType::NONE;
    AuthRequest::Operation    auth_op = AuthRequest::NONE;

    VMActions::Action vm_action;

    // Logging configuration fot the API call
    std::set<int> hidden_params;
    bool          log_method_call;

    // Method can be only execute by leaders or solo servers
    bool leader_only;

    // Method can be executed in disabled state
    bool zone_disabled;

    /* ---------------------------------------------------------------------- */
    /* Class Constructors                                                     */
    /* ---------------------------------------------------------------------- */
    Request(const std::string& mn,
            const std::string& signature,
            const std::string& help)
        : pool(nullptr)
        , method_name(mn)
        , vm_action(VMActions::NONE_ACTION)
        , log_method_call(true)
        , leader_only(true)
        , zone_disabled(false)
    {
        _signature = signature;
        _help = help;
    }

    virtual ~Request() = default;

    /* ---------------------------------------------------------------------- */
    /* Methods to execute the request when received at the server             */
    /* ---------------------------------------------------------------------- */
    /**
     *  Wraps the actual execution function by authorizing the user
     *  and calling the request_execute virtual function
     *    @param _paramlist list of XML parameters
     *    @param _retval value to be returned to the client
     */
    void execute(xmlrpc_c::paramList const& _paramList,
        const xmlrpc_c::callInfo * _callInfoP, xmlrpc_c::value * const _retval) override;

    /**
     *  Actual Execution method for the request. Must be implemented by the
     *  XML-RPC requests
     *    @param _paramlist of the XML-RPC call (complete list)
     *    @param att the specific request attributes
     */
    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;
    /**
     * Locks the requested object, gets information, and unlocks it
     *
     * @param pool object pool
     * @param id of the object
     * @param type of the object
     * @param att the specific request attributes
     *
     * @param perms returns the object's permissions
     * @param name returns the object's name
     * @param throw_error send error response to client if object not found
     *
     * @return 0 on success, -1 otherwise
     */
    int get_info(PoolSQL *                 pool,
                 int                       id,
                 PoolObjectSQL::ObjectType type,
                 RequestAttributes&        att,
                 PoolObjectAuth&           perms,
                 std::string&              name,
                 bool                      throw_error);

    /* ---------------------------------------------------------------------- */
    /* Methods to send response to xml-rpc client                             */
    /* ---------------------------------------------------------------------- */
    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc excute method should return
     *    @param val to be returned to the client
     *    @param att the specific request attributes
     */
    void success_response(int val, RequestAttributes& att);

    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc excute method should return
     *    @param val string to be returned to the client
     *    @param att the specific request attributes
     */
    void success_response(const std::string& val, RequestAttributes& att);

    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc execute method should return
     *    @param val to be returned to the client
     *    @param att the specific request attributes
     */
    void success_response(bool val, RequestAttributes& att);

    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc excute method should return
     *    @param val to be returned to the client
     *    @param att the specific request attributes
     */
    void success_response(uint64_t val, RequestAttributes& att);

    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc excute method should return. A descriptive error message
     *  is constructed using att.resp_obj, att.resp_id and/or att.resp_msg and
     *  the ErrorCode
     *    @param ec error code for this call
     *    @param ra the specific request attributes
     */
    void failure_response(ErrorCode ec, RequestAttributes& ra);

    /**
     *  Builds an error response. A descriptive error message
     *  is constructed using att.resp_obj, att.resp_id and/or att.resp_msg and
     *  the ErrorCode
     *    @param ec error code for this call
     *    @param att the specific request attributes
     */
    std::string failure_message(ErrorCode ec, RequestAttributes& att);

    /* ---------------------------------------------------------------------- */
    /* Authorization methods for requests                                     */
    /* ---------------------------------------------------------------------- */
    /**
     *  Performs a basic authorization for this request using the uid/gid
     *  from the request. The function gets the object from the pool to get
     *  the public attribute and its owner. The authorization is based on
     *  object and type of operation for the request.
     *    @param oid of the object, can be -1 for objects to be created, or
     *    pools.
     *    @param att the specific request attributes
     *
     *    @return true if the user is authorized.
     */
    bool basic_authorization(int oid, RequestAttributes& att);

    /**
     *  Performs a basic quota check for this request using the uid/gid
     *  from the request. Usage counters are updated for the user/group.
     *  On case of error, the failure_response return values are set
     *
     *    @param tmpl describing the object
     *    @param object type of the object
     *    @param att the specific request attributes
     *
     *    @return true if the user is authorized.
     */
    bool quota_authorization(Template * tmpl, Quotas::QuotaType qtype,
        RequestAttributes&  att);

    /**
     *    @param tmpl describing the object
     *    @param att the specific request attributes
     */
    ErrorCode as_uid_gid(Template * tmpl, RequestAttributes& att);

private:
    /* ---------------------------------------------------------------------- */
    /* Functions to manage user and group quotas                              */
    /* ---------------------------------------------------------------------- */
    static bool user_quota_authorization(Template * tmpl, Quotas::QuotaType  qtype,
        const RequestAttributes& att, std::string& error_str);

    static bool group_quota_authorization(Template * tmpl, Quotas::QuotaType  qtype,
        const RequestAttributes& att, std::string& error_str);

    static void user_quota_rollback(Template * tmpl, Quotas::QuotaType  qtype,
        const RequestAttributes& att);

    static void group_quota_rollback(Template * tmpl, Quotas::QuotaType  qtype,
        const RequestAttributes& att);

    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc excute method should return
     *    @param ec error code for this call
     *    @param va string representation of the error
     *    @param ra the specific request attributes
     */
    void failure_response(ErrorCode ec, const std::string& va, RequestAttributes& ra) const;

    /**
     * Logs the method invocation, including the arguments
     * @param att the specific request attributes
     * @param paramList list of XML parameters
     * @param format_str for the log
     * @param hidden_params params not to be shown
     * @param callInfoP information of client
     */
    static void log_method_invoked(const RequestAttributes& att,
        const xmlrpc_c::paramList&  paramList, const std::string& format_str,
        const std::string& method_name, const std::set<int>& hidden_params,
        const xmlrpc_c::callInfo * callInfoP);

    /**
     * Logs the method result, including the output data or error message
     *
     * @param att the specific request attributes
     * @param method_name that produced the error
     */
    static void log_result(const RequestAttributes& att,
            const std::string& method_name);

    /**
     * Formats and adds a xmlrpc_c::value to oss.
     *
     * @param v value to format
     * @param oss stream to write v
     * @param limit of characters to wirte
     */
    static void log_xmlrpc_value(const xmlrpc_c::value& v,
            std::ostringstream& oss, const int limit);

    // Default number of character to show in the log. Option %l<number>
    const static int DEFAULT_LOG_LIMIT = 20;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_H_

