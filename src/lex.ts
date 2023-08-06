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
export enum Token {
    ENDINPUT = 'END-OF-INPUT',
    INVALID = 'INVALID',
    CARET = 'CARET',
    COMMA = 'COMMA',
    NUMBER = 'NUMBER',
    VARIABLE = 'VARIABLE',
    STRINGVAR = 'STRINGVAR',
    DOLLAR = 'DOLLAR',
    STRING = 'STRING',
    EQUAL = 'EQUAL',
    GREATER = 'GREATER',
    LESS = 'LESS',
    ABS = 'ABS',
    AND = 'AND',
    ATN = 'ATN',
    BSP = 'BSP',
    CALL = 'CALL',
    COS = 'COS',
    DATA = 'DATA',
    DEF = 'DEF',
    DELETE = 'DELETE',
    DET = 'DET',
    DIM = 'DIM',
    END = 'END',
    ENDTRACE = 'ENDTRACE',
    EOF = 'EOF',
    ERASE = 'ERASE',
    ERL = 'ERL',
    ERRSTRING = 'ERRSTRING',
    ERROR = 'ERROR',
    EXP = 'EXP',
    FILES = 'FILES',
    FN = 'FN',
    FOR = 'FOR',
    GOSUB = 'GOSUB',
    GOTO = 'GOTO',
    GREATEREQUAL = 'GREATEREQUAL',
    IDN = 'IDN',
    IF = 'IF',
    INPUT = 'INPUT',
    INT = 'INT',
    INV = 'INV',
    LEN = 'LEN',
    LESSEQUAL = 'LESSEQUAL',
    LET = 'LET',
    LIST = 'LIST',
    LOAD = 'LOAD',
    LOG = 'LOG',
    MAT = 'MAT',
    NEW = 'NEW',
    NEXT = 'NEXT',
    NOT = 'NOT',
    NOTEQUAL = 'NOTEQUAL',
    ON = 'ON',
    OR = 'OR',
    PAUSE = 'PAUSE',
    PRINT = 'PRINT',
    RANDOM = 'RANDOM',
    READ = 'READ',
    REM = 'REM',
    RENUM = 'RENUM',
    RESTORE = 'RESTORE',
    RETURN = 'RETURN',
    REW = 'REW',
    RND = 'RND',
    RUN = 'RUN',
    SETTRACE = 'SETTRACE',
    SGN = 'SGN',
    SIN = 'SIN',
    SIZE = 'SIZE',
    SQR = 'SQR',
    STEP = 'STEP',
    STOP = 'STOP',
    STRSTRING = 'STRSTRING',
    TAN = 'TAN',
    TAB = 'TAB',
    THEN = 'THEN',
    TO = 'TO',
    TRN = 'TRN',
    USING = 'USING',
    VAL = 'VAL',
    WFM = 'WFM',
    LPAREN = 'LPAREN',
    MINUS = 'MINUS',
    PLUS = 'PLUS',
    RPAREN = 'RPAREN',
    SEMI = 'SEMI',
    SLASH = 'SLASH',
    STAR = 'STAR',
    EXPRESSION = 'EXPRESSION',
}

enum TokenAction {
    CARET,
    COMMA,
    DIGIT,
    DOLLAR,
    DQUOTE,
    EQUAL,
    GATHER,
    GATHER_GREATER,
    GATHER_LESS,
    GATHER_END,
    K_ABS,
    K_AND,
    K_ATN,
    K_BSP,
    K_CALL,
    K_COS,
    K_DATA,
    K_DEF,
    K_DELETE,
    K_DET,
    K_DIM,
    K_END,
    K_ENDTRACE,
    K_EOF,
    K_ERASE,
    K_ERL,
    K_ERRSTRING,
    K_ERROR,
    K_EXP,
    K_FILES,
    K_FN,
    K_FOR,
    K_GOSUB,
    K_GOTO,
    K_GREATEREQUAL,
    K_IDN,
    K_IF,
    K_INPUT,
    K_INT,
    K_INV,
    K_LEN,
    K_LESSEQUAL,
    K_LET,
    K_LIST,
    K_LOAD,
    K_LOG,
    K_MAT,
    K_NEW,
    K_NEXT,
    K_NOT,
    K_NOTEQUAL,
    K_ON,
    K_OR,
    K_PAUSE,
    K_PRINT,
    K_RANDOM,
    K_READ,
    K_REM,
    K_RENUM,
    K_RESTORE,
    K_RETURN,
    K_REW,
    K_RND,
    K_RUN,
    K_SETTRACE,
    K_SGN,
    K_SIN,
    K_SIZE,
    K_SQR,
    K_STEP,
    K_STOP,
    K_STRSTRING,
    K_TAN,
    K_TAB,
    K_THEN,
    K_TO,
    K_TRN,
    K_USING,
    K_VAL,
    K_WFM,
    KEYORVAR,
    LPAREN,
    MINUS,
    PLUS,
    QUESTION,
    RPAREN,
    SEMI,
    SLASH,
    STAR,
    VAR,
    ERROR,
}

