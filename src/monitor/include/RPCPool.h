/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#ifndef RPC_POOL_H_
#define RPC_POOL_H_

#include "BaseObject.h"
#include "SqlDB.h"
#include "NebulaLog.h"

#include <memory>
#include <mutex>
#include <functional>

class RPCPool
{
public:

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    template<typename T>
    BaseObjectLock<T> get(int oid) const
    {
        std::lock_guard<std::mutex> lck(pool_mtx);

        auto it = objects.find(oid);

        if (it == objects.end())
        {
            return nullptr;
        }
        else
        {
            return BaseObjectLock<T>(it->second.get());
        }
    };

    /**
     *  Removes object from the pool
     *   @param oid the object unique identifier
     */
    void erase(int oid)
    {
        std::lock_guard<std::mutex> lck(pool_mtx);

        auto it = objects.find(oid);

        if (it != objects.end())
        {
            objects.erase(it);
        }
    };

    void add_object(std::unique_ptr<BaseObject> o)
    {
        std::lock_guard<std::mutex> lck(pool_mtx);

        objects[o->oid()] = std::move(o);
    }

    /**
     *  Execute the given function over each object in the pool
     *    @param f the function
     */
    template<typename T>
    void each(std::function< void(BaseObjectLock<T>&&) >&& f)
    {
        std::lock_guard<std::mutex> lck(pool_mtx);

        for (auto& e : objects)
        {
            f(BaseObjectLock<T>(e.second.get()));
        }
    }

protected:
    // ------------------------------------------------------------------------
    explicit RPCPool(SqlDB* _db)
        : db(_db)
    {
    }

    virtual ~RPCPool() = default;

    /**
     *  Deletes pool objects and frees resources.
     */
    void clear()
    {
        std::lock_guard<std::mutex> lck(pool_mtx);
        objects.clear();
    }

    /**
     * Inserts a new BaseObject into the objects map
     */
    virtual void add_object(xmlNodePtr node) = 0;

    /**
     *  Inserts object into objects list
     */
    template<typename T>
    void add_object(const xmlNodePtr node)
    {
        if (node == 0 || node->children == 0)
        {
            NebulaLog::log("POOL", Log::ERROR,
                           "XML Node does not represent a valid object");
            return;
        }

        auto obj = std::unique_ptr<T>(new T(node));
        {
            std::lock_guard<std::mutex> lck(pool_mtx);
            objects[obj->oid()] = std::move(obj);
        }
    }

    // ------------------------------------------------------------------------
    // Attributes
    // ------------------------------------------------------------------------
    /**
     * DB to store monitoring information
     */
    SqlDB* db;

    mutable std::mutex pool_mtx;

    /**
     * Hash map contains the suitable [id, object] pairs.
     */
    std::map<int, std::unique_ptr<BaseObject>> objects;

};

#endif // REMOTE_POOL_H_
