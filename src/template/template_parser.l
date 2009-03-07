/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
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
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>

#include "template_syntax.h"

#define YY_DECL int template_lex (YYSTYPE *lvalp, YYLTYPE *llocp)

#define YY_USER_ACTION  llocp->first_line = yylineno; 				\
                        llocp->first_column = llocp->last_column;	\
                        llocp->last_column += yyleng;
%}

%option nounput
%option prefix="template_"
%option outfile="template_parser.c"
%option header-file="template_parser.h"
%option yylineno

%%
    /* --- Comments and blanks --- */

#.*                ;
^[[:blank:]]*      ;
[[:blank:]]*(#.*)? ;

   /* --- Tokens --- */

[[:blank:]\n]*=[[:blank:]]*    { return EQUAL;}
[[:blank:]\n]*,[[:blank:]\n]*  { return COMMA;}
[[:blank:]\n]*\[[[:blank:]\n]* { return OBRACKET;}
[[:blank:]\n]*\][[:blank:]]*   { return CBRACKET;}
\n                             { return NL;}

    /* --- Strings in quoted form and variables alphanumeric - and _ --- */

\"[^\"]+\"         { lvalp->val_str = strdup(yytext+1);
                     lvalp->val_str[yyleng-2] = '\0';
                     return STRING; }

'[^']+'            { lvalp->val_str = strdup(yytext+1);
                     lvalp->val_str[yyleng-2] = '\0';
                     return STRING; }

-?[0-9]+(.[0-9]+)? { lvalp->val_str = strdup(yytext); return STRING;}

[[:alnum:]_]+      { lvalp->val_str = strdup(yytext); return VARIABLE;}

%%

int template_wrap()
{
    return 1;
}