const LexAction: { [key: string]: TokenAction } = {
    /* 0 */ '0': TokenAction.DIGIT,
    /* 1 */ '1': TokenAction.DIGIT,
    /* 2 */ '2': TokenAction.DIGIT,
    /* 3 */ '3': TokenAction.DIGIT,
    /* 4 */ '4': TokenAction.DIGIT,
    /* 5 */ '5': TokenAction.DIGIT,
    /* 6 */ '6': TokenAction.DIGIT,
    /* 7 */ '7': TokenAction.DIGIT,
    /* 8 */ '8': TokenAction.DIGIT,
    /* 9 */ '9': TokenAction.DIGIT,
    /* . */ '.': TokenAction.DIGIT,
    /* - */ '-': TokenAction.MINUS,
    /* " */ '"': TokenAction.DQUOTE,
    /* $ */ $: TokenAction.DOLLAR,
    /* ( */ '(': TokenAction.LPAREN,
    /* ) */ ')': TokenAction.RPAREN,
    /* * */ '*': TokenAction.STAR,
    /* , */ ',': TokenAction.COMMA,
    /* / */ '/': TokenAction.SLASH,
    /* ; */ ';': TokenAction.SEMI,
    /* ^ */ '^': TokenAction.CARET,
    /* + */ '+': TokenAction.PLUS,
    /* < */ '<': TokenAction.GATHER_LESS,
    /* = */ '=': TokenAction.EQUAL,
    /* > */ '>': TokenAction.GATHER_GREATER,
    /* A */ A: TokenAction.KEYORVAR,
    /* B */ B: TokenAction.KEYORVAR,
    /* C */ C: TokenAction.KEYORVAR,
    /* D */ D: TokenAction.KEYORVAR,
    /* E */ E: TokenAction.KEYORVAR,
    /* F */ F: TokenAction.KEYORVAR,
    /* G */ G: TokenAction.KEYORVAR,
    /* H */ H: TokenAction.KEYORVAR,
    /* I */ I: TokenAction.KEYORVAR,
    /* J */ J: TokenAction.VAR,
    /* K */ K: TokenAction.VAR,
    /* L */ L: TokenAction.KEYORVAR,
    /* M */ M: TokenAction.KEYORVAR,
    /* N */ N: TokenAction.KEYORVAR,
    /* O */ O: TokenAction.KEYORVAR,
    /* P */ P: TokenAction.KEYORVAR,
    /* Q */ Q: TokenAction.KEYORVAR,
    /* R */ R: TokenAction.KEYORVAR,
    /* S */ S: TokenAction.KEYORVAR,
    /* T */ T: TokenAction.KEYORVAR,
    /* U */ U: TokenAction.KEYORVAR,
    /* V */ V: TokenAction.KEYORVAR,
    /* W */ W: TokenAction.KEYORVAR,
    /* X */ X: TokenAction.KEYORVAR,
    /* Y */ Y: TokenAction.VAR,
    /* Z */ Z: TokenAction.VAR,
    /* <= */ '<=': TokenAction.K_LESSEQUAL,
    /* <> */ '<>': TokenAction.K_NOTEQUAL,
    /* >= */ '>=': TokenAction.K_GREATEREQUAL,
    /* ABS */ AB: TokenAction.GATHER,
    ABS: TokenAction.K_ABS,
    /* AND */ AN: TokenAction.GATHER,
    AND: TokenAction.K_AND,
    /* ATN */ AT: TokenAction.GATHER,
    ATN: TokenAction.K_ATN,
    /* BSP */ BS: TokenAction.GATHER,
    BSP: TokenAction.K_BSP,
    /* CALL */ CA: TokenAction.GATHER,
    CAL: TokenAction.GATHER,
    CALL: TokenAction.K_CALL,
    /* COS */ CO: TokenAction.GATHER,
    COS: TokenAction.K_COS,
    /* DATA */ DA: TokenAction.GATHER,
    DAT: TokenAction.GATHER,
    DATA: TokenAction.K_DATA,
    /* DEF */ DE: TokenAction.GATHER,
    DEF: TokenAction.K_DEF,
    /* DELETE */ DEL: TokenAction.GATHER,
    DELE: TokenAction.GATHER,
    DELET: TokenAction.GATHER,
    DELETE: TokenAction.K_DELETE,
    /* DET */ DET: TokenAction.K_DET,
    /* DIM */ DI: TokenAction.GATHER,
    DIM: TokenAction.K_DIM,
    /* END */ EN: TokenAction.GATHER,
    END: TokenAction.GATHER_END,
    /* ENDTRACE */ ENDT: TokenAction.GATHER,
    ENDTR: TokenAction.GATHER,
    ENDTRA: TokenAction.GATHER,
    ENDTRAC: TokenAction.GATHER,
    ENDTRACE: TokenAction.K_ENDTRACE,
    /* EOF */ EO: TokenAction.GATHER,
    EOF: TokenAction.K_EOF,
    /* ERL */ ER: TokenAction.GATHER,
    ERL: TokenAction.K_ERL,
    /* ERASE */
    ERA: TokenAction.GATHER,
    ERAS: TokenAction.GATHER,
    ERASE: TokenAction.K_ERASE,
    /* ERR$ */ ERR: TokenAction.GATHER,
    ERR$: TokenAction.K_ERRSTRING,
    /* ERROR */ ERRO: TokenAction.GATHER,
    ERROR: TokenAction.K_ERROR,
    /* EXP */ EX: TokenAction.GATHER,
    EXP: TokenAction.K_EXP,
    /* FN */ FN: TokenAction.K_FN,
    /* FILES */ FI: TokenAction.GATHER,
    FIL: TokenAction.GATHER,
    FILE: TokenAction.GATHER,
    FILES: TokenAction.K_FILES,
    /* FOR */ FO: TokenAction.GATHER,
    FOR: TokenAction.K_FOR,
    /* GOSUB */ GO: TokenAction.GATHER,
    GOS: TokenAction.GATHER,
    GOSU: TokenAction.GATHER,
    GOSUB: TokenAction.K_GOSUB,
    /* GOTO */ GOT: TokenAction.GATHER,
    GOTO: TokenAction.K_GOTO,
    /* IDN */ ID: TokenAction.GATHER,
    IDN: TokenAction.K_IDN,
    /* IF */ IF: TokenAction.K_IF,
    /* INPUT */ IN: TokenAction.GATHER,
    INP: TokenAction.GATHER,
    INPU: TokenAction.GATHER,
    INPUT: TokenAction.K_INPUT,
    /* INT */ INT: TokenAction.K_INT,
    /* INV */ INV: TokenAction.K_INV,
    /* LEN */ LE: TokenAction.GATHER,
    LEN: TokenAction.K_LEN,
    /* LET */ LET: TokenAction.K_LET,
    /* LIST */ LI: TokenAction.GATHER,
    LIS: TokenAction.GATHER,
    LIST: TokenAction.K_LIST,
    /* LOAD */ LO: TokenAction.GATHER,
    LOA: TokenAction.GATHER,
    LOAD: TokenAction.K_LOAD,
    /* LOG */
    LOG: TokenAction.K_LOG,
    /* MAT */ MA: TokenAction.GATHER,
    MAT: TokenAction.K_MAT,
    /* NEW */ NE: TokenAction.GATHER,
    NEW: TokenAction.K_NEW,
    /* NEXT */
    NEX: TokenAction.GATHER,
    NEXT: TokenAction.K_NEXT,
    /* NOT */ NO: TokenAction.GATHER,
    NOT: TokenAction.K_NOT,
    /* ON */ ON: TokenAction.K_ON,
    /* OR */ OR: TokenAction.K_OR,
    /* PAUSE */ PA: TokenAction.GATHER,
    PAU: TokenAction.GATHER,
    PAUS: TokenAction.GATHER,
    PAUSE: TokenAction.K_PAUSE,
    /* PRINT */ PR: TokenAction.GATHER,
    PRI: TokenAction.GATHER,
    PRIN: TokenAction.GATHER,
    PRINT: TokenAction.K_PRINT,
    /* RANDOM */ RA: TokenAction.GATHER,
    RAN: TokenAction.GATHER,
    RAND: TokenAction.GATHER,
    RANDO: TokenAction.GATHER,
    RANDOM: TokenAction.K_RANDOM,
    /* READ */ RE: TokenAction.GATHER,
    REA: TokenAction.GATHER,
    READ: TokenAction.K_READ,
    /* REM */ REM: TokenAction.K_REM,
    /* RENUM */ REN: TokenAction.GATHER,
    RENU: TokenAction.GATHER,
    RENUM: TokenAction.K_RENUM,
    /* RESTORE */ RES: TokenAction.GATHER,
    REST: TokenAction.GATHER,
    RESTO: TokenAction.GATHER,
    RESTOR: TokenAction.GATHER,
    RESTORE: TokenAction.K_RESTORE,
    /* RETURN */ RET: TokenAction.GATHER,
    RETU: TokenAction.GATHER,
    RETUR: TokenAction.GATHER,
    RETURN: TokenAction.K_RETURN,
    /* REW */ REW: TokenAction.K_REW,
    /* RND */ RN: TokenAction.GATHER,
    RND: TokenAction.K_RND,
    /* RUN */ RU: TokenAction.GATHER,
    RUN: TokenAction.K_RUN,
    /* SETTRACE */ SE: TokenAction.GATHER,
    SET: TokenAction.GATHER,
    SETT: TokenAction.GATHER,
    SETTR: TokenAction.GATHER,
    SETTRA: TokenAction.GATHER,
    SETTRAC: TokenAction.GATHER,
    SETTRACE: TokenAction.K_SETTRACE,
    /* SGN */ SG: TokenAction.GATHER,
    SGN: TokenAction.K_SGN,
    /* SIN */ SI: TokenAction.GATHER,
    SIN: TokenAction.K_SIN,
    /* SIZE */ SIZ: TokenAction.GATHER,
    SIZE: TokenAction.K_SIZE,
    /* SQR */ SQ: TokenAction.GATHER,
    SQR: TokenAction.K_SQR,
    /* STEP */ ST: TokenAction.GATHER,
    STE: TokenAction.GATHER,
    STEP: TokenAction.K_STEP,
    /* STOP */ STO: TokenAction.GATHER,
    STOP: TokenAction.K_STOP,
    /* STR$ */ STR: TokenAction.GATHER,
    STR$: TokenAction.K_STRSTRING,
    /* TAN */ TA: TokenAction.GATHER,
    TAN: TokenAction.K_TAN,
    TAB: TokenAction.K_TAB,
    /* THEN */ TH: TokenAction.GATHER,
    THE: TokenAction.GATHER,
    THEN: TokenAction.K_THEN,
    /* TO */ TO: TokenAction.K_TO,
    /* TRN */ TR: TokenAction.GATHER,
    TRN: TokenAction.K_TRN,
    /* USING */ US: TokenAction.GATHER,
    USI: TokenAction.GATHER,
    USIN: TokenAction.GATHER,
    USING: TokenAction.K_USING,
    /* VAL */ VA: TokenAction.GATHER,
    VAL: TokenAction.K_VAL,
    /* WFM */ WF: TokenAction.GATHER,
    WFM: TokenAction.K_WFM,
};

