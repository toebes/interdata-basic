/**
 * Copyright (c) 2023 John Toebes
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *unit
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

import { IO } from './io';
import { Token, Tokenizer } from './lex';
import { MAXLINE, Program } from './program';
import {
    LETSyntax,
    PRINTVarSyntax,
    ParseResult,
    SyntaxElem,
    statementLookup,
} from './syntax';
import { Variables } from './variables';

const TABSTOP = 14;
const MAXOUTPUTLINE = 132;
type ForState = {
    var: string;
    end: number;
    step: number;
    sourceIndex: number;
};
export class Basic {
    protected variables = new Variables();
    protected program = new Program();
    protected tokenizer = new Tokenizer();
    public io = new IO();
    protected lastErrorString = '';
    protected lastErrorLine = 0;
    protected isRunning = false;
    protected isTracing = false;
    protected runSourceIndex = 0;
    protected forStack: ForState[] = [];

    protected cmdLookup: Partial<Record<Token, (parsed: ParseResult) => void>> =
        {
            [Token.RUN]: this.cmdRUN.bind(this),
            [Token.LIST]: this.cmdLIST.bind(this),
            [Token.ERASE]: this.cmdErase.bind(this),
            [Token.LET]: this.cmdLET.bind(this),
            [Token.NEW]: this.cmdNEW.bind(this),
            [Token.FOR]: this.cmdFOR.bind(this),
            [Token.NEXT]: this.cmdNEXT.bind(this),
            [Token.ENDTRACE]: this.cmdENDTRACE.bind(this),
            [Token.SETTRACE]: this.cmdSETTRACE.bind(this),
            [Token.PRINT]: this.cmdPRINT.bind(this),
        };

    public async doRun() {
        while (this.isRunning) {
            let source = this.program.getSourceLine(this.runSourceIndex);
            if (source === undefined) {
                this.io.WriteLine('END');
                this.isRunning = false;
                return;
            }
            this.runSourceIndex++;
            let cmd = source.getSource();
            if (this.isTracing) {
                this.io.WriteLine(`TRACE: ${source.getLineNum()}: ${cmd}`);
            }
            this.execute(cmd);
            if (this.isRunning) {
                await this.delay(1);
            }
        }
    }
    public delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public execute(cmd: string): void {
        // Parse the first token

        let token: Token;
        let tokenstr: string;
        this.tokenizer.setLine(cmd);
        const state = this.tokenizer.saveState();
        [tokenstr, token] = this.tokenizer.getToken();

        // See of we have a parser for this type of token
        let parsed: ParseResult = {};

        let syntax: SyntaxElem[] | undefined;
        if (token === Token.VARIABLE || token === Token.STRINGVAR) {
            this.tokenizer.restoreState(state);
            parsed = this.Parse(this.tokenizer, LETSyntax);
            token = Token.LET;
        } else if ((syntax = statementLookup[token]) !== undefined) {
            parsed = this.Parse(this.tokenizer, syntax);
        }
        // If it failed to parse, let them know
        if (parsed.error !== undefined) {
            this.io.WriteLine(parsed.error as string);
            return;
        }
        // Line Numbers are for storing a line
        if (token === Token.NUMBER) {
            return this.storeLine(tokenstr);
        }
        // See if we have a command handler for the command
        let cmdFunc = this.cmdLookup[token];
        if (cmdFunc !== undefined) {
            return cmdFunc(parsed);
        }
        // We don't handle the command so let them know
        this.io.WriteLine(`UNHANDLED COMMAND '${tokenstr} - ${token}`);
    }
    /**
     * Empty out program
     * @param parsed Parsed structure
     */
    private cmdNEW(parsed: ParseResult) {
        this.program.EraseRange(0, MAXLINE);
        this.variables.New();
    }
    public programError(msg: string) {
        // See if we have an ON ERROR in effect first
        this.isRunning = false;
        this.io.WriteLine(msg);
    }

    public isNumber(val: string): boolean {
        const trimmedStr = val.trim();
        return trimmedStr !== '' && !isNaN(Number(trimmedStr));
    }
    // Numbers in the range .1 to 999999 are printed using 6 significant digits
    public formatNumber(num: number, significantDigits: number = 1): string {
        if (num === 0) {
            return '0';
        }
        let sign = '';
        if (num < 0) {
            num = -num;
            sign = '-';
        }
        //if (num >= 0.1 && num <= 999999) {
        let result = String(num);
        if (result.indexOf('e') < 0) {
            let pieces = (result + '..').split('.');
            let limit = 7;
            if (pieces[0] === '0') {
                result = '.' + pieces[1];
            } else if (pieces[1] != '') {
                result = pieces[0] + '.' + pieces[1];
            } else {
                result = pieces[0];
                limit = 6;
            }
            if (result.length <= limit) {
                return sign + result;
            }
        }
        //}
        const exponentString = num.toExponential(6);
        const match = /^-?(\d\.\d{0,6})e([-+]\d+)$/.exec(exponentString);
        if (match === null) {
            return '?' + String(num) + '?';
        }
        let mantissa = Number(match[1]);
        let expval = Number(match[2]);

        while (mantissa > 1) {
            mantissa /= 10;
            expval++;
        }

        let esign = '';
        if (expval > 0) {
            esign = '+';
        }
        return `${sign}${String(mantissa).replace(/^0/, '')}E${esign}${expval}`;
    }

    // print .00000002
    // print -.0002
    // print 200
    // print -200.002
    // print 2000000
    // print -20000000000
    // print -2.000
    // print 00.0

    public cmdPRINT(parsed: ParseResult) {
        if (parsed.using) {
            this.programError('PRINT USING NOT YET SUPPORTED');
            return;
        }
        let logicalUnit = this.io.GetUnit(parsed.unit);
        while (parsed.printitem !== undefined) {
            let out = '';
            if (parsed.tab !== undefined) {
                let tabpos = Number(parsed.tab);
                if (
                    !isNaN(tabpos) &&
                    tabpos < MAXOUTPUTLINE &&
                    tabpos > logicalUnit.tabPos
                ) {
                    out = ' '.repeat(tabpos - 1 - logicalUnit.tabPos);
                }
            } else if (!this.isNumber(parsed.expression)) {
                out = parsed.expression;
            } else {
                out = this.formatNumber(Number(parsed.expression));
            }
            // If it won't fit on the line we put it on the next one
            if (logicalUnit.tabPos + out.length > MAXOUTPUTLINE) {
                logicalUnit.outputFunction('\r\n');
                logicalUnit.tabPos = 0;
            }
            // See how we need to adjust the value..
            if (parsed.tab === undefined && parsed.semi !== undefined) {
                out += ' ';
            } else if (parsed.tab === undefined && parsed.comma !== undefined) {
                // Tabstops are every 14. So pad it with the correct number of spaces to get to the next tabstop
                out += ' '.repeat(
                    TABSTOP - ((logicalUnit.tabPos + out.length) % TABSTOP)
                );
            } else if (parsed.endinput !== undefined) {
                out += '\r\n';
                logicalUnit.outputFunction(out);
                logicalUnit.tabPos = 0;
                return;
            }
            logicalUnit.tabPos += out.length;
            logicalUnit.outputFunction(out);
            parsed = this.Parse(this.tokenizer, PRINTVarSyntax);
        }
        // IF we didn't get all the way to the end of the print line, something is wrong
        if (!parsed.endinput) {
            this.programError('SYNTAX ERROR');
        }
    }
    public cmdENDTRACE(parsed: ParseResult) {
        this.isTracing = false;
    }
    public cmdSETTRACE(parsed: ParseResult) {
        this.isTracing = true;
    }

    /**
     * For loop
     * @param parsed Parsed structure
     */
    private cmdFOR(parsed: ParseResult) {
        if (this.forStack.length >= 6) {
            this.programError(`FOR LOOP NESTED MORE THAN 6 DEEP`);
            return;
        }
        // Make sure the variable isn't in in the stack
        if (this.forStack.findIndex((state) => state.var === parsed.var) >= 0) {
            this.programError(`CAN'T REUSE FOR VARIABLE ${parsed.var}`);
            return;
        }
        let step = 1;
        if (parsed.step !== undefined) {
            step = Number(parsed.step);
        }
        this.forStack.push({
            var: parsed.var,
            end: Number(parsed.end),
            step: step,
            sourceIndex: this.runSourceIndex,
        });
        this.variables.SetNumericVar(parsed.var, Number(parsed.start));
    }
    /**
     * Next
     * @param parsed Parsed structure
     */
    private cmdNEXT(parsed: ParseResult) {
        const nextIndex = this.forStack.findIndex(
            (state) => state.var === parsed.var
        );

        if (nextIndex === -1) {
            this.programError(`NO FOR IN PROGRESS FOR ${parsed.var}`);
            return;
        }
        let state = this.forStack[nextIndex];
        let [current, emsg] = this.variables.GetNumbericVar(state.var);

        if (emsg !== '') {
            this.programError(emsg);
            return;
        }
        if (current === undefined) {
            current = 0;
        }
        current += state.step;
        this.variables.SetNumericVar(state.var, current);
        // See if we are counting up or down
        if (
            (state.step > 0 && current > state.end) ||
            (state.step < 0 && current < state.end)
        ) {
            // We are done with the loop, so purge the stack to this point
            this.forStack.splice(nextIndex, this.forStack.length - nextIndex);
        } else {
            // We have to continue the loop, but if there is anything on the stack above us, remove them
            if (nextIndex < this.forStack.length) {
                this.forStack.splice(
                    nextIndex + 1,
                    this.forStack.length - nextIndex
                );
            }
            this.runSourceIndex = state.sourceIndex;
        }
    }

    /**
     * Process LET command
     * @param parsed Parsed structure
     */
    private cmdLET(parsed: ParseResult) {
        let varname = parsed.variable as string;
        let isString = false;
        if (varname.substring(varname.length - 1) === '$') {
            isString = true;
        }
        let emsg = '';

        if (parsed.index1 === undefined) {
            if (isString) {
                emsg = this.variables.setString(
                    varname,
                    parsed.expression as string
                );
            } else {
                emsg = this.variables.SetNumericVar(
                    varname,
                    Number(parsed.expression)
                );
            }
        } else if (parsed.index2 === undefined) {
            if (isString) {
                emsg = this.variables.SetStringArray(
                    varname,
                    Number(parsed.index1),
                    parsed.expression as string
                );
            } else {
                emsg = this.variables.SetNumeric1DArray(
                    varname,
                    Number(parsed.index1),
                    Number(parsed.expression)
                );
            }
        } else {
            if (isString) {
                emsg = this.variables.setSubString(
                    varname,
                    Number(parsed.index1),
                    Number(parsed.index2),
                    parsed.expression as string
                );
            } else {
                emsg = this.variables.SetNumeric2DArray(
                    varname,
                    Number(parsed.index1),
                    Number(parsed.index2),
                    Number(parsed.expression)
                );
            }
        }
        if (emsg !== '') {
            this.io.WriteLine(emsg);
        }
    }

    private cmdErase(parsed: ParseResult) {
        if (parsed.start === undefined) {
            // erase all
            this.program.EraseRange(0, MAXLINE);
        } else if (parsed.end === undefined) {
            this.program.Erase(Number(parsed.start));
        } else {
            this.program.EraseRange(Number(parsed.start), Number(parsed.end));
        }
    }

    private cmdLIST(parsed: ParseResult) {
        let firstLine = 1;
        let lastLine = MAXLINE;
        if (parsed.start !== undefined) {
            firstLine = Number(parsed.start);
            if (parsed.end === undefined) {
                lastLine = firstLine;
            } else {
                lastLine = Number(parsed.end);
            }
        }

        let unit: string | undefined;
        if (parsed.unit !== undefined) {
            unit = parsed.unit;
        }
        const source = this.program.List(firstLine, lastLine);
        source.forEach((sourceLine) => {
            this.io.WriteLine(
                `${sourceLine.getLineNum()} ${sourceLine.getSource()}`,
                unit
            );
        });
    }

    private cmdRUN(parsed: ParseResult) {
        if (parsed.line !== undefined) {
            // Find the line number
            const spot = this.program.findLineIndex(Number(parsed.line));
            if (spot === undefined) {
                this.io.WriteLine(`LINE ${parsed.line} NOT FOUND`);
                return;
            }
            this.runSourceIndex = spot;
        } else {
            this.variables.New();
            this.runSourceIndex = 0;
            this.forStack = [];
        }
        this.isRunning = true;
        this.doRun();
    }

    public Break() {
        this.io.WriteLine('*BREAK*');
    }

    private storeLine(tokenstr: string) {
        this.program.addLine(Number(tokenstr), this.tokenizer.getRemainder());
    }

    public MatchToken(source: Tokenizer, tokenMatch: Token[]): Token {
        const saveState = source.saveState();
        const [tokenstr, token] = source.getToken();
        if (tokenMatch.includes(token)) {
            return token;
        }
        source.restoreState(saveState);
        return Token.INVALID;
    }
    public EvalExpression1(source: Tokenizer): [string, string | undefined] {
        const tokenMatch = [
            Token.NUMBER,
            Token.STRING,
            Token.VARIABLE,
            Token.STRINGVAR,
            Token.LPAREN,
        ];
        const tokenFuncMatch = [
            Token.SIN,
            Token.COS,
            Token.TAN,
            Token.ATN,
            Token.LOG,
            Token.EXP,
            Token.SQR,
            Token.ABS,
            Token.INT,
            Token.RND,
            Token.NOT,
            Token.SGN,
            Token.LEN,
            Token.EOF,
            Token.VAL,
            Token.STRSTRING,
            Token.ERRSTRING,
            Token.ERL,
            Token.FN,
        ];

        const [tokenstr, token] = source.getToken();
        if (!tokenMatch.includes(token)) {
            if (!tokenFuncMatch.includes(token)) {
                return [
                    '0',
                    `SYNTAX ERROR PARSING EXPRESSION - UNEXPECTED '${tokenstr}'`,
                ];
            }
            // parse the ( parameter )
            if (!this.MatchToken(source, [Token.LPAREN])) {
                return [tokenstr, `SYNTAX ERROR - MISSING (`];
            }
            let [value, emsg] = this.EvalExpression(source);
            if (emsg !== undefined) {
                return [value, emsg];
            }
            if (!this.MatchToken(source, [Token.RPAREN])) {
                return [value, `SYNTAX ERROR - MISSING )`];
            }
            // We have the data, now process the function
            switch (token) {
                case Token.SIN:
                    value = String(Math.sin(Number(value)));
                    break;
                case Token.COS:
                    value = String(Math.cos(Number(value)));
                    break;
                case Token.TAN:
                    value = String(Math.tan(Number(value)));
                    break;
                case Token.ATN:
                    value = String(Math.atan(Number(value)));
                    break;
                case Token.LOG:
                    value = String(Math.log(Number(value)));
                    break;
                case Token.EXP:
                    value = String(Math.exp(Number(value)));
                    break;
                case Token.SQR:
                    value = String(Math.sqrt(Number(value)));
                    break;
                case Token.ABS:
                    value = String(Math.abs(Number(value)));
                    break;
                case Token.INT:
                    value = String(Math.trunc(Number(value)));
                    break;
                case Token.RND:
                    value = String(Math.random());
                    break;
                case Token.NOT:
                    value = String(!value);
                    break;
                case Token.SGN:
                    let num = Number(value);
                    value = num < 0 ? '-1' : num === 0 ? '0' : '1';
                    break;
                case Token.LEN:
                    value = String(value.length);
                    break;
                case Token.EOF:
                    value = this.io.isEOF() ? '1' : '0';
                    break;
                case Token.VAL:
                    value = String(Number(value));
                    break;
                case Token.STRSTRING:
                    break;
                case Token.ERRSTRING:
                    value = this.lastErrorString;
                    break;
                case Token.ERL:
                    value = String(this.lastErrorLine);
                    break;
                case Token.FN:
                    return [value, `FN NOT YET IMPLEMENTED`];
            }
            return [value, undefined];
        }
        switch (token) {
            case Token.NUMBER:
            case Token.STRING:
                return [tokenstr, undefined];
            case Token.LPAREN:
                let [value, emsg] = this.EvalExpression(source);
                if (emsg !== undefined) {
                    return [value, emsg];
                }
                if (!this.MatchToken(source, [Token.RPAREN])) {
                    return [value, `SYNTAX ERROR - MISSING )`];
                }
                return [value, undefined];
            case Token.STRINGVAR:
            case Token.VARIABLE:
                if (this.MatchToken(source, [Token.LPAREN]) === Token.LPAREN) {
                    // Array or substring
                    return [
                        tokenstr,
                        `NOT IMPLEMENTED LOOKING UP INDEXED VARIABLES YET`,
                    ];
                } else {
                    // Simple variable
                    if (token == Token.STRINGVAR) {
                        return this.variables.getString(tokenstr);
                    }
                    let [numval, emsg] =
                        this.variables.GetNumbericVar(tokenstr);
                    if (numval === undefined) {
                        numval = 0;
                    }
                    if (emsg === '') {
                        return [String(numval), undefined];
                    }
                    return [String(numval), emsg];
                }
        }
        return ['0', 'UNRECOGNIZED TOKEN'];
    }

    public EvalExpression2(source: Tokenizer): [string, string | undefined] {
        const token = this.MatchToken(source, [Token.PLUS, Token.MINUS]);
        let [value, emsg] = this.EvalExpression1(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        if (token === Token.MINUS) {
            value = String(-Number(value));
        }
        return [value, undefined];
    }

    public EvalExpression3(source: Tokenizer): [string, string | undefined] {
        let [value, emsg] = this.EvalExpression2(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        const token = this.MatchToken(source, [Token.CARET]);
        if (token !== Token.INVALID) {
            const [value2, emsg2] = this.EvalExpression3(source);
            if (emsg2 !== undefined) {
                return [value2, emsg2];
            }
            // Evaluate the expression
            value = String(Math.pow(Number(value), Number(value2)));
        }
        return [value, undefined];
    }
    public EvalExpression4(source: Tokenizer): [string, string | undefined] {
        let [value, emsg] = this.EvalExpression3(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        const token = this.MatchToken(source, [Token.STAR, Token.SLASH]);
        if (token !== Token.INVALID) {
            const [value2, emsg2] = this.EvalExpression4(source);
            if (emsg2 !== undefined) {
                return [value2, emsg2];
            }
            // Evaluate the expression
            switch (token) {
                case Token.STAR:
                    value = String(Number(value) * Number(value2));
                    break;
                case Token.SLASH:
                    value = String(Number(value) / Number(value2));
                    break;
            }
        }
        return [value, undefined];
    }
    public EvalExpression5(source: Tokenizer): [string, string | undefined] {
        let [value, emsg] = this.EvalExpression4(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        const token = this.MatchToken(source, [Token.PLUS, Token.MINUS]);
        if (token !== Token.INVALID) {
            const [value2, emsg2] = this.EvalExpression5(source);
            if (emsg2 !== undefined) {
                return [value2, emsg2];
            }
            // Evaluate the expression
            switch (token) {
                case Token.PLUS:
                    value = String(Number(value) + Number(value2));
                    break;
                case Token.MINUS:
                    value = String(Number(value) - Number(value2));
                    break;
            }
        }
        return [value, undefined];
    }

    public EvalExpression6(source: Tokenizer): [string, string | undefined] {
        let [value, emsg] = this.EvalExpression5(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        const token = this.MatchToken(source, [
            Token.EQUAL,
            Token.LESS,
            Token.GREATER,
            Token.GREATEREQUAL,
            Token.NOTEQUAL,
        ]);
        if (token !== Token.INVALID) {
            const [value2, emsg2] = this.EvalExpression6(source);
            if (emsg2 !== undefined) {
                return [value2, emsg2];
            }
            // Evaluate the expression
            switch (token) {
                case Token.EQUAL:
                    value = value == value2 ? '1' : '0';
                    break;
                case Token.LESS:
                    value = value < value2 ? '1' : '0';
                    break;
                case Token.GREATER:
                    value = value > value2 ? '1' : '0';
                    break;
                case Token.GREATEREQUAL:
                    value = value >= value2 ? '1' : '0';
                    break;
                case Token.NOTEQUAL:
                    value = value != value2 ? '1' : '0';
                    break;
            }
        }
        return [value, undefined];
    }
    public EvalExpression7(source: Tokenizer): [string, string | undefined] {
        let [value, emsg] = this.EvalExpression6(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        const token = this.MatchToken(source, [Token.AND]);
        if (token == Token.AND) {
            const [value2, emsg2] = this.EvalExpression7(source);
            if (emsg2 !== undefined) {
                return [value2, emsg2];
            }
            // Evaluate the AND
            value = String(!!Number(value) && !!Number(value2));
        }
        return [value, undefined];
    }
    /**
     *
     * @param source
     * @returns
     */
    public EvalExpression(source: Tokenizer): [string, string | undefined] {
        let [value, emsg] = this.EvalExpression7(source);
        if (emsg !== undefined) {
            return [value, emsg];
        }
        const token = this.MatchToken(source, [Token.OR]);
        if (token == Token.OR) {
            const [value2, emsg2] = this.EvalExpression(source);
            if (emsg2 !== undefined) {
                return [value2, emsg2];
            }
            // Evaluate the OR
            value = String(!!Number(value) || !!Number(value2));
        }
        return [value, undefined];
    }
    /**
     * Parse source code using a given syntax structure
     * @param source Source code line to parse
     * @param syntax Syntax elements to parse against
     * @returns map of values parsed
     */
    public Parse(source: Tokenizer, syntax: SyntaxElem[]): ParseResult {
        let result: ParseResult = {};
        for (let syntaxElem of syntax) {
            if (syntaxElem.tok !== undefined) {
                let tokenstr = '';
                let token = Token.INVALID;
                if (syntaxElem.tok === Token.EXPRESSION) {
                    let emsg = undefined;
                    [tokenstr, emsg] = this.EvalExpression(source);

                    if (emsg !== undefined) {
                        result['error'] = emsg;
                        return result;
                    }
                    if (syntaxElem.val !== undefined) {
                        result[syntaxElem.val] = tokenstr;
                    }
                } else {
                    [tokenstr, token] = source.getToken();

                    if (
                        token === Token.STRINGVAR &&
                        syntaxElem.tok === Token.VARIABLE
                    ) {
                        token = Token.VARIABLE;
                    }
                    if (token !== syntaxElem.tok) {
                        // The token doesn't match so we need to generate an error and skip out
                        result[
                            'error'
                        ] = `SYNTAX ERROR: EXPECTED ${syntaxElem.tok} BUT FOUND ${tokenstr}/${token}`;
                        return result;
                    }
                }
                if (syntaxElem.val !== undefined) {
                    result[syntaxElem.val] = tokenstr;
                }
            }
            if (syntaxElem.include !== undefined) {
                let subData = this.Parse(source, syntaxElem.include);
                result = { ...result, ...subData };
                if (result['error'] !== undefined) {
                    return result;
                }
            }
            if (syntaxElem.optional !== undefined) {
                if (
                    syntaxElem.val === undefined ||
                    result[syntaxElem.val] === undefined
                ) {
                    const saveState = source.saveState();
                    let subData = this.Parse(source, syntaxElem.optional);
                    if (subData['error'] === undefined || syntaxElem.needed) {
                        result = { ...result, ...subData };
                        if (syntaxElem.val !== undefined) {
                            result[syntaxElem.val] = '1';
                        }
                    } else {
                        source.restoreState(saveState);
                    }
                }
            }
        }
        return result;
    }
}
