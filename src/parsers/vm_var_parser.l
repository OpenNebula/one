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

%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>

#include "vm_var_syntax.h"
#include "vm_file_var_syntax.h"
#include "mem_collector.h"

#define YY_NO_INPUT

#define YY_DECL int vm_var_lex (YYSTYPE *yylval_param, YYLTYPE *llocp, \
                                mem_collector *mc, yyscan_t yyscanner)

#define YY_USER_ACTION  llocp->first_line = yylineno;   \
                        llocp->first_column = llocp->last_column;   \
                        llocp->last_column += yyleng;
%}

%option nounput
%option prefix="vm_var_"
%option outfile="vm_var_parser.cc"
%option header-file="vm_var_parser.h"
%option yylineno
%option bison-bridge
%option reentrant

%x VAR
%x VALUE
%%

 /* ------------------------------------------------------------------------- */
 /* Just copy the string verbatim till we find a variable (starts with $)     */
 /* ------------------------------------------------------------------------- */

([^\$\\]|"\\\$"|\\[^\$])+  { yylval_param->val_str = mem_collector_strdup(mc,yytext); return RSTRING;}

 /* ------------------------------------------------------------------------- */
 /* Parse variables in the form:                                              */
 /*   $VARIABLE                                                               */
 /*   $VARIABLE[ATTR]                                                         */
 /*   $VARIABLE[ATTR,ATTR=VALUE]                                              */
 /*   $NUM.CONTEXT_VARIABLE                                                   */
 /* ------------------------------------------------------------------------- */

\$                             { BEGIN VAR;}

<VAR>[[:blank:]]*=[[:blank:]]* { BEGIN VALUE; return EQUAL; }
<VAR>[[:blank:]]*,[[:blank:]]* { return COMMA;}
<VAR>\[[[:blank:]]*            { return OBRACKET;}
<VAR>[[:blank:]]*\]            { return CBRACKET;}

<VAR>[[:alnum:]_]+             { yylval_param->val_str =
                                 mem_collector_strdup(mc,yytext);
                                 return VARIABLE;}

<VALUE>\"[^\"]*\"              { yylval_param->val_str =
                                 mem_collector_strdup(mc,yytext+1);
                                 yylval_param->val_str[yyleng-2] = '\0';
                                 BEGIN(VAR);
                                 return STRING;}

<VALUE>[[:alnum:]]+            { yylval_param->val_str =
                                 mem_collector_strdup(mc,yytext);
                                 BEGIN(VAR);
                                 return STRING;}

<VAR>\$                        { yylval_param->val_char = '\0';
                                 return EOA;}

<VAR>.                         { yylval_param->val_char = *yytext;
                                 BEGIN(INITIAL);
                                 return EOA;}

<VAR><<EOF>>                   { yylval_param->val_char = '\0';
                                 BEGIN(INITIAL);
                                 return EOA;}
%%

int vm_var_wrap(yyscan_t scanner)
{
    return 1;
}