const MapLexToken: { [key in TokenAction]?: Token } = {
    [TokenAction.CARET]: Token.CARET,
    [TokenAction.COMMA]: Token.COMMA,
    [TokenAction.DOLLAR]: Token.DOLLAR,
    [TokenAction.EQUAL]: Token.EQUAL,
    [TokenAction.GATHER_GREATER]: Token.GREATER,
    [TokenAction.GATHER_LESS]: Token.LESS,
    [TokenAction.K_ABS]: Token.ABS,
    [TokenAction.K_AND]: Token.AND,
    [TokenAction.K_ATN]: Token.ATN,
    [TokenAction.K_BSP]: Token.BSP,
    [TokenAction.K_CALL]: Token.CALL,
    [TokenAction.K_COS]: Token.COS,
    [TokenAction.K_DATA]: Token.DATA,
    [TokenAction.K_DEF]: Token.DEF,
    [TokenAction.K_DET]: Token.DET,
    [TokenAction.K_DIM]: Token.DIM,
    [TokenAction.K_END]: Token.END,
    [TokenAction.K_ENDTRACE]: Token.ENDTRACE,
    [TokenAction.K_EOF]: Token.EOF,
    [TokenAction.K_ERL]: Token.ERL,
    [TokenAction.K_ERASE]: Token.ERASE,
    [TokenAction.K_ERRSTRING]: Token.ERRSTRING,
    [TokenAction.K_ERROR]: Token.ERROR,
    [TokenAction.K_EXP]: Token.EXP,
    [TokenAction.K_FN]: Token.FN,
    [TokenAction.K_FOR]: Token.FOR,
    [TokenAction.K_GOSUB]: Token.GOSUB,
    [TokenAction.K_GOTO]: Token.GOTO,
    [TokenAction.K_GREATEREQUAL]: Token.GREATEREQUAL,
    [TokenAction.K_IDN]: Token.IDN,
    [TokenAction.K_IF]: Token.IF,
    [TokenAction.K_INPUT]: Token.INPUT,
    [TokenAction.K_INT]: Token.INT,
    [TokenAction.K_INV]: Token.INV,
    [TokenAction.K_LEN]: Token.LEN,
    [TokenAction.K_LESSEQUAL]: Token.LESSEQUAL,
    [TokenAction.K_LET]: Token.LET,
    [TokenAction.K_LOG]: Token.LOG,
    [TokenAction.K_MAT]: Token.MAT,
    [TokenAction.K_NEXT]: Token.NEXT,
    [TokenAction.K_NOT]: Token.NOT,
    [TokenAction.K_NOTEQUAL]: Token.NOTEQUAL,
    [TokenAction.K_ON]: Token.ON,
    [TokenAction.K_OR]: Token.OR,
    [TokenAction.K_PRINT]: Token.PRINT,
    [TokenAction.K_RANDOM]: Token.RANDOM,
    [TokenAction.K_READ]: Token.READ,
    [TokenAction.K_REM]: Token.REM,
    [TokenAction.K_RENUM]: Token.RENUM,
    [TokenAction.K_RESTORE]: Token.RESTORE,
    [TokenAction.K_RETURN]: Token.RETURN,
    [TokenAction.K_REW]: Token.REW,
    [TokenAction.K_RND]: Token.RND,
    [TokenAction.K_RUN]: Token.RUN,
    [TokenAction.K_SETTRACE]: Token.SETTRACE,
    [TokenAction.K_SGN]: Token.SGN,
    [TokenAction.K_SIN]: Token.SIN,
    [TokenAction.K_SQR]: Token.SQR,
    [TokenAction.K_STEP]: Token.STEP,
    [TokenAction.K_STOP]: Token.STOP,
    [TokenAction.K_STRSTRING]: Token.STRSTRING,
    [TokenAction.K_TAN]: Token.TAN,
    [TokenAction.K_TAB]: Token.TAB,
    [TokenAction.K_THEN]: Token.THEN,
    [TokenAction.K_TO]: Token.TO,
    [TokenAction.K_TRN]: Token.TRN,
    [TokenAction.K_USING]: Token.USING,
    [TokenAction.K_VAL]: Token.VAL,
    [TokenAction.K_WFM]: Token.WFM,
    [TokenAction.LPAREN]: Token.LPAREN,
    [TokenAction.MINUS]: Token.MINUS,
    [TokenAction.PLUS]: Token.PLUS,
    [TokenAction.RPAREN]: Token.RPAREN,
    [TokenAction.SEMI]: Token.SEMI,
    [TokenAction.SLASH]: Token.SLASH,
    [TokenAction.STAR]: Token.STAR,
    [TokenAction.K_DELETE]: Token.DELETE,
    [TokenAction.K_FILES]: Token.FILES,
    [TokenAction.K_LIST]: Token.LIST,
    [TokenAction.K_LOAD]: Token.LOAD,
    [TokenAction.K_NEW]: Token.NEW,
    [TokenAction.K_PAUSE]: Token.PAUSE,
    [TokenAction.K_SIZE]: Token.SIZE,
};

