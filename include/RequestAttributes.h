/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_ATTRIBUTES_H_
#define REQUEST_ATTRIBUTES_H_

#include "AuthRequest.h"
#include "PoolObjectSQL.h"
#include "UserPool.h"
#include "Nebula.h"

/**
 *  Generic class to process the arguments of a request
 */
class ParamList
{
public:
    ParamList(const std::set<int>& hidden):_hidden(hidden) {};

    virtual ~ParamList() = default;

    std::string& to_string(std::string& str) const
    {
        std::ostringstream oss;

        str.clear();

        unsigned int pl_size = size();

        if (pl_size == 0)
        {
            return str;
        }

        oss << param_value(0);

        for (unsigned int i = 1; i < pl_size; i++)
        {
            oss << " " << param_value(i);
        }

        str = oss.str();

        return str;
    }

    void log(std::ostringstream& oss, unsigned int limit) const
    {
        std::ostringstream pl_oss;

        for (unsigned int i=1; i < size(); i++)
        {
            if (i != 1)
            {
                pl_oss << ", ";
            }
            pl_oss << param_value(i);
        }

        std::string pl_s = pl_oss.str();

        if ( pl_s.length() <= limit )
        {
            oss << pl_s;
            return;
        }

        oss << pl_s.substr(0, limit - 3) << "...";
    }

    std::string param_value(int index) const
    {
        if ( _hidden.count(index) == 1 )
        {
            return "****";
        }

        return api_value(index);
    }

    std::string session() const
    {
        return api_value(0);
    }

    virtual unsigned int size() const = 0;

protected:
    const std::set<int>& _hidden;

    virtual std::string api_value(int index) const = 0;
};

/**
 * This class represents the dynamic attributes: specific for a request of the
 * same method.
 */
class RequestAttributes
{
private:
    static inline uint REQUEST_ID_LENGTH = 9999;

public:
    int uid;                  /**< id of the user */
    int gid;                  /**< id of the user's group */

    std::string uname;        /**< name of the user */
    std::string gname;        /**< name of the user's group */

    std::string password;     /**< password of the user */

    std::set<int> group_ids;  /**< set of user's group ids */

    std::string session;      /**< Session from ONE XML-RPC API */
    uint        req_id;       /**< Request ID for log messages */

    int umask;                /**< User umask for new objects */

    PoolObjectSQL::ObjectType resp_obj; /**< object type */
    int                       resp_id;  /**< Id of the object */
    std::string               resp_msg; /**< Additional response message */

    uint64_t replication_idx;

    AuthRequest::Operation auth_op;  /**< Auth operation for the request */

    bool success; /**< True if the call was successfull false otherwise */

    std::string retval_xml;   /**< Return value in XML format for API Hooks*/

    std::string extra_xml;    /**< Extra information returned for API Hooks */

    RequestAttributes(AuthRequest::Operation api_auth_op, const ParamList& pl):
        uid(-1),
        gid(-1),
        session(pl.session()),
        req_id(one_util::random<uint>(0, REQUEST_ID_LENGTH)),
        umask(0),
        resp_obj(PoolObjectSQL::NONE),
        resp_id(-1),
        replication_idx(UINT64_MAX),
        auth_op(api_auth_op),
        success(false)
    {
    }

    RequestAttributes(AuthRequest::Operation api_auth_op):
        uid(-1),
        gid(-1),
        req_id(one_util::random<uint>(0, REQUEST_ID_LENGTH)),
        umask(0),
        resp_obj(PoolObjectSQL::NONE),
        resp_id(-1),
        replication_idx(UINT64_MAX),
        auth_op(api_auth_op),
        success(false)
    {
    }

    RequestAttributes(AuthRequest::Operation api_auth_op, int _uid, int _gid,
                      PoolObjectSQL::ObjectType object_type):
        uid(_uid),
        gid(_gid),
        req_id(one_util::random<uint>(0, REQUEST_ID_LENGTH)),
        umask(0),
        resp_obj(object_type),
        resp_id(-1),
        replication_idx(UINT64_MAX),
        auth_op(api_auth_op),
        success(false)
    {
    }

    RequestAttributes(int _uid, int _gid, const RequestAttributes& ra):
        uid(_uid),
        gid(_gid),
        uname(),
        gname(),
        password(),
        group_ids(ra.group_ids),
        session(ra.session),
        req_id(ra.req_id),
        umask(ra.umask),
        resp_obj(PoolObjectSQL::NONE),
        resp_id(-1),
        resp_msg(),
        replication_idx(UINT64_MAX),
        auth_op(ra.auth_op),
        success(ra.success),
        retval_xml(ra.retval_xml),
        extra_xml(ra.extra_xml)
    {}

    RequestAttributes(const RequestAttributes& ra) = default;

    virtual ~RequestAttributes() = default;

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
    void set_auth_op(VMActions::Action action)
    {
        if (action == VMActions::NONE_ACTION)
        {
            return;
        }

        AuthRequest::Operation result = AuthRequest::NONE;

        auto& nd  = Nebula::instance();

        if (auto user = nd.get_upool()->get_ro(uid))
        {
            result = user->get_vm_auth_op(action);
        }

        if (result != AuthRequest::NONE)
        {
            auth_op = result;
            return;
        }

        if (auto group = nd.get_gpool()->get_ro(gid))
        {
            result = group->get_vm_auth_op(action);
        }

        if (result != AuthRequest::NONE)
        {
            auth_op = result;
            return;
        }

        result = nd.get_vm_auth_op(action);

        if (result != AuthRequest::NONE)
        {
            auth_op = result;
        }
    }
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_ATTRIBUTES_H_

