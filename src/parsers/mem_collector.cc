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

#include <stdlib.h>
#include <string.h>

#include "mem_collector.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void mem_collector_init(mem_collector * mc)
{
    int i;

    mc->str_buffer = (char **) malloc (sizeof(char*) * MEM_COLLECTOR_CHUNK);
    mc->size       = MEM_COLLECTOR_CHUNK;
    mc->next       = 0;

    for (i=0; i< mc->size ; i++)
    {
        mc->str_buffer[i] = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void mem_collector_cleanup(mem_collector * mc)
{
    int i;

    for (i=0; i< mc->size ; i++)
    {
        if ( mc->str_buffer[i] != 0 )
        {
            free(mc->str_buffer[i]);
        }
        else /* No str's left in the pool */
        {
            break;
        }
    }

    free(mc->str_buffer);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

char * mem_collector_strdup(mem_collector *mc, const char * str)
{
    int    i, old_size;
    char * new_str;

    if ( mc->next == mc->size )
    {
        old_size = mc->size;
        mc->size = mc->size + MEM_COLLECTOR_CHUNK;

        mc->str_buffer = (char **) realloc(mc->str_buffer,
                                           sizeof(char*) * mc->size);

        for ( i = old_size ; i < mc->size ; i++)
        {
            mc->str_buffer[i] = 0;
        }
    }

    new_str = strdup(str);
    mc->str_buffer[mc->next++] = new_str;

    return new_str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