export type TokenItem = {
    tok: Token;
    tokenstr: string;
    pos: number;
};

export class Tokenizer {
    protected line: string = '';
    protected pos: number = 0;
    protected tokenstack: TokenItem[] = [];
    protected stackpos: number = 0;

    public getRemainder(): string {
        let pos = this.pos;
        if (this.stackpos < this.tokenstack.length) {
            pos = this.tokenstack[this.stackpos].pos;
        }
        return this.line.slice(pos);
    }
    /**
     *
     * @param line New line to parse
     */
    public setLine(line: string) {
        this.line = line;
        this.pos = 0;
        this.stackpos = 0;
        this.tokenstack = [];
    }
    /**
     * Get the next character on the line
     * @returns Next character on the line or '' for nothing remaining
     */
    public nextChar(): string {
        if (this.pos >= this.line.length) {
            return '';
        }
        const char = this.line.substring(this.pos, this.pos + 1);
        this.pos++;
        return char;
    }

    /**
     * Get the next non-blank character
     * @returns Next non-blank character on the line or '' for nothing remaining
     */
    public nextNonBlank(): string {
        let char = this.nextChar();
        while (char === ' ') {
            char = this.nextChar();
        }
        return char;
    }
    public pushBack(char: string): void {
        if (char !== '' && this.pos > 0) {
            this.pos--;
        }
    }
    public getDigits(initial: string): [string, string] {
        let char = this.nextChar();
        while (char >= '0' && char <= '9') {
            initial += char;
            char = this.nextChar();
        }
        return [initial, char];
    }
    /**
     *
     * @returns String with text of token and current token
     */

