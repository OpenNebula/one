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

#ifndef _THREAD_SAFE_MAP_H_
#define _THREAD_SAFE_MAP_H_

#include <mutex>
#include <shared_mutex>
#include <map>

namespace one_util
{
    // Define a simple thread-safe wrapper for std::map
    template <typename Key, typename Value>
    class ThreadSafeMap {
    public:
        // Uses std::shared_mutex to allow multiple concurrent readers,
        // but only one writer (or no readers) at a time.
        mutable std::shared_mutex _mutex;
        std::map<Key, Value> _map;

    public:
        // --- Writer/Exclusive Operations (Requires exclusive lock) ---

        void insert(const Key& key, const Value& value) {
            // std::unique_lock provides exclusive ownership of the mutex for writing
            std::unique_lock<std::shared_mutex> lock(_mutex);
            _map[key] = value;
        }

        bool erase(const Key& key) {
            // std::unique_lock for removing
            std::unique_lock<std::shared_mutex> lock(_mutex);
            return _map.erase(key) > 0;
        }

        // --- Reader/Shared Operations (Requires shared lock) ---

        // Attempts to get a value; returns true if found, false otherwise.
        bool try_get(const Key& key, Value& result) const {
            // std::shared_lock allows multiple threads to hold the lock simultaneously for reading
            std::shared_lock<std::shared_mutex> lock(_mutex);
            auto it = _map.find(key);
            if (it != _map.end()) {
                result = it->second;
                return true;
            }
            return false;
        }

        // --- Utility Operations (Requires shared lock for accurate size) ---
        size_t size() const
        {
            std::shared_lock<std::shared_mutex> lock(_mutex);
            return _map.size();
        }
    };

} // namespace one_util

#endif
