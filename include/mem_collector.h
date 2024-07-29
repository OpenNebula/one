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

#ifndef MEM_COLLECTOR_H_
#define MEM_COLLECTOR_H_

#define MEM_COLLECTOR_CHUNK 100

/**
 *  mem_collector. A simple struct to track strdup'ed strings in lex parsers.
 *  It prevents memory leaks in case of parse errors
 */
typedef struct mem_collector_
{
    char** str_buffer;
    int    size;
    int    next;
} mem_collector;

/**
 *  Initialize mem_collector internal memory buffers. MUST be called before
 *  using any relared function
 *    @param mc pointer to the mem_collector
 */
void mem_collector_init(mem_collector * mc);

/**
 *  Frees mem_collector internal resources.
 *    @param mc pointer to the mem_collector
 */
void mem_collector_cleanup(mem_collector * mc);

/**
 *  Strdup's a string
 *    @param mc pointer to the mem_collector
 *    @param str string to be copied
 *    @return pointer to the new string
 */
char * mem_collector_strdup(mem_collector *mc, const char * str);

#endif /*MEM_COLLECTOR_H_*/

