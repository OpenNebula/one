/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#ifndef _SCOPE_GUARD_H_
#define _SCOPE_GUARD_H_

#include <functional>

namespace one_util
{
    /**
     * ScopeGuard safely executes a cleanup callback when going out of scope
     * In OpenNebula used for reverting state changes after failure,
     * for success run use release method to disable the ScopeGuard
     */
    class ScopeGuard
    {
    public:
        ScopeGuard() = default;
        explicit ScopeGuard(std::function<void()> f);
        ~ScopeGuard();

        // Non-copyable
        ScopeGuard(const ScopeGuard&) = delete;
        ScopeGuard& operator=(const ScopeGuard&) = delete;

        // Move semantics
        ScopeGuard(ScopeGuard&& other) noexcept;
        ScopeGuard& operator=(ScopeGuard&& other) noexcept;

        void release();
        void set_callback(std::function<void()> f);

    private:
        std::function<void()> _f;
        bool _active = false;
    };

} // namespace one_util

#endif /* _SCOPE_GUARD_H_ */