    public parseToken(): TokenItem {
        let char = this.nextNonBlank().toUpperCase();
        if (char === '') {
            return { pos: this.pos, tokenstr: char, tok: Token.ENDINPUT };
        }
        const pos = this.pos - 1;
        let action = LexAction[char];
        if (action === undefined) {
            return { pos: pos, tokenstr: char, tok: Token.INVALID };
        }
        let gathered = char;
        let tokentype = Token.INVALID;
        switch (action) {
            case TokenAction.DQUOTE:
                // Gather until we get the end quote
                gathered = '';
                char = this.nextChar();
                while (char !== '"') {
                    if (char === undefined) {
                        return {
                            pos: pos,
                            tokenstr: gathered,
                            tok: Token.INVALID,
                        };
                    }
                    gathered += char;
                    char = this.nextChar();
                }
                return { pos: pos, tokenstr: gathered, tok: Token.STRING };

            case TokenAction.DIGIT:
                // Parse a number of the form [0-9]*[.][0-9]*[E[+-]?[0-9]*]
                if (char !== '.') {
                    [gathered, char] = this.getDigits(gathered);
                    if (char === '.') {
                        gathered += char;
                    }
                }
                if (char === '.') {
                    [gathered, char] = this.getDigits(gathered);
                }
                // See if they have an exponent
                if (char.toUpperCase() === 'E') {
                    gathered += char;
                    char = this.nextNonBlank();
                    // Get the optional sign
                    if (char === '+' || char === '-') {
                        gathered += char;
                        char = this.nextNonBlank();
                    }
                    if (char < '0' || char > '9') {
                        return {
                            pos: pos,
                            tokenstr: gathered,
                            tok: Token.INVALID,
                        };
                    }
                    [gathered, char] = this.getDigits(gathered);
                }
                this.pushBack(char);
                return { pos: pos, tokenstr: gathered, tok: Token.NUMBER };

            case TokenAction.GATHER_GREATER:
                char = this.nextNonBlank();
                if (char === '=') {
                    return {
                        pos: pos,
                        tokenstr: gathered + char,
                        tok: Token.GREATEREQUAL,
                    };
                } else if (char === '>') {
                    return {
                        pos: pos,
                        tokenstr: gathered + char,
                        tok: Token.NOTEQUAL,
                    };
                }
                this.pushBack(char);
                return { pos: pos, tokenstr: gathered, tok: Token.GREATER };

            case TokenAction.GATHER_LESS:
                char = this.nextNonBlank();
                if (char === '=') {
                    return {
                        pos: pos,
                        tokenstr: gathered + char,
                        tok: Token.LESSEQUAL,
                    };
                }
                this.pushBack(char);
                return { pos: pos, tokenstr: gathered, tok: Token.LESS };

            case TokenAction.VAR:
            case TokenAction.KEYORVAR:
                char = this.nextNonBlank();
                // Looking for string variable like "A$"
                if (char === '$') {
                    return {
                        pos: pos,
                        tokenstr: gathered + char,
                        tok: Token.STRINGVAR,
                    };
                }

                tokentype = Token.VARIABLE;
                if (char >= '0' && char <= '9') {
                    // We have a variable for sure like A9 or possibly A9$
                    gathered += char;
                    char = this.nextNonBlank();
                    if (char === '$') {
                        gathered += char;
                        tokentype = Token.STRINGVAR;
                    } else {
                        this.pushBack(char);
                    }
                    return { pos: pos, tokenstr: gathered, tok: tokentype };
                }
                if (
                    action === TokenAction.VAR ||
                    LexAction[gathered + char.toUpperCase()] === undefined
                ) {
                    this.pushBack(char);
                    return { pos: pos, tokenstr: gathered, tok: tokentype };
                }
                action = LexAction[gathered + char.toUpperCase()];
                if (action === undefined) {
                    this.pushBack(char);
                    return { pos: pos, tokenstr: gathered, tok: Token.INVALID };
                }
                gathered += char.toUpperCase();

            // Fall through into the gather code
            case TokenAction.GATHER:
            case TokenAction.GATHER_END:
                char = this.nextNonBlank();
                // console.log(
                //     `Gathering: '${gathered}'+'${char}' action=${action}`
                // );
                while (
                    action === TokenAction.GATHER ||
                    action === TokenAction.GATHER_END
                ) {
                    let newAction = LexAction[gathered + char.toUpperCase()];
                    // console.log(
                    //     `Gather check: '${gathered}'+'${char}' action=${newAction}`
                    // );
                    if (newAction === undefined) {
                        if (action === TokenAction.GATHER_END) {
                            tokentype = Token.END;
                        } else {
                            tokentype = Token.INVALID;
                        }
                        this.pushBack(char);
                        return { pos: pos, tokenstr: gathered, tok: tokentype };
                    }
                    gathered += char.toUpperCase();
                    char = this.nextNonBlank();
                    action = newAction;
                    // console.log(
                    //     `Gatherloop: '${gathered}'+'${char}' action=${action}`
                    // );
                }
                // console.log(
                //     `ENDGatherloop: '${gathered}'+'${char}' action=${action}`
                // );
                if (action === TokenAction.K_FN) {
                    let fnc = char.toUpperCase();
                    if (fnc >= 'A' && fnc <= 'Z') {
                        return {
                            pos: pos,
                            tokenstr: gathered + fnc,
                            tok: Token.FN,
                        };
                    }
                    this.pushBack(char);
                    return { pos: pos, tokenstr: gathered, tok: Token.INVALID };
                }
                this.pushBack(char);

            // Fall into default action to map the keyword
            default:
                let lexType = MapLexToken[action];
                if (lexType !== undefined) {
                    return { pos: pos, tokenstr: gathered, tok: lexType };
                }
                break;
        }
        return { pos: pos, tokenstr: gathered, tok: tokentype };
    }
    /**
     * Get the next token (taking into account any token state pushback)
     * @returns Next token
     */
    public getToken(): [string, Token] {
        if (this.stackpos < this.tokenstack.length) {
            const tokenstr = this.tokenstack[this.stackpos].tokenstr;
            const token = this.tokenstack[this.stackpos].tok;
            this.stackpos++;
            return [tokenstr, token];
        }
        const item = this.parseToken();
        this.tokenstack.push(item);
        this.stackpos = this.tokenstack.length;
        return [item.tokenstr, item.tok];
    }
    /**
     * Save where we are in the parsing
     * @returns Save state to be restored later
     */
    public saveState(): number {
        return this.stackpos;
    }
    /**
     * Restore where we are in parsing.
     * @param pos Position to restore t
     */
    public restoreState(pos: number): void {
        this.stackpos = pos;
    }
}
