/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

using namespace std;

/**
 * This class represents the dynamic attributes: specific for a request of the
 * same method.
 */
struct RequestAttributes
{
public:
    int uid;                  /**< id of the user */
    int gid;                  /**< id of the user's group */

    string uname;             /**< name of the user */
    string gname;             /**< name of the user's group */

    string password;          /**< password of the user */

    set<int> group_ids;       /**< set of user's group ids */

    string session;           /**< Session from ONE XML-RPC API */
    int    req_id;            /**< Request ID for log messages */

    int umask;                /**< User umask for new objects */

    xmlrpc_c::value * retval; /**< Return value from libxmlrpc-c */

    PoolObjectSQL::ObjectType resp_obj; /**< object type */
    int                       resp_id;  /**< Id of the object */
    string                    resp_msg; /**< Additional response message */

    uint64_t replication_idx;

    RequestAttributes()
    {
        resp_obj        = PoolObjectSQL::NONE;
        resp_id         = -1;
        resp_msg        = "";
        replication_idx = UINT64_MAX;
    };

    RequestAttributes(const RequestAttributes& ra)
    {
        uid = ra.uid;
        gid = ra.gid;

        uname = ra.uname;
        gname = ra.gname;

        password = ra.password;

        group_ids = ra.group_ids;

        session  = ra.session;
        req_id   = ra.req_id;

        umask    = ra.umask;

        retval   = ra.retval;

        resp_obj = ra.resp_obj;
        resp_id  = ra.resp_id;
        resp_msg = ra.resp_msg;

        replication_idx = ra.replication_idx;
    };

    RequestAttributes(int _uid, int _gid, const RequestAttributes& ra)
    {
        uid = _uid;
        gid = _gid;

        password = "";

        group_ids = ra.group_ids;

        uname = "";
        gname = "";

        umask = 0;

        session  = ra.session;
        req_id   = ra.req_id;

        umask    = ra.umask;

        retval   = ra.retval;

        resp_obj = PoolObjectSQL::NONE;
        resp_id  = -1;
        resp_msg = "";

        replication_idx = UINT64_MAX;
    };

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
    static string object_name(PoolObjectSQL::ObjectType ob);

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
    static void set_call_log_format(const string& log_format)
    {
        format_str = log_format;
    }

protected:
    /* ---------------------------------------------------------------------- */
    /* Static Request Attributes: shared among request of the same method     */
    /* ---------------------------------------------------------------------- */
    PoolSQL * pool;           /**< Pool of objects */
    string    method_name;    /**< The name of the XML-RPC method */

    PoolObjectSQL::ObjectType auth_object;/**< Auth object for the request */
    AuthRequest::Operation    auth_op;    /**< Auth operation for the request */

    set<int> hidden_params;

    static string format_str;

    bool log_method_call; //Write method call and result to the log

    bool leader_only; //Method can be only execute by leaders or solo servers

    static const long long xmlrpc_timeout; //Timeout (ms) for request forwarding

    /* ---------------------------------------------------------------------- */
    /* Class Constructors                                                     */
    /* ---------------------------------------------------------------------- */
    Request(const string& mn, const string& signature, const string& help):
        pool(0),method_name(mn)
    {
        _signature = signature;
        _help      = help;

        hidden_params.clear();

        log_method_call = true;

        leader_only     = true;
    };

    virtual ~Request(){};

    /* ---------------------------------------------------------------------- */
    /* Methods to execute the request when received at the server             */
    /* ---------------------------------------------------------------------- */
    /**
     *  Wraps the actual execution function by authorizing the user
     *  and calling the request_execute virtual function
     *    @param _paramlist list of XML parameters
     *    @param _retval value to be returned to the client
     */
    virtual void execute(xmlrpc_c::paramList const& _paramList,
        const xmlrpc_c::callInfo * _callInfoP, xmlrpc_c::value * const _retval);

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
                 string&                   name,
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
    void success_response(const string& val, RequestAttributes& att);

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
    string failure_message(ErrorCode ec, RequestAttributes& att);

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
    bool basic_authorization(int oid, RequestAttributes& att)
    {
        return basic_authorization(oid, auth_op, att);
    };

    /**
     *  Performs a basic authorization for this request using the uid/gid
     *  from the request. The function gets the object from the pool to get
     *  the public attribute and its owner. The authorization is based on
     *  object and type of operation for the request.
     *    @param oid of the object, can be -1 for objects to be created, or
     *    pools.
     *    @param op operation of the request.
     *    @param att the specific request attributes
     *
     *    @return true if the user is authorized.
     */
    bool basic_authorization(int oid, AuthRequest::Operation op,
        RequestAttributes& att);

    /**
     *  Performs a basic authorization for this request using the uid/gid
     *  from the request. The function gets the object from the pool to get
     *  the public attribute and its owner. The authorization is based on
     *  object and type of operation for the request.
     *    @param pool object pool
     *    @param oid of the object, can be -1 for objects to be created, or
     *    pools.
     *    @param op operation of the request.
     *    @param att the specific request attributes
     *
     *    @return SUCCESS if the user is authorized.
     */
    static ErrorCode basic_authorization(
            PoolSQL*                pool,
            int                     oid,
            AuthRequest::Operation  op,
            PoolObjectSQL::ObjectType auth_object,
            RequestAttributes&      att);

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
        RequestAttributes& att, string& error_str);

    /**
     *  Performs rollback on usage counters for a previous  quota check operation
     *  for the request.
     *    @param tmpl describing the object
     *    @param att the specific request attributes
     */
    static void quota_rollback(Template * tmpl, Quotas::QuotaType qtype,
        RequestAttributes& att);

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
        RequestAttributes& att, string& error_str);

    static bool group_quota_authorization(Template * tmpl, Quotas::QuotaType  qtype,
        RequestAttributes& att, string& error_str);

    static void user_quota_rollback(Template * tmpl, Quotas::QuotaType  qtype,
        RequestAttributes& att);

    static void group_quota_rollback(Template * tmpl, Quotas::QuotaType  qtype,
        RequestAttributes& att);

    /**
     *  Builds an XML-RPC response updating retval. After calling this function
     *  the xml-rpc excute method should return
     *    @param ec error code for this call
     *    @param va string representation of the error
     *    @param ra the specific request attributes
     */
    void failure_response(ErrorCode ec, const string& va, RequestAttributes& ra);

    /**
     * Logs the method invocation, including the arguments
     * @param att the specific request attributes
     * @param paramList list of XML parameters
     * @param format_str for the log
     * @param hidden_params params not to be shown
     * @param callInfoP information of client
     */
    static void log_method_invoked(const RequestAttributes& att,
        const xmlrpc_c::paramList&  paramList, const string& format_str,
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

