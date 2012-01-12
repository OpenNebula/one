/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "mem_collector.h"

#define YY_NO_INPUT 

#define YY_DECL int vm_var_lex (YYSTYPE *lvalp, YYLTYPE *llocp, \
                                mem_collector *mc)

#define YY_USER_ACTION  llocp->first_line = yylineno;   \
                        llocp->first_column = llocp->last_column;   \
                        llocp->last_column += yyleng;
%}

%option nounput
%option prefix="vm_var_"
%option outfile="vm_var_parser.c"
%option yylineno

%x VAR
%x VALUE
%%

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

<VAR>[[:alnum:]_]+             { lvalp->val_str =
                                 mem_collector_strdup(mc,yytext);
                                 return VARIABLE;}

<VALUE>\"[^\"]*\"              { lvalp->val_str =
                                 mem_collector_strdup(mc,yytext+1);
                                 lvalp->val_str[yyleng-2] = '\0';
                                 BEGIN(VAR);
                                 return STRING;}

<VALUE>[[:alnum:]]+            { lvalp->val_str =
                                 mem_collector_strdup(mc,yytext);
                                 BEGIN(VAR);
                                 return STRING;}

<VAR>\$                        { lvalp->val_char = '\0';
                                 return EOA;}

<VAR>.                         { lvalp->val_char = *yytext;
                                 BEGIN(INITIAL);
                                 return EOA;}

<VAR><<EOF>>                   { lvalp->val_char = '\0';
                                 BEGIN(INITIAL);
                                 return EOA;}

 /* ------------------------------------------------------------------------- */
 /* Just copy the string verbatim till we find a variable (starts with $)     */
 /* ------------------------------------------------------------------------- */

[^\$]+  { lvalp->val_str = mem_collector_strdup(mc,yytext); return RSTRING;}

%%

int vm_var_wrap()
{
    return 1;
}
