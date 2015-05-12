/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef REQUEST_MANAGER_LOCK_H_
#define REQUEST_MANAGER_LOCK_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerLock: public Request
{
protected:
    RequestManagerLock(const string& method_name,
                       const string& help)
        :Request(method_name, "A:sis", help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerLock(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    virtual int lock_db(PoolObjectSQL * object, const string& owner) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerUnlock: public Request
{
protected:
    RequestManagerUnlock(const string& method_name,
                         const string& help)
        :Request(method_name, "A:sis", help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerUnlock(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    virtual void unlock_db(PoolObjectSQL * object, const string& owner) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentLock : public RequestManagerLock
{
public:
    DocumentLock():
        RequestManagerLock("DocumentLock",
                           "Tries to acquire the object's lock")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentLock(){};

    int lock_db(PoolObjectSQL * object, const string& owner)
    {
        return static_cast<Document*>(object)->lock_db(owner);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentUnlock : public RequestManagerUnlock
{
public:
    DocumentUnlock():
        RequestManagerUnlock("DocumentUnlock",
                           "Unlocks the object")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentUnlock(){};

    void unlock_db(PoolObjectSQL * object, const string& owner)
    {
        return static_cast<Document*>(object)->unlock_db(owner);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
