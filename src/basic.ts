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
import { MAXLINE, Program } from './program';
import { Variables } from './variables';

export type outputFunction = (str: string) => void;
export class Basic {
    protected variables: Variables = new Variables();
    protected program: Program = new Program();
    protected tokenizer: Tokenizer = new Tokenizer();

    public execute(cmd: string, out: outputFunction): void {
        console.log(`Execute: ${cmd}`);
        // Parse the first token
        let token: Token;
        let outputUnit = 5;
        let tokenstr: string;
        this.tokenizer.setLine(cmd);
        [tokenstr, token] = this.tokenizer.getToken();
        console.log(`First Token ${tokenstr} - ${token}`);
        switch (token) {
            case Token.NUMBER:
                // This is a source line to be added / updated
                this.program.addLine(
                    Number(tokenstr),
                    this.tokenizer.getRemainder()
                );
                break;
            case Token.RUN:
                out('Run Requested\r\n');
                break;

            case Token.LIST:
                // LIST
                // LIST ON (number)
                // LIST ON (number) statement-no
                // LIST ON (number) statement-no TO statement-no

                [tokenstr, token] = this.tokenizer.getToken();
                if (token === Token.ON) {
                    [tokenstr, token] = this.tokenizer.getToken();
                    if (token !== Token.NUMBER) {
                        out(`ILLEGAL LIST ON VALUE '${tokenstr}\r\n`);
                        return;
                    }
                    outputUnit = Number(tokenstr);
                    [tokenstr, token] = this.tokenizer.getToken();
                }
                // See if we have a line number
                let firstLine: number | undefined = undefined;
                let lastLine: number | undefined = undefined;
                if (token === Token.NUMBER) {
                    firstLine = Number(tokenstr);
                    // See if they told us TO
                    [tokenstr, token] = this.tokenizer.getToken();
                    if (token === Token.TO) {
                        [tokenstr, token] = this.tokenizer.getToken();
                        if (token === Token.NUMBER) {
                            lastLine = Number(tokenstr);
                        }
                    }
                }
                if (firstLine === undefined) {
                    firstLine = 1;
                    lastLine = MAXLINE;
                } else if (lastLine === undefined) {
                    lastLine = firstLine;
                }
                const source = this.program.List(firstLine, lastLine);
                source.forEach((sourceLine) => {
                    out(
                        `${sourceLine.getLineNum()} ${sourceLine.getSource()}\r\n`
                    );
                });
                break;
            default:
                out(`UNHANDLED COMMAND '${tokenstr} - ${token}\r\n`);
                break;
        }
    }
}
