/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include "host_requirements.h"
#include "Host.h"

#define YYERROR_VERBOSE
#define host_requirements_lex host_lex

extern "C" 
{
void host_requirements_error(
	YYLTYPE *		llocp,
	Host *			host,
	bool&			result,
	char **			error_msg,
	const char *	str);

int host_requirements_lex (YYSTYPE *lvalp, YYLTYPE *llocp);

int host_requirements_parse(Host * host, bool& result, char ** errmsg);
}

%}

%parse-param {Host * host}
%parse-param {bool&  result}
%parse-param {char ** error_msg}

%union {
    char * 	val_str;
    int 	val_int;
};

%defines
%locations
%pure_parser
%name-prefix = "host_requirements_"
%output      = "host_requirements.cc"

%left '!' '&' '|'
%token <val_int> 	INTEGER
%token <val_str> 	STRING
%type  <val_int> 	stmt expr

%%

stmt:   expr	{ result=$1;   }
        |		{ result=true; } /* TRUE BY DEFAULT, ON EMPTY STRINGS */
        ;
        
expr:   STRING '=' INTEGER { 
			int val;

			host->get_template_attribute($1,val);
			$$ = val == $3;

			free($1);}

		| STRING '!' '=' INTEGER {
			int val;
			
			host->get_template_attribute($1,val);
			$$ = val != $4;
			
			free($1);}
					
        | STRING '>' INTEGER { 
			int val;
			
			host->get_template_attribute($1,val);
			$$ = val > $3;
			
			free($1);}			        
                
        | STRING '<' INTEGER { 
			int val;
			
			host->get_template_attribute($1,val);
			$$ = val < $3;
			
			free($1);}			
			
        | STRING '=' STRING { 
        	string val;
        	
			host->get_template_attribute($1,val);
			
			if (val == "")
			{
				$$ = false;
			}
			else
			{
				$$ = fnmatch($3, val.c_str(), 0) == 0;
			}
											
			free($1); 
			free($3);}

        | STRING '!''=' STRING {
			string val;
        
			host->get_template_attribute($1,val);
			
			if (val == "")
			{
				$$ = false;
			}
			else
			{
				$$ = fnmatch($4, val.c_str(), 0) != 0;
			}
								
			free($1); 
			free($4);}			
                                                                            
        | expr '&' expr { $$ = $1 && $3; }
        | expr '|' expr { $$ = $1 || $3; }
        | '!' expr      { $$ = ! $2; }
        | '(' expr ')'  { $$ =   $2; }
        ;

%%

extern "C" void host_requirements_error(
	YYLTYPE *		llocp,
	Host *			host,
	bool&			result,
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
