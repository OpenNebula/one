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
 *  The Request Class represents the basic abstraction for the OpenNebula
 *  XML-RPC API. This interface must be implemented by any XML-RPC API call
 */
class Request: public xmlrpc_c::method
{
public:
    /**
     *  Wraps the actual execution function by authorizing the user
     *  and calling the request_execute virtual function
     *    @param _paramlist list of XML parameters
     *    @param _retval value to be returned to the client
     */
    virtual void execute(
        xmlrpc_c::paramList const& _paramList,
        xmlrpc_c::value *   const  _retval);

    /**
     *  Error codes for the XML-RPC API
     */
    enum ErrorCode {
        SUCCESS        = 0x0000,
        AUTHENTICATION = 0x0100,
        AUTHORIZATION  = 0x0200,
        NO_EXISTS      = 0x0400,
        ACTION         = 0x0800,
        XML_RPC_API    = 0x1000,
        INTERNAL       = 0x2000,
    };

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
     *    %% -- %
     */
    static void set_call_log_format(const string& log_format)
    {
        format_str = log_format;
    }

protected:

    /* ---------------------------------------------------------------------*/
    /*                     Attributes of the Request                        */
    /* ---------------------------------------------------------------------*/

    /* -------- Dynamic (specific for a request of the same method) -------- */

    struct RequestAttributes
    {
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

        RequestAttributes(){};

        RequestAttributes(const RequestAttributes& ra)
        {
            uid = ra.uid;
            gid = ra.gid;

            uname = ra.uname;
            gname = ra.gname;

            password = ra.password;

            session  = ra.session;
            retval   = ra.retval;

            umask = ra.umask;
        };

        RequestAttributes(int _uid, int _gid, const RequestAttributes& ra)
        {
            uid = _uid;
            gid = _gid;

            password = "";

            uname = "";
            gname = "";

            umask = 0;

            session  = ra.session;
            retval   = ra.retval;
        };
    };

    /* -------- Static (shared among request of the same method) -------- */

    PoolSQL * pool;           /**< Pool of objects */
    string    method_name;    /**< The name of the XML-RPC method */

    PoolObjectSQL::ObjectType auth_object;/**< Auth object for the request */
    AuthRequest::Operation    auth_op;    /**< Auth operation for the request */

    set<int> hidden_params;

    static string format_str;

    /* -------------------- Constructors ---------------------------------- */

    Request(const string& mn,
            const string& signature,
            const string& help): pool(0),method_name(mn)
    {
        _signature = signature;
        _help      = help;

        hidden_params.clear();
    };

    virtual ~Request(){};

    /* -------------------------------------------------------------------- */
    /* -------------------------------------------------------------------- */

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
    bool quota_authorization(
            Template *          tmpl,
            Quotas::QuotaType   qtype,
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
    bool quota_authorization(
            Template *          tmpl,
            Quotas::QuotaType   qtype,
            RequestAttributes&  att,
            string&             error_str);

    /**
     *  Performs rollback on usage counters for a previous  quota check operation
     *  for the request.
     *    @param tmpl describing the object
     *    @param att the specific request attributes
     */
    void quota_rollback(Template *         tmpl,
                        Quotas::QuotaType  qtype,
                        RequestAttributes& att);

    /**
     *  Actual Execution method for the request. Must be implemented by the
     *  XML-RPC requests
     *    @param _paramlist of the XML-RPC call (complete list)
     *    @param att the specific request attributes
     */
    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;

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
     *  the xml-rpc excute method should return
     *    @param ec error code for this call
     *    @param val string representation of the error
     *    @param att the specific request attributes
     */
    void failure_response(ErrorCode ec,
                          const string& val,
                          RequestAttributes& att);

    /**
     *  Gets a string representation for the Auth object in the
     *  request.
     *    @param ob object for the auth operation
     *    @return string equivalent of the object
     */
    static string object_name(PoolObjectSQL::ObjectType ob);

    /**
     *  Logs authorization errors
     *    @param message with the authorization error details
     *    @return string for logging
     *    @param att the specific request attributes
     */
    string authorization_error (const string &message, RequestAttributes& att);

    /**
     *  Logs authenticate errors
     *    @return string for logging
     */
    string authenticate_error ();

    /**
     *  Logs get object errors
     *    @param object over which the get failed
     *    @param id of the object over which the get failed
     *    @return string for logging
     */
    string get_error (const string &object, int id);

    /**
     *  Logs action errors
     *    @param err_desc brief description of the error
     *    @param err_detail additional error details from Managers & Pools
     *    @return string for logging
     */
    string request_error (const string &err_desc, const string &err_detail);

    /**
     *  Logs allocate errors
     *    @param message with the allocate error details
     *    @return string for logging
     */
    string allocate_error (const string& error);

    /**
     *  Logs allocate errors for a given resource
     *    @param obj the resource
     *    @param message with the allocate error details
     *    @return string for logging
     */
    string allocate_error (PoolObjectSQL::ObjectType obj, const string& error);

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
    int get_info (PoolSQL *                 pool,
                  int                       id,
                  PoolObjectSQL::ObjectType type,
                  RequestAttributes&        att,
                  PoolObjectAuth&           perms,
                  string&                   name,
                  bool                      throw_error);

    /**
     * Logs the method result, including the output data or error message
     *
     * @param att the specific request attributes
     */
    virtual void log_result(
            const RequestAttributes&    att);

    /**
     * Formats and adds a xmlrpc_c::value to oss.
     *
     * @param v value to format
     * @param oss stream to write v
     */
    virtual void log_xmlrpc_value(
            const xmlrpc_c::value&  v,
            ostringstream&          oss);

private:

    /**
     * Logs the method invocation, including the arguments
     *
     * @param att the specific request attributes
     * @param paramList list of XML parameters
     */
    void log_method_invoked(
            const RequestAttributes&    att,
            const xmlrpc_c::paramList&  paramList);

    /* ------------- Functions to manage user and group quotas -------------- */

    bool user_quota_authorization(Template * tmpl,
                                  Quotas::QuotaType  qtype,
                                  RequestAttributes& att,
                                  string& error_str);

    bool group_quota_authorization(Template * tmpl,
                                   Quotas::QuotaType  qtype,
                                   RequestAttributes& att,
                                   string& error_str);

    void user_quota_rollback(Template * tmpl,
                             Quotas::QuotaType  qtype,
                             RequestAttributes& att);

    void group_quota_rollback(Template * tmpl,
                              Quotas::QuotaType  qtype,
                              RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_H_

