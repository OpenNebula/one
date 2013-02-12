/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "NebulaUtil.h"
#include <algorithm>

using namespace std;

string& one_util::toupper(string& st)
{
    transform(st.begin(),st.end(),st.begin(),(int(*)(int))std::toupper);
    return st;
};

string& one_util::tolower(string& st)
{
    transform(st.begin(),st.end(),st.begin(),(int(*)(int))std::tolower);
    return st;
};

string one_util::log_time(time_t the_time)
{
    char time_str[26];

#ifdef SOLARIS
    ctime_r(&(the_time),time_str,sizeof(char)*26);
#else
    ctime_r(&(the_time),time_str);
#endif

    time_str[24] = '\0'; // Get rid of final enter character

    return string(time_str);
};

string one_util::log_time()
{
    return log_time( time(0) );
};

