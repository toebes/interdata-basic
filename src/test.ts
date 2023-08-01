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
import { Token, Tokenizer } from './lex';

function testline(tokenizer: Tokenizer, line: string) {
    tokenizer.setLine(line);
    let token: Token;
    let tokenstr: string;

    console.log(`Testing '${line}'`);

    [tokenstr, token] = tokenizer.getToken();
    while (token !== Token.INVALID) {
        console.log(`'${tokenstr}' -- ${token}`);
        [tokenstr, token] = tokenizer.getToken();
    }
}

const testlines: string[] = [
    // 'A1-2',
    // 'SIN (X+. 02)',
    // 'A(I+1, J+1) * A/2',
    // 'SIN (COS(X) ) * (-D)',
    // '1. 5 * . 0356',
    // 'INPUT ON (7) X, Y, Z',
    // 'IF EOF(O) = 1 THEN PRINT "EOF"',
    // 'ON ERROR GO TO 450',
    // 'PRINT ON (3) "THE RESULTS ARE", X, Y',
    // 'Z= ERL (X)',
    // 'A$=ERR$ (X)',
    // 'PRINT A$, "ERROR AT", Z',
    // 'PRINT "RUN", Z, "TO CONTINUE"',
    // 'STOP',
    // 'PRINT A$ (1, 4)',
    // 'LET B$ ="RESULTS ARE:"',
    // 'IF A$ (I, I)= B$ (J, J) GO TO 100',
    // 'INPUT C$, D$ (2, 2)',
    // 'LET A1$ (2) = "COLD"',
    // 'DIM A$ (50), B$ (50)',
    // 'LET A$ = "@2. 50 EACH, THE PROFIT MARGIN IS 15. 8%"',
    // 'LET B$ =A$ (1, 3) + "25" +A$ (6, 33) + "11. 2%" ',
    // 'DIM A$ (6)',
    // 'LET A$ = "AAABBB"',
    // 'LET A$ (2, 4) = "CCC"',
    // 'LET A$ (2, 4) = "DD"',
    // 'LET A$ (2, 6) = ""',
    // 'LET B=C+2.1417',
    // 'A=A+1',
    // 'LET W1=( (A+B) *J/3)*COS (M)',
    // 'X=0',
    // 'LET A$="NOW"',
    // 'LET B$="IS THE"',
    // 'B$=A$+B$+"TIME"',
    // 'LET B$ (1, 2) =A$ (3, 5) +"LET"',
    // 'E1$ (3) = E1$ (2) +A$',
    // 'DEF FNA (X)= EXP (X ^ 2)',
    // 'LET Y = Y*FNA (.1)',
    // 'IF FNA (A+3) > Y THEN 150',
    // 'LET P = 3. 1416',
    // 'DEF FNB (X) = X*P/180',
    // 'DEF FNS (X) = SIN (FNB (X) )',
    // 'DEF FNO (X) = COS (FNB (X) )',
    // 'FOR X=0 TO 45 STEP 5',
    // 'PRINT X, FNS (X), FNO (X)',
    // 'NEXT X .',
    // 'LET X=FNS (FNO (X) ) + 1',
    // 'FOR X = 1 TO 100',
    // 'FOR Y = 1 TO 50',
    // 'LET Z = A (Y)',
    // 'PRINT Z+X',
    // 'IF Z < 0 GOTO 70',
    // 'NEXT Y',
    // 'NEXT X',
    // 'LETX = 5',
    // 'GOSUB 50',
    // 'LETX = 7',
    // 'GOSUB 51',
    // 'STOP',
    // 'LET Y = 3*X',
    // 'LET Z = 1. 2*EXP (Y)',
    // 'PRINT X, Y',
    // 'RETURN ',
    // 'DATA 10, -5, -2, 6, -6, 21, -9',
    // 'READ X',
    'LET A= SQR (X ^ 2) + Y*X *FNC (X)',
    'PRINT X, A',
    'GO TO 200',
    'REM- SOLVE A QUADRATIC EQUATION',
    'READ A, B, C',
    'LET X= B*B-4*A*C',
    'IF X < 0 GOTO 999',
    'LET X1 = (-B+SQR (X) ) /2*A',
    'LET X2 = (-B-SQR (X) ) /2*A',
    'PRINT X1, X2',
    'GOTO 110',
    'DATA -1, 2, 3, +2, 3, -4, 2, 1, 6',
    'PRINT "NO REAL SOLUTION" ',
];

function test() {
    let tokenizer = new Tokenizer();
    for (let line of testlines) {
        testline(tokenizer, line);
    }
}

test();
