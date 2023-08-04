import { Token, Tokenizer } from './lex';

/**
 * Copyright (c) 2023 John Toebes
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

export type ParseResult = { [id: string]: string | number };
export type SyntaxElem = {
    tok?: Token;
    val?: string;
    optional?: SyntaxElem[];
    include?: SyntaxElem[];
};
export type SyntaxLookup = Partial<Record<Token, SyntaxElem[]>>;

// A reference to a variable.  It can optionally have 1 or 2 indexes surrounted by parenthesis
export const VariableRefSyntax: SyntaxElem[] = [
    { tok: Token.VARIABLE, val: 'variable' },
    {
        optional: [
            { tok: Token.LPAREN },
            { tok: Token.EXPRESSION, val: 'index1' },
            {
                optional: [
                    { tok: Token.COMMA },
                    { tok: Token.EXPRESSION, val: 'index2' },
                ],
            },
            { tok: Token.RPAREN },
        ],
    },
];

export const ONUNITSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.ON },
            { tok: Token.LPAREN },
            { tok: Token.EXPRESSION, val: 'unit' },
            { tok: Token.RPAREN },
        ],
    },
];

export const LOGICALUNITSyntax: SyntaxElem[] = [
    { tok: Token.EXPRESSION, val: 'logicalUnit' },
    { tok: Token.ENDINPUT },
];

export const STARTTOENDSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.EXPRESSION, val: 'start' },
            {
                optional: [
                    { tok: Token.TO },
                    { tok: Token.EXPRESSION, val: 'end' },
                ],
            },
        ],
    },
];

export const NOPARAMS: SyntaxElem[] = [{ tok: Token.ENDINPUT }];

// BSP <logical-unit>
export const BSPSyntax = LOGICALUNITSyntax;

// CALL number [, expression]
export const CALLSyntax: SyntaxElem[] = [
    { tok: Token.EXPRESSION, val: 'subroutineID' },
];

export const CALLParmSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.COMMA },
            { tok: Token.EXPRESSION, val: 'param' },
        ],
    },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];

// DATA <constant> [, <constant>]*
export const DATASyntax: SyntaxElem[] = [
    { optional: [{ tok: Token.EXPRESSION, val: 'dataitem' }] },
    { optional: [{ tok: Token.COMMA, val: 'comma' }] },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];

// DEF FNx(L)= ANYTHING
// Note that we just take everything after the = and process it later
export const DEFSyntax: SyntaxElem[] = [
    { tok: Token.FN, val: 'fndef' },
    { tok: Token.LPAREN },
    { tok: Token.VARIABLE, val: 'parm' },
    { tok: Token.RPAREN },
    { tok: Token.EQUAL },
];

// DIM variable(<bounds1> [, <bounds2>])[,variable(<bounds1> [, <bounds2>])]*
export const DIMSyntax: SyntaxElem[] = [
    //{ tok: Token.VARIABLE, val: 'var' },
    { include: VariableRefSyntax },
    { tok: Token.LPAREN },
    { tok: Token.EXPRESSION, val: 'bounds1' },
    {
        optional: [
            { tok: Token.COMMA },
            { tok: Token.EXPRESSION, val: 'bounds2' },
        ],
    },
    { tok: Token.RPAREN },
    { optional: [{ tok: Token.COMMA, val: 'comma' }] },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];

// END
export const ENDSyntax = NOPARAMS;

// ENDTRACE
export const ENDTRACESyntax = NOPARAMS;

// FOR <var> = <start> TO <end> [ STEP <step> ]
export const FORSyntax: SyntaxElem[] = [
    { tok: Token.VARIABLE, val: 'var' },
    { tok: Token.EQUAL },
    { tok: Token.EXPRESSION, val: 'start' },
    { tok: Token.TO },
    { tok: Token.EXPRESSION, val: 'end' },
    { optional: [{ tok: Token.STEP }, { tok: Token.EXPRESSION, val: 'step' }] },
    { tok: Token.ENDINPUT },
];

// GOSUB <line>
export const GOSUBSyntax: SyntaxElem[] = [
    { tok: Token.EXPRESSION, val: 'line' },
    { tok: Token.ENDINPUT },
];

// GOTO <line>
export const GOTOSyntax: SyntaxElem[] = [
    { tok: Token.EXPRESSION, val: 'line' },
    { tok: Token.ENDINPUT },
];

// IF <expr> GOTO <number>
// IF <expr> THEN <number>
// IF <expr> THEN <statement>
export const IFSyntax: SyntaxElem[] = [
    { tok: Token.EXPRESSION, val: 'expr' },
    {
        optional: [
            { tok: Token.GOTO },
            { tok: Token.NUMBER, val: 'linenum' },
            { tok: Token.ENDINPUT },
        ],
    },
    {
        optional: [
            { tok: Token.THEN },
            { tok: Token.NUMBER, val: 'linenum' },
            { tok: Token.ENDINPUT },
        ],
    },
    { optional: [{ tok: Token.THEN, val: 'then' }] },
];

// input [ON (<unit>[,<record>])] variable-list
export const INPUTSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.ON },
            { tok: Token.LPAREN },
            { tok: Token.EXPRESSION, val: 'unit' },
            {
                optional: [
                    { tok: Token.COMMA },
                    { tok: Token.EXPRESSION, val: 'record' },
                ],
            },
            { tok: Token.RPAREN },
        ],
    },
    { include: VariableRefSyntax },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];

export const INPUTVarSyntax: SyntaxElem[] = [
    { optional: [{ tok: Token.COMMA }, { include: VariableRefSyntax }] },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];
// LET <var>=<expr>
export const LETSyntax: SyntaxElem[] = [
    { include: VariableRefSyntax },
    { tok: Token.EQUAL },
    { tok: Token.EXPRESSION, val: 'expression' },
    { tok: Token.ENDINPUT },
];

// NEXT <var>
export const NEXTSyntax: SyntaxElem[] = [
    { tok: Token.VARIABLE, val: 'var' },
    { tok: Token.ENDINPUT, val: 'endinput' },
];

//
export const ONSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.EXPRESSION, val: 'expression' },
            { tok: Token.GOTO, val: 'onaction' },
            { tok: Token.EXPRESSION, val: 'target' },
        ],
    },
    {
        optional: [
            { tok: Token.EXPRESSION, val: 'expression' },
            { tok: Token.THEN, val: 'onaction' },
            { tok: Token.EXPRESSION, val: 'target' },
        ],
    },
    {
        optional: [
            { tok: Token.EXPRESSION, val: 'expression' },
            { tok: Token.GOSUB, val: 'onaction' },
            { tok: Token.EXPRESSION, val: 'target' },
        ],
    },
    {
        optional: [
            { tok: Token.ERROR, val: 'onerror' },
            { tok: Token.GOTO },
            { tok: Token.EXPRESSION, val: 'target' },
            { tok: Token.ENDINPUT },
        ],
    },
    {
        optional: [
            { tok: Token.ERROR, val: 'onerror' },
            { tok: Token.THEN },
            { tok: Token.EXPRESSION, val: 'target' },
            { tok: Token.ENDINPUT },
        ],
    },
    { optional: [{ tok: Token.COMMA, val: 'comma' }] },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];

// Print [ON (<unit>)] <expr> [,|;]?
export const PRINTVarSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.EXPRESSION, val: 'expression' },
            { optional: [{ tok: Token.COMMA, val: 'comma' }] },
            { optional: [{ tok: Token.SEMI, val: 'semi' }] },
        ],
    },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];
export const PRINTSyntax: SyntaxElem[] = [
    { include: ONUNITSyntax },
    { include: PRINTVarSyntax },
];
// RANDOM
export const RANDOMSyntax = NOPARAMS;

// READ variable-list
export const READSyntax: SyntaxElem[] = [
    { include: VariableRefSyntax },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];

export const READVarSyntax: SyntaxElem[] = [
    { optional: [{ tok: Token.COMMA }, { include: VariableRefSyntax }] },
    { optional: [{ tok: Token.ENDINPUT, val: 'endinput' }] },
];
// RESTORE
export const RESTORESyntax = NOPARAMS;
// RETURN
export const RETURNSyntax = NOPARAMS;

// REW <logical-unit>
export const REWSyntax = LOGICALUNITSyntax;
// SETTRACE
export const SETTRACESyntax = NOPARAMS;
// STOP
export const STOPSyntax = NOPARAMS;

// WFM <logical-unit>
export const WFMSyntax = LOGICALUNITSyntax;

// LIST
// LIST ON '(' number ')'
// LIST ON '(' number ')' statement-no
// LIST ON '(' number ')' statement-no TO statement-no
export const LISTSyntax: SyntaxElem[] = [
    { include: ONUNITSyntax },
    { include: STARTTOENDSyntax },
    { tok: Token.ENDINPUT },
];

// LOAD <unit>
export const LOADSyntax = LOGICALUNITSyntax;
// PAUSE
export const PAUSESyntax = NOPARAMS;
// NEW
export const NEWSyntax = NOPARAMS;

// RUN [<statement>]
export const RUNSyntax: SyntaxElem[] = [
    { optional: [{ tok: Token.EXPRESSION, val: 'line' }] },
    { tok: Token.ENDINPUT },
];
// RENUM [<start>[,<increment>]]
export const RENUMSyntax: SyntaxElem[] = [
    {
        optional: [
            { tok: Token.EXPRESSION, val: 'start' },
            {
                optional: [
                    { tok: Token.COMMA },
                    { tok: Token.EXPRESSION, val: 'increment' },
                ],
            },
        ],
    },
    { tok: Token.ENDINPUT },
];
// SIZE
export const SIZESyntax = NOPARAMS;
// ERASE [<start>[TO <increment>]]
export const ERASESyntax: SyntaxElem[] = [
    { include: STARTTOENDSyntax },
    { tok: Token.ENDINPUT },
];

export const statementLookup: SyntaxLookup = {
    [Token.BSP]: BSPSyntax,
    [Token.CALL]: CALLSyntax,
    [Token.DATA]: DATASyntax,
    [Token.DEF]: DEFSyntax,
    [Token.DIM]: DIMSyntax,
    [Token.END]: ENDSyntax,
    [Token.ENDTRACE]: ENDTRACESyntax,
    [Token.FOR]: FORSyntax,
    [Token.GOSUB]: GOSUBSyntax,
    [Token.GOTO]: GOTOSyntax,
    [Token.IF]: IFSyntax,
    [Token.INPUT]: INPUTSyntax,
    [Token.LET]: LETSyntax,
    [Token.NEXT]: NEXTSyntax,
    [Token.ON]: ONSyntax,
    [Token.PRINT]: PRINTSyntax,
    [Token.RANDOM]: RANDOMSyntax,
    [Token.READ]: READSyntax,
    [Token.RESTORE]: RESTORESyntax,
    [Token.RETURN]: RETURNSyntax,
    [Token.REW]: REWSyntax,
    [Token.SETTRACE]: SETTRACESyntax,
    [Token.STOP]: STOPSyntax,
    [Token.WFM]: WFMSyntax,
    [Token.LIST]: LISTSyntax,
    [Token.LOAD]: LOADSyntax,
    [Token.PAUSE]: PAUSESyntax,
    [Token.NEW]: NEWSyntax,
    [Token.RUN]: RUNSyntax,
    [Token.RENUM]: RENUMSyntax,
    [Token.SIZE]: SIZESyntax,
    [Token.ERASE]: ERASESyntax,
};