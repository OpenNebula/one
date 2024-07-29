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

%{
#include <stdio.h>
#include <stdlib.h>

#include "expr_bool.h"
#include "expr_arith.h"
#include "mem_collector.h"

#define YY_NO_INPUT

#define YY_DECL int expr_lex (YYSTYPE *yylval_param, YYLTYPE *llocp, \
        mem_collector *mc, yyscan_t yyscanner)

#define YY_USER_ACTION  llocp->first_line = yylineno;               \
                        llocp->first_column = llocp->last_column;   \
                        llocp->last_column += yyleng;
%}

%option nounput
%option prefix="expr_"
%option outfile="expr_parser.cc"
%option header-file="expr_parser.h"
%option reentrant
%option bison-bridge
%option yylineno

%%
   /* --- Tokens --- */

[@!&|=><()\*\+/\^-] { return *yytext;}

  /* --- Strings, also quoted form --- */

[A-Za-z][0-9A-Za-z_]* { yylval_param->val_str = mem_collector_strdup(mc,yytext);
                        return STRING;}

\"\"        { yylval_param->val_str = NULL;
              return STRING;}

\"[^\"]*\"  { yylval_param->val_str = mem_collector_strdup(mc,yytext+1);
              yylval_param->val_str[yyleng-2] = '\0';
              return STRING;}

  /* --- Numbers --- */

-?[0-9]+         { yylval_param->val_int = atoi(yytext);
                   return INTEGER;}

-?[0-9]+\.[0-9]+ { yylval_param->val_float = atof(yytext);
                   return FLOAT;}

    /* --- blanks --- */

[[:blank:]]*

%%

int expr_wrap(yyscan_t scanner)
{
    return 1;
}
