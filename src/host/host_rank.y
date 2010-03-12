/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

%{
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

#include <ctype.h>
#include <string.h>
#include <fnmatch.h>

#include "host_rank.h"
#include "Host.h"

#define YYERROR_VERBOSE
#define host_rank_lex host_lex

extern "C" 
{
void host_rank_error(
	YYLTYPE *		llocp,
	Host *			host,
	int&			result,
	char **			error_msg,
	const char *	str);

int host_rank_lex (YYSTYPE *lvalp, YYLTYPE *llocp);

int host_rank_parse(Host * host, int& result, char ** errmsg);
}

%}

%parse-param {Host *  host}
%parse-param {int&  result}
%parse-param {char ** error_msg}

%union {
    char * 	val_str;
    int 	val_int;
    float   val_float;
};

%defines
%locations
%pure_parser
%name-prefix = "host_rank_"
%output      = "host_rank.cc"

%left '+' '-'
%left '*' '/'
%token <val_int> 	INTEGER
%token <val_str> 	STRING
%token <val_float>  FLOAT
%type  <val_int> 	stmt
%type  <val_float>  expr

%%

stmt:   expr                { result = static_cast<int>($1);}
        |                   { result = 0; } 
        ;
        
expr:   STRING              { string val;
                              string attr($1);

                              if (attr == "RUNNING_VMS")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_running_vms());
                              }
                              else if (attr == "ALLOCATED_MEMORY")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_mem_usage());
                              }
                              else if (attr == "ALLOCATED_CPU")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_cpu_usage());
                              }
                              else if (attr == "ALLOCATED_DISK")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_disk_usage());
                              }
                              else if (attr == "USED_MEMORY")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_used_mem());
                              }
                              else if (attr == "USED_CPU")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_used_cpu());
                              }
                              else if (attr == "USED_DISK")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_used_disk());
                              }
                              else if (attr == "FREE_MEMORY")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_free_mem());
                              }
                              else if (attr == "FREE_CPU")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_free_cpu());
                              }
                              else if (attr == "FREE_DISK")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_free_disk());
                              }
                              else if (attr == "MAX_MEMORY")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_max_mem());
                              }
                              else if (attr == "MAX_CPU")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_max_cpu());
                              }
                              else if (attr == "MAX_DISK")
                              {
                                $$ = static_cast<float>
                                      (host->get_share_max_disk());
                              }
                              else
                              {
                                host->get_template_attribute($1,val);
                                $$ = val.empty() ? 0.0 : atof(val.c_str());
                              }

                              free($1);
                            }
        | FLOAT             { $$ = $1; }
        | INTEGER           { $$ = static_cast<float>($1); }
        | expr '+' expr     { $$ = $1 + $3;}
        | expr '-' expr     { $$ = $1 - $3;}
        | expr '*' expr     { $$ = $1 * $3;}
        | expr '/' expr     { $$ = $1 / $3;}
        | '-' expr          { $$ = - $2;}
        | '(' expr ')'      { $$ = $2;}
        ;

%%

extern "C" void host_rank_error(
	YYLTYPE *		llocp,
	Host *			host,
	int&			result,
	char **			error_msg,
	const char *	str)
{
	int length;
	
	length = strlen(str)+ 64;
	
	*error_msg = (char *) malloc(sizeof(char)*length);
	
	if (*error_msg != 0)
	{
		snprintf(*error_msg,
			length,
			"%s at line %i, columns %i:%i",
			str,
	    	llocp->first_line,
    		llocp->first_column,
        	llocp->last_column);
	}
} 

