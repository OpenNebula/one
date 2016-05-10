/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include <stdio.h>
#include <stdlib.h>

#include "expr_bool.h"
#include "expr_arith.h"
#include "mem_collector.h"

#define YY_NO_INPUT

#define YY_DECL int expr_lex (YYSTYPE *lvalp, YYLTYPE *llocp, mem_collector *mc)

#define YY_USER_ACTION  llocp->first_line = yylineno;               \
                        llocp->first_column = llocp->last_column;   \
                        llocp->last_column += yyleng;
%}

%option nounput
%option prefix="expr_"
%option outfile="expr_parser.c"
%option yylineno

%%
   /* --- Tokens --- */

[!&|=><()\*\+/\^-] { return *yytext;}

  /* --- Strings, also quoted form --- */

[A-Za-z][0-9A-Za-z_]* { lvalp->val_str = mem_collector_strdup(mc,yytext);
                        return STRING;}

\"\"        { lvalp->val_str = NULL;
              return STRING;}

\"[^\"]*\"  { lvalp->val_str = mem_collector_strdup(mc,yytext+1);
              lvalp->val_str[yyleng-2] = '\0';
              return STRING;}

  /* --- Numbers --- */

-?[0-9]+         { lvalp->val_int = atoi(yytext);
                   return INTEGER;}

-?[0-9]+\.[0-9]+ { lvalp->val_float = atof(yytext);
                   return FLOAT;}

    /* --- blanks --- */

[[:blank:]]*

%%

int expr_wrap()
{
    return 1;
}
