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

import { IO } from './io'
import { Token, Tokenizer } from './lex'
import { MAXLINE, Program } from './program'
import {
    ExpType,
    LETSyntax,
    PRINTVarSyntax,
    ParseResult,
    ExprVal,
    SyntaxElem,
    statementLookup,
    DIMSyntax,
    DATASyntax,
    READVarSyntax,
    ONChoiceSyntax,
    INPUTVarSyntax,
} from './syntax'
import { ErrMsg, Variables } from './variables'

const TABSTOP = 14
const MAXOUTPUTLINE = 132
const GOSUBDEPTH = 6
type ForState = {
    var: string
    end: number
    step: number
    sourceIndex: number
}

export class Basic {
    protected variables = new Variables()
    protected program = new Program()
    protected tokenizer = new Tokenizer()
    public io = new IO()
    protected lastErrorString = ''
    protected lastErrorLine = 0
    protected onErrorLine: number | undefined = undefined
    protected isRunning = false
    protected isTracing = false
    protected runSourceIndex = 0
    protected forStack: ForState[] = []
    protected fnInUse: { [id: string]: boolean } = {}
    protected gosubStack: number[] = []
    protected pushedCmd: string = ''
    protected dataPos: number = 0
    protected dataItems: ExprVal[] = []
    protected hasReadData = false

    protected cmdLookup: Partial<Record<Token, (parsed: ParseResult) => Promise<string>>> = {
        [Token.RUN]: this.cmdRUN.bind(this),
        [Token.LIST]: this.cmdLIST.bind(this),
        [Token.LOAD]: this.cmdLOAD.bind(this),
        [Token.ERASE]: this.cmdErase.bind(this),
        [Token.LET]: this.cmdLET.bind(this),
        [Token.NEW]: this.cmdNEW.bind(this),
        [Token.FOR]: this.cmdFOR.bind(this),
        [Token.NEXT]: this.cmdNEXT.bind(this),
        [Token.ENDTRACE]: this.cmdENDTRACE.bind(this),
        [Token.SETTRACE]: this.cmdSETTRACE.bind(this),
        [Token.PRINT]: this.cmdPRINT.bind(this),
        [Token.DIM]: this.cmdDIM.bind(this),
        [Token.GOTO]: this.cmdGOTO.bind(this),
        [Token.END]: this.cmdEND.bind(this),
        [Token.DEF]: this.cmdDEF.bind(this),
        [Token.GOSUB]: this.cmdGOSUB.bind(this),
        [Token.RETURN]: this.cmdRETURN.bind(this),
        [Token.IF]: this.cmdIF.bind(this),
        [Token.REM]: this.cmdREM.bind(this),
        [Token.DATA]: this.cmdDATA.bind(this),
        [Token.STOP]: this.cmdSTOP.bind(this),
        [Token.READ]: this.cmdREAD.bind(this),
        [Token.INPUT]: this.cmdINPUT.bind(this),
        [Token.RESTORE]: this.cmdRESTORE.bind(this),
        [Token.CALL]: this.cmdCALL.bind(this),
        [Token.REW]: this.cmdREW.bind(this),
        [Token.WFM]: this.cmdWFM.bind(this),
        [Token.BSP]: this.cmdBSP.bind(this),
        [Token.ON]: this.cmdON.bind(this),
        [Token.RENUM]: this.cmdRENUM.bind(this),
    }

    public async doRun(): Promise<void> {
        return new Promise(async (resolve) => {
            while (this.isRunning) {
                let source = this.program.getSourceLine(this.runSourceIndex)
                if (source === undefined) {
                    this.io.WriteLine('END')
                    this.isRunning = false
                    return resolve()
                }
                this.runSourceIndex++
                await this.execute(source.getSource(), source.getLineNum())
                if (this.isRunning) {
                    await this.delay(10)
                }
            }
            return resolve()
        })
    }
    public delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public async execute(cmd: string, lineNum?: number): Promise<void> {
        return new Promise(async (resolve) => {
            while (cmd !== '') {
                if (this.isTracing) {
                    if (lineNum !== undefined) {
                        this.io.WriteLine(`TRACE: ${lineNum}: ${cmd}`)
                    }
                }

                // Parse the first token
                let token: Token
                let tokenstr: string
                this.tokenizer.setLine(cmd)
                const state = this.tokenizer.saveState()
                ;[tokenstr, token] = this.tokenizer.getToken()

                // See of we have a parser for this type of token
                let parsed: ParseResult = {}

                let syntax: SyntaxElem[] | undefined
                if (token === Token.VARIABLE || token === Token.STRINGVAR) {
                    this.tokenizer.restoreState(state)
                    parsed = this.Parse(this.tokenizer, LETSyntax)
                    token = Token.LET
                } else if ((syntax = statementLookup[token]) !== undefined) {
                    parsed = this.Parse(this.tokenizer, syntax)
                }
                // If it failed to parse, let them know
                if (parsed.error !== undefined) {
                    cmd = this.programError(parsed.error as string)
                } else {
                    // Line Numbers are for storing a line
                    if (token === Token.NUMBER) {
                        this.storeLine(Number(tokenstr))
                        return resolve()
                    }
                    // See if we have a command handler for the command
                    let cmdFunc = this.cmdLookup[token]
                    if (cmdFunc !== undefined) {
                        cmd = await cmdFunc(parsed)
                    } else {
                        // We don't handle the command so let them know
                        cmd = this.programError(`UNKNOWN COMMAND '${tokenstr} - ${token}`)
                    }
                }
            }
            return resolve()
        })
    }
    /**
     * Empty out program
     * @param parsed Parsed structure
     */
    private cmdNEW(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.program.EraseRange(0, MAXLINE)
            this.resetRunState()
            return resolve('')
        })
    }

    public programError(msg: string): string {
        // See if we have an ON ERROR in effect first
        if (this.onErrorLine !== undefined) {
            let onErrorLine = this.onErrorLine
            this.onErrorLine = undefined
            this.lastErrorString = msg

            let lastErrorLine = this.getCurrentLineNum()
            if (lastErrorLine === undefined) {
                this.lastErrorLine = 0
            } else {
                this.lastErrorLine = lastErrorLine
            }
            return `GOTO ${onErrorLine}`
        }
        this.isRunning = false
        this.io.WriteLine(msg)
        return ''
    }

    public isNumber(val: string): boolean {
        const trimmedStr = val.trim()
        return trimmedStr !== '' && !isNaN(Number(trimmedStr))
    }
    // Numbers in the range .1 to 999999 are printed using 6 significant digits
    public formatNumber(num: number, significantDigits: number = 1): string {
        if (num === 0) {
            return '0'
        }
        let sign = ''
        if (num < 0) {
            num = -num
            sign = '-'
        }
        //if (num >= 0.1 && num <= 999999) {
        let result = String(num)
        if (result.indexOf('e') < 0) {
            let pieces = (result + '..').split('.')
            let limit = 7
            if (pieces[0] === '0') {
                result = '.' + pieces[1]
            } else if (pieces[1] != '') {
                result = pieces[0] + '.' + pieces[1]
            } else {
                result = pieces[0]
                limit = 6
            }
            if (result.length <= limit) {
                return sign + result
            }
        }
        //}
        const exponentString = num.toExponential(6)
        const match = /^-?(\d\.\d{0,6})e([-+]\d+)$/.exec(exponentString)
        if (match === null) {
            return '?' + String(num) + '?'
        }
        let mantissa = Number(match[1])
        let expval = Number(match[2])

        while (mantissa > 1) {
            mantissa /= 10
            expval++
        }

        let esign = ''
        if (expval > 0) {
            esign = '+'
        }
        return `${sign}${String(mantissa).replace(/^0/, '')}E${esign}${expval}`
    }

    // print .00000002
    // print -.0002
    // print 200
    // print -200.002
    // print 2000000
    // print -20000000000
    // print -2.000
    // print 00.0

    public cmdPRINT(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if (parsed.using) {
                return resolve(this.programError('PRINT USING NOT YET SUPPORTED'))
            }
            let logicalUnit = this.io.GetUnit(parsed.unit as number)
            while (parsed.printitem !== undefined) {
                let out = ''
                if (parsed.tab !== undefined) {
                    let tabpos = Number(parsed.tab)
                    if (!isNaN(tabpos) && tabpos < MAXOUTPUTLINE && tabpos > logicalUnit.tabPos) {
                        out = ' '.repeat(tabpos - 1 - logicalUnit.tabPos)
                    }
                } else if (typeof parsed.expression === 'number') {
                    out = this.formatNumber(parsed.expression)
                } else {
                    out = parsed.expression
                }
                // If it won't fit on the line we put it on the next one
                if (logicalUnit.tabPos + out.length > MAXOUTPUTLINE) {
                    logicalUnit.outputFunction('\r\n')
                    logicalUnit.tabPos = 0
                }
                // See how we need to adjust the value..
                if (parsed.tab === undefined && parsed.semi !== undefined) {
                    out += ' '
                } else if (parsed.tab === undefined && parsed.comma !== undefined) {
                    // Tabstops are every 14. So pad it with the correct number of spaces to get to the next tabstop
                    out += ' '.repeat(TABSTOP - ((logicalUnit.tabPos + out.length) % TABSTOP))
                } else if (parsed.endinput !== undefined) {
                    out += '\r\n'
                    logicalUnit.outputFunction(out)
                    logicalUnit.tabPos = 0
                    return resolve('')
                }
                logicalUnit.tabPos += out.length
                logicalUnit.outputFunction(out)
                parsed = this.Parse(this.tokenizer, PRINTVarSyntax)
                if (parsed.error !== undefined) {
                    return resolve(this.programError(parsed.error as string))
                }
            }
            // IF we didn't get all the way to the end of the print line, something is wrong
            if (parsed.endinput === undefined) {
                return resolve(this.programError('SY-ERR SYNTAX ERROR'))
            }
            return resolve('')
        })
    }

    public cmdENDTRACE(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.isTracing = false
            return resolve('')
        })
    }
    public cmdSETTRACE(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.isTracing = true
            return resolve('')
        })
    }

    /**
     * For loop
     * @param parsed Parsed structure
     */
    private cmdFOR(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if (this.forStack.length >= 6) {
                return resolve(this.programError(`FR-ERR FOR LOOP NESTED MORE THAN 6 DEEP`))
            }
            // Make sure the variable isn't in in the stack
            if (this.forStack.findIndex((state) => state.var === parsed.var) >= 0) {
                return resolve(this.programError(`FR-ERR CAN'T REUSE FOR VARIABLE ${parsed.var}`))
            }
            let step = 1
            if (parsed.step !== undefined && typeof parsed.step === 'number') {
                step = parsed.step
            }
            let forvar = parsed.var as string
            this.forStack.push({
                var: forvar,
                end: parsed.end as number,
                step: step,
                sourceIndex: this.runSourceIndex,
            })
            this.variables.SetNumericVar(forvar, parsed.start as number)
            return resolve('')
        })
    }
    /**
     * Next
     * @param parsed Parsed structure
     */
    private cmdNEXT(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            const nextIndex = this.forStack.findIndex((state) => state.var === parsed.var)

            if (nextIndex === -1) {
                return resolve(this.programError(`NO FOR IN PROGRESS FOR ${parsed.var}`))
            }
            let state = this.forStack[nextIndex]
            let [current, emsg] = this.variables.GetNumbericVar(state.var)

            if (emsg !== undefined) {
                return resolve(this.programError(emsg))
            }
            if (current === undefined) {
                current = 0
            }
            current += state.step
            this.variables.SetNumericVar(state.var, current)
            // See if we are counting up or down
            if (
                (state.step > 0 && current > state.end) ||
                (state.step < 0 && current < state.end)
            ) {
                // We are done with the loop, so purge the stack to this point
                this.forStack.splice(nextIndex, this.forStack.length - nextIndex)
            } else {
                // We have to continue the loop, but if there is anything on the stack above us, remove them
                if (nextIndex < this.forStack.length) {
                    this.forStack.splice(nextIndex + 1, this.forStack.length - nextIndex)
                }
                this.runSourceIndex = state.sourceIndex
            }
            return resolve('')
        })
    }

    /**
     * Process GOSUB command
     * @param parsed Parsed structure
     */
    private cmdGOSUB(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            const [lineIndex, cmd] = this.getSourceIndex(parsed.line as number)
            if (lineIndex !== undefined) {
                if (this.gosubStack.length > GOSUBDEPTH) {
                    return resolve(
                        this.programError(`GS-ERR ATTEMPT TO GOSUB MORE THAN ${GOSUBDEPTH}`)
                    )
                }
                this.gosubStack.push(this.runSourceIndex)
                this.runSourceIndex = lineIndex
            }
            return resolve(cmd)
        })
    }
    /**
     * Process RETURN command
     * @param parsed Parsed structure
     */
    private cmdRETURN(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            const returnLoc = this.gosubStack.pop()
            if (returnLoc === undefined) {
                return resolve(this.programError(`GS-ERR ATTEMPT TO RETURN WITH NO GOSUB`))
            }
            this.runSourceIndex = returnLoc as number
            return resolve('')
        })
    }

    /**
     * Process IF command
     * @param parsed Parsed structure
     */
    private cmdIF(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if ((parsed.expr as number) !== 0) {
                // We need to take the if clause
                if (parsed.linenum !== undefined) {
                    return resolve(`GOTO ${parsed.linenum}`)
                } else if (parsed.then !== undefined) {
                    return resolve(this.tokenizer.getRemainder())
                }
            }
            return resolve('')
        })
    }
    /**
     * ON Command
     * @param parsed Parsed structure
     * @returns Additional command to execute
     */
    private cmdON(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if (parsed.onerror !== undefined) {
                const [lineIndex, cmd] = this.getSourceIndex(parsed.target as number)
                if (lineIndex !== undefined) {
                    this.onErrorLine = parsed.target as number
                }
                return resolve(cmd)
            }
            let cmdBase = 'GOTO'
            if (parsed.onaction === Token.GOSUB) {
                cmdBase = 'GOSUB'
            }
            // This is a on (n).  Figure out which one we want
            let choice = Math.floor(parsed.expression as number)
            while (choice > 0) {
                if (choice === 1) {
                    return resolve(`${cmdBase} ${parsed.target as number}`)
                }
                choice--
                if (parsed.comma == undefined || parsed.endinput !== undefined) {
                    return resolve('')
                }
                parsed = this.Parse(this.tokenizer, ONChoiceSyntax)
                if (parsed.error !== undefined) {
                    return resolve(this.programError(parsed.error as string))
                }
            }
            return resolve('')
        })
    }
    /**
     * Process GOTO command
     * @param parsed Parsed structure
     * @returns Additional command to execute
     */
    private cmdGOTO(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            const [lineIndex, cmd] = this.getSourceIndex(parsed.line as number)
            if (lineIndex !== undefined) {
                this.runSourceIndex = lineIndex
            }
            return resolve(cmd)
        })
    }

    /**
     * Get the location in the source where a line number is at (if found)
     * @param lineNum Line number to find
     * @returns Line index and command to execute (in case of error)
     */
    private getSourceIndex(lineNum: number): [number | undefined, string] {
        const lineIndex = this.program.findLineIndex(lineNum)
        const checkLine = this.program.getSourceLine(lineIndex)
        if (
            lineIndex === undefined ||
            checkLine === undefined ||
            lineNum !== checkLine.getLineNum()
        ) {
            return [undefined, this.programError(`LN-ERR LINE NUMBER ${lineNum} DOES NOT EXIST`)]
        }
        return [lineIndex, '']
    }

    /**
     * Process LET command
     * @param parsed Parsed structure
     * @returns Additional command to execute
     */
    private cmdLET(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            let varname = parsed.variable as string
            let isString = parsed.variable_type === Token.STRINGVAR
            let idx1 = parsed.index1 as number
            let idx2 = parsed.index2 as number
            let assignVal = parsed.expression
            let emsg

            // We can only assign strings to strings and numbers to numbers
            emsg = this.doAssign(isString, varname, idx1, idx2, assignVal)
            if (emsg !== undefined) {
                return resolve(this.programError(emsg))
            }
            return resolve('')
        })
    }

    private doAssign(
        isString: boolean,
        varname: string,
        idx1: number,
        idx2: number,
        assignVal: ExprVal
    ) {
        let emsg
        if (isString && typeof assignVal !== 'string') {
            emsg = 'DA-ERR MUST HAVE STRING TO ASSIGN TO STRING VARIABLE'
        } else if (!isString && typeof assignVal !== 'number') {
            emsg = 'DA-ERR MUST HAVE NUMBER TO ASSIGN TO NUMERIC VARIABLE'
        } else if (isString) {
            let value = assignVal as string
            if (idx1 === undefined) {
                emsg = this.variables.setString(varname, value)
            } else if (idx2 === undefined) {
                emsg = this.variables.SetStringArray(varname, idx1, value)
            } else {
                emsg = this.variables.setSubString(varname, idx1, idx2, value)
            }
        } else {
            let value = assignVal as number
            if (idx1 === undefined) {
                emsg = this.variables.SetNumericVar(varname, value)
            } else if (idx2 === undefined) {
                emsg = this.variables.SetNumeric1DArray(varname, idx1, value)
            } else {
                emsg = this.variables.SetNumeric2DArray(varname, idx1, idx2, value)
            }
        }
        return emsg
    }

    private cmdErase(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if (parsed.start === undefined) {
                // erase all
                this.program.EraseRange(0, MAXLINE)
            } else if (parsed.end === undefined) {
                this.program.Erase(Number(parsed.start))
            } else {
                this.program.EraseRange(Number(parsed.start), Number(parsed.end))
            }
            return resolve('')
        })
    }

    private cmdLIST(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            let firstLine = 1
            let lastLine = MAXLINE
            if (parsed.start !== undefined) {
                firstLine = Number(parsed.start)
                if (parsed.end === undefined) {
                    lastLine = firstLine
                } else {
                    lastLine = Number(parsed.end)
                }
            }

            let unit: number | undefined
            if (parsed.unit !== undefined) {
                unit = parsed.unit as number
            }
            this.io.Rewind(unit)
            const source = this.program.List(firstLine, lastLine)
            source.forEach((sourceLine) => {
                this.io.Write(unit, `${sourceLine.getLineNum()} ${sourceLine.getSource()}`)
                this.io.WriteFileMark(unit)
            })
            return resolve('')
        })
    }

    private cmdLOAD(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            let unit = parsed.logicalUnit as number | undefined
            while (true) {
                let line = await this.io.Read(unit)
                if (line === undefined) {
                    return resolve('')
                }
                //
                await this.execute(line, 0)
            }
        })
    }

    private cmdRENUM(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if (this.isRunning) {
                return resolve(this.programError('RENUM NOT ALLOWED IN RUNNING PROGRAM'))
            }

            let start: number = parsed.start as number
            let increment: number | undefined
            if (parsed.increment !== undefined) {
                increment = parsed.increment as number
            }
            const emsg = this.program.Renum(start, increment)
            if (emsg !== undefined) {
                this.io.WriteLine(emsg)
            }
            return resolve('')
        })
    }

    private cmdRUN(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            if (parsed.line !== undefined) {
                // Find the line number
                const spot = this.program.findLineIndex(Number(parsed.line))
                if (spot === undefined) {
                    return resolve(this.programError(`LN-ERR LINE ${parsed.line} NOT FOUND`))
                }
                this.runSourceIndex = spot
            } else {
                this.resetRunState()
            }
            this.isRunning = true
            await this.doRun()
            return resolve('')
        })
    }

    private resetRunState() {
        this.variables.New()
        this.fnInUse = {}
        this.runSourceIndex = 0
        this.forStack = []
        this.gosubStack = []
        this.dataItems = []
        this.hasReadData = false
    }
    private getData(): ExprVal | undefined {
        if (!this.hasReadData) {
            this.fillData()
            this.dataPos = 0
            this.hasReadData = true
        }
        if (this.dataPos >= this.dataItems.length) {
            return undefined
        }
        return this.dataItems[this.dataPos++]
    }
    /**
     * DATA Statement - We actually just ignore it.  When a READ statement comes along we will parse the code
     * to find the data statements
     * @param parsed Parsed command structure
     * @returns
     */
    private cmdDATA(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            return resolve('')
        })
    }
    /**
     * REM Statement - just a remark to ignore
     * @param parsed Parsed command structure
     * @returns
     */
    private cmdREM(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            return resolve('')
        })
    }
    /**
     * CALL Statement - call a system assembler function
     * @param parsed Parsed command structure
     * @returns Command to execute (nothing in this case)
     */
    private cmdCALL(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            // We can ignore everything on the line for now
            return resolve(this.programError('CA-ERR - NO ASSEMBLY ROUTINES FOUND'))
        })
    }
    /**
     * REW unit Statement - Rewind a logical unit
     * @param parsed Parsed command structure
     * @returns Command to execute (nothing in this case)
     */
    private cmdREW(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.io.Rewind(parsed.logicalUnit as number)
            return resolve('')
        })
    }
    /**
     * WFM unit Statement - Write a file mark on a logical unit
     * @param parsed Parsed command structure
     * @returns Command to execute (nothing in this case)
     */
    private cmdWFM(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.io.WriteFileMark(parsed.logicalUnit as number)
            return resolve('')
        })
    }
    /**
     * BSP unit Statement - BackSpace a logical unit
     * @param parsed Parsed command structure
     * @returns Command to execute (nothing in this case)
     */
    private cmdBSP(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.io.BackSpace(parsed.logicalUnit as number)
            return resolve('')
        })
    }
    /**
     * END Statement - end program execution
     * @param parsed Parsed command structure
     * @returns
     */
    private cmdEND(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.isRunning = false
            return resolve('')
        })
    }
    /**
     * STOP Statement - end program execution
     * @param parsed Parsed command structure
     * @returns
     */
    private cmdSTOP(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.isRunning = false
            let lineNum = this.getCurrentLineNum()
            this.io.WriteLine(`STOP ${lineNum}`)
            return resolve('')
        })
    }
    private getCurrentLineNum(): number | undefined {
        let lineNum: number | undefined
        let sourceline = this.program.getSourceLine(this.runSourceIndex - 1)
        if (sourceline !== undefined) {
            lineNum = sourceline.getLineNum()
        }
        return lineNum
    }

    private fillData() {
        const programLines = this.program.getSourceCount()
        for (let i = 0; i < programLines; i++) {
            let foo = this.program.getSourceLine(i)
            if (foo === undefined) {
                break
            }
            const tokenizer = new Tokenizer()
            tokenizer.setLine(foo.getSource())
            const [tokenstr, token] = tokenizer.getToken()
            if (token === Token.DATA) {
                while (true) {
                    let parsed = this.Parse(tokenizer, DATASyntax)
                    // If it failed to parse, let them know
                    if (parsed.error !== undefined) {
                        // TODO - figure out if this should do the ON ERROR code
                        this.programError(parsed.error as string)
                        return
                    }
                    this.dataItems.push(parsed.dataitem)
                    if (parsed.endinput !== undefined) {
                        break
                    }
                }
            }
        }
    }
    private cmdINPUT(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            let logicalUnit = this.io.GetUnit(parsed.unit as number)
            let inputString = await logicalUnit.inputFunction()
            if (inputString === undefined) {
                // We hit the end of file
                return resolve(this.programError(`IO-ERR 88${parsed.unit} END OF FILE`))
            }
            let pos = 0
            // Now that we have the input string, let's map it to the input variables
            while (parsed.variable !== undefined) {
                let varname = parsed.variable as string
                let isString = parsed.variable_type === Token.STRINGVAR
                let idx1 = parsed.index1 as number
                let idx2 = parsed.index2 as number
                let value: ExprVal
                if (isString) {
                    let foo = inputString.slice(pos)
                    if (foo.trim().substring(0, 1) === '"') {
                        let startQuote = foo.indexOf('"')
                        let endQuote = foo.indexOf('"', startQuote + 1)
                        if (endQuote === -1) {
                            // return resolve(this.programError(`XX-ERR MISSING CLOSING QUOTE FOR INPUT STRING`))
                            // Let's be nice and give them the remainder of the string
                            value = foo.slice(startQuote + 1)
                            pos += foo.length + 2
                        } else {
                            value = foo.slice(startQuote + 1, endQuote)
                            pos += endQuote + 1 - startQuote
                        }
                        // quoted string, look for the closing quote
                    } else {
                        let commaIndex = inputString.indexOf(',', pos)
                        value = inputString.slice(pos)
                        if (commaIndex > 0) {
                            value = inputString.slice(pos, commaIndex)
                        }
                        pos += value.length
                    }
                } else {
                    // We are pulling a number.
                    let commaIndex = inputString.indexOf(',', pos)
                    let numstr = inputString.slice(pos)
                    if (commaIndex > 0) {
                        numstr = inputString.slice(pos, commaIndex)
                        pos = commaIndex + 1
                    } else {
                        pos = inputString.length
                    }
                    console.log(`Checking for number: '${numstr}'`)
                    numstr = numstr.trim()
                    if (!this.isNumber(numstr)) {
                        return resolve(this.programError(`IN-ERR INVALID INPUT NUMBER '${numstr}'`))
                    }
                    value = Number(numstr)
                }
                let emsg = this.doAssign(isString, varname, idx1, idx2, value)
                if (emsg !== undefined) {
                    return resolve(this.programError(emsg))
                }
                if (parsed.endinput !== undefined) {
                    // Make sure we used up the remainder of the string.
                    let remain = inputString.slice(pos, pos + 2).trim()
                    if (remain !== '') {
                        return resolve(this.programError(`IN-ERR EXTRA INPUT ON LINE`))
                    }
                    return resolve('')
                }
                parsed = this.Parse(this.tokenizer, INPUTVarSyntax)
                if (parsed.error !== undefined) {
                    return resolve(this.programError(parsed.error as string))
                }
            }
            return resolve('')
        })
    }
    /**
     * Read one or more data items.
     * @param parsed Parsed command structure
     * @returns command to execute
     */
    private cmdREAD(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            while (parsed.variable !== undefined) {
                let varname = parsed.variable as string
                let isString = parsed.variable_type === Token.STRINGVAR
                let idx1 = parsed.index1 as number
                let idx2 = parsed.index2 as number
                let item = this.getData()
                if (item === undefined) {
                    this.isRunning = false
                    return resolve('')
                }
                let emsg = this.doAssign(isString, varname, idx1, idx2, item as ExprVal)
                if (emsg !== undefined) {
                    return resolve(this.programError(emsg))
                }
                if (parsed.endinput !== undefined) {
                    return resolve('')
                }
                parsed = this.Parse(this.tokenizer, READVarSyntax)
                if (parsed.error !== undefined) {
                    return resolve(this.programError(parsed.error as string))
                }
            }
            return resolve('')
        })
    }
    /**
     * Restart the Data read at the first data statement
     * @param parsed Parsed command structure
     * @returns command to execute
     */
    private cmdRESTORE(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            this.dataPos = 0
            return resolve('')
        })
    }
    /**
     * DIM a variable (declare space)
     * @param parsed Parsed command structure
     * @returns command to execute
     */
    private cmdDIM(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            do {
                if (parsed.variable === undefined) {
                    this.programError('SYNTAX ERROR IN DIM STATEMENT')
                }
                let emsg
                let dimvar = parsed.variable as string
                const dim1 = parsed.index1 as number
                if (parsed.index2 !== undefined) {
                    const dim2 = parsed.index2 as number
                    if (parsed.variable_type === Token.STRINGVAR) {
                        // String array
                        emsg = this.variables.DimStringArray(dimvar, dim1, dim2)
                    } else {
                        emsg = this.variables.DimNumeric2DArray(dimvar, dim1, dim2)
                    }
                } else if (parsed.variable_type === Token.STRINGVAR) {
                    // Normal string
                    emsg = this.variables.DimString(dimvar, dim1)
                } else {
                    // 1D Numeric array
                    this.variables.DimNumeric1DArray(dimvar, dim1)
                }
                if (emsg !== undefined) {
                    return resolve(this.programError(emsg))
                }
                if (parsed.endinput !== undefined) {
                    return resolve('')
                }

                parsed = this.Parse(this.tokenizer, DIMSyntax)
                if (parsed.error !== undefined) {
                    return resolve(this.programError(parsed.error as string))
                }
            } while (parsed.variable !== undefined)

            if (parsed.endinput === undefined) {
                return resolve(this.programError('SY-ERR SYNTAX ERROR AT END OF DIM STATEMENT'))
            }
            return resolve('')
        })
    }

    /**
     * DEFine a global function
     * @param parsed Parsed command structure
     * @returns command to execute
     */

    private cmdDEF(parsed: ParseResult): Promise<string> {
        return new Promise(async (resolve) => {
            const parm = parsed.parm as string
            const fndef = parsed.fndef as string
            const definition = this.tokenizer.getRemainder()

            if (parm.length !== 1) {
                return resolve(
                    this.programError(
                        `SY-ERR FUNCTION '${fndef} PARAMETER ${parm} NOT A SINGLE LETTER`
                    )
                )
            }
            this.variables.DefFN(fndef, parm, definition)
            return resolve('')
        })
    }
    /**************************************************************************************************************
     *
     **************************************************************************************************************/
    public Break() {
        this.isRunning = false
        this.io.WriteLine('*BREAK*')
    }

    private storeLine(linenum: number) {
        const tokenSpaceAfter = [
            Token.COMMA,
            Token.EQUAL,
            Token.AND,
            Token.BSP,
            Token.CALL,
            Token.DATA,
            Token.DEF,
            Token.DELETE,
            Token.DIM,
            Token.END,
            Token.ENDTRACE,
            Token.ERASE,
            Token.ERROR,
            Token.FILES,
            Token.FOR,
            Token.GOSUB,
            Token.GOTO,
            Token.IF,
            Token.INPUT,
            Token.LET,
            Token.LIST,
            Token.LOAD,
            Token.MAT,
            Token.NEW,
            Token.NEXT,
            Token.ON,
            Token.OR,
            Token.PAUSE,
            Token.PRINT,
            Token.RANDOM,
            Token.READ,
            Token.REM,
            Token.RENUM,
            Token.RESTORE,
            Token.RETURN,
            Token.REW,
            Token.RUN,
            Token.SETTRACE,
            Token.SIZE,
            Token.STEP,
            Token.STOP,
            Token.THEN,
            Token.TO,
            Token.USING,
            Token.VAL,
            Token.WFM,
            Token.SEMI,
            Token.ERROR,
        ]
        const tokenSpaceBefore = [
            Token.GOTO,
            Token.GOSUB,
            Token.EQUAL,
            Token.AND,
            Token.ERROR,
            Token.OR,
            Token.THEN,
            Token.TO,
            Token.ERROR,
        ]

        // Go through all the tokens on the line and construct a clean version of the text
        let line = ''
        let extra = ''
        let [tokenstr, token] = this.tokenizer.getToken()
        while (token !== Token.ENDINPUT) {
            if (token === Token.INVALID || token === Token.REM) {
                line += extra + tokenstr + ' ' + this.tokenizer.getRemainder()
                token = Token.ENDINPUT
            } else {
                if (token === Token.STRING) {
                    line += `${extra}"${tokenstr}"`
                } else {
                    if (tokenSpaceBefore.includes(token) && line.length > 1) {
                        extra = ' '
                    }
                    line += extra + tokenstr
                    extra = ''
                    if (tokenSpaceAfter.includes(token)) {
                        extra = ' '
                    }
                }
                ;[tokenstr, token] = this.tokenizer.getToken()
            }
        }
        this.program.addLine(linenum, line)
    }

    /**************************************************************************************************************
     *  TOKEN PARSER ROUTINES
     **************************************************************************************************************/
    public MatchToken(source: Tokenizer, tokenMatch: Token[]): Token {
        const saveState = source.saveState()
        const [tokenstr, token] = source.getToken()
        if (tokenMatch.includes(token)) {
            return token
        }
        source.restoreState(saveState)
        return Token.INVALID
    }
    public CheckType(
        val: ExprVal,
        emsg: string | undefined,
        expType?: ExpType,
        chkmsg?: string
    ): [ExprVal, ErrMsg] {
        if (expType === 'numeric' && typeof val !== 'number') {
            if (val === '') {
                return [val, `SY-ERR ERROR: EXPECTING NUMERIC TYPE`]
            }
            return [val, `SY-ERR ERROR '${val}' NOT NUMERIC TYPE`]
        } else if (expType === 'string' && typeof val !== 'string') {
            return [val, `SY-ERR ERROR '${val}' NOT STRING TYPE`]
        }
        return [val, emsg]
    }
    /**************************************************************************************************************
     *  EXPRESSION PARSER ROUTINES
     **************************************************************************************************************/
    public EvalFN(fn: string, numval: number): [ExprVal, ErrMsg] {
        let fnDef = this.variables.GetFN(fn)
        if (fnDef === undefined) {
            return [0, `UF-ERR FUNCTION ${fn} NOT DEFINED`]
        }
        if (this.fnInUse[fn] !== undefined) {
            return [0, `EX-ERR FUNCTION ${fn} CALLED RECURSIVELY`]
        }
        const tokenizer = new Tokenizer()
        let [oldval, oldmsg] = this.variables.GetNumbericVar(fnDef.parm)
        this.variables.SetNumericVar(fnDef.parm, numval)
        tokenizer.setLine(fnDef.def)
        this.fnInUse[fn] = true
        let [value, emsg] = this.EvalExpression(tokenizer)
        delete this.fnInUse[fn]

        if (oldval === undefined) {
            oldval = 0
        }
        this.variables.SetNumericVar(fnDef.parm, oldval)
        return [value, emsg]
    }

    public EvalExpression1(source: Tokenizer): [ExprVal, ErrMsg] {
        const tokenMatch = [
            Token.NUMBER,
            Token.STRING,
            Token.VARIABLE,
            Token.STRINGVAR,
            Token.LPAREN,
        ]
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
        ]

        const FunctionExpressionType: { [key in Token]?: ExpType } = {
            [Token.SIN]: 'numeric',
            [Token.COS]: 'numeric',
            [Token.TAN]: 'numeric',
            [Token.ATN]: 'numeric',
            [Token.LOG]: 'numeric',
            [Token.EXP]: 'numeric',
            [Token.SQR]: 'numeric',
            [Token.ABS]: 'numeric',
            [Token.INT]: 'numeric',
            [Token.RND]: 'numeric',
            [Token.NOT]: 'numeric',
            [Token.SGN]: 'numeric',
            [Token.LEN]: 'string',
            //[ Token.EOF]: 'numeric',
            [Token.VAL]: 'numeric',
            [Token.STRSTRING]: 'numeric',
            //[ Token.ERRSTRING]: 'numeric',
            //[ Token.ERL]: 'numeric',
            [Token.FN]: 'numeric',
        }

        const [tokenstr, token] = source.getToken()
        if (!tokenMatch.includes(token)) {
            if (!tokenFuncMatch.includes(token)) {
                return ['0', `SY-ERR SYNTAX ERROR PARSING EXPRESSION - UNEXPECTED '${tokenstr}'`]
            }
            // parse the ( parameter )
            if (!this.MatchToken(source, [Token.LPAREN])) {
                return [tokenstr, `PR-ERR SYNTAX ERROR - MISSING (`]
            }
            let [value, emsg] = this.EvalExpression(source)
            ;[value, emsg] = this.CheckType(value, emsg, FunctionExpressionType[token], '')
            if (emsg !== undefined) {
                return [value, emsg]
            }
            if (!this.MatchToken(source, [Token.RPAREN])) {
                return [value, `PR-ERR SYNTAX ERROR - MISSING )`]
            }
            let numval = 0
            let strval = ''
            if (typeof value === 'number') {
                numval = value
            } else {
                strval = value
            }
            // We have the data, now process the function
            switch (token) {
                case Token.SIN:
                    value = Math.sin(numval)
                    break
                case Token.COS:
                    value = Math.cos(numval)
                    break
                case Token.TAN:
                    value = Math.tan(numval)
                    break
                case Token.ATN:
                    value = Math.atan(numval)
                    break
                case Token.LOG:
                    value = Math.log(numval)
                    break
                case Token.EXP:
                    value = Math.exp(numval)
                    break
                case Token.SQR:
                    value = Math.sqrt(numval)
                    break
                case Token.ABS:
                    value = Math.abs(numval)
                    break
                case Token.INT:
                    value = Math.trunc(numval)
                    break
                case Token.RND:
                    value = Math.random()
                    break
                case Token.NOT:
                    value = Number(!value)
                    break
                case Token.SGN:
                    value = numval < 0 ? -1 : numval === 0 ? 0 : 1
                    break
                case Token.EOF:
                    value = this.io.isEOF() ? 1 : 0
                    break
                case Token.LEN:
                    value = strval.length
                    break
                case Token.VAL:
                    value = String(numval)
                    break
                case Token.STRSTRING:
                    break
                case Token.ERRSTRING:
                    value = this.lastErrorString
                    break
                case Token.ERL:
                    value = this.lastErrorLine
                    break
                case Token.FN:
                    return this.EvalFN(tokenstr, numval)
            }
            return [value, undefined]
        }
        switch (token) {
            case Token.NUMBER:
                return [Number(tokenstr), undefined]
            case Token.STRING:
                return [tokenstr, undefined]
            case Token.LPAREN:
                let [value, emsg] = this.EvalExpression(source)
                if (emsg !== undefined) {
                    return [value, emsg]
                }
                if (!this.MatchToken(source, [Token.RPAREN])) {
                    return [value, `PR-ERR SYNTAX ERROR - MISSING )`]
                }
                return [value, undefined]
            case Token.STRINGVAR:
            case Token.VARIABLE:
                if (this.MatchToken(source, [Token.LPAREN]) === Token.LPAREN) {
                    let [value, emsg] = this.EvalExpression(source)
                    let value2 = undefined
                    ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
                    if (emsg !== undefined) {
                        return [value, emsg]
                    }
                    if (this.MatchToken(source, [Token.COMMA]) === Token.COMMA) {
                        ;[value2, emsg] = this.EvalExpression(source)
                        ;[value2, emsg] = this.CheckType(value2, emsg, 'numeric', '')
                        if (emsg !== undefined) {
                            return [value2, emsg]
                        }
                    }
                    if (this.MatchToken(source, [Token.RPAREN]) !== Token.RPAREN) {
                        return [value, `PR-ERR SYNTAX ERROR - MISSING )`]
                    }
                    if (token === Token.STRINGVAR) {
                        let val = undefined
                        if (value2 === undefined) {
                            ;[val, emsg] = this.variables.GetStringArray(tokenstr, value as number)
                        } else {
                            ;[val, emsg] = this.variables.getSubString(
                                tokenstr,
                                value as number,
                                value2 as number
                            )
                        }
                        return [val as ExprVal, emsg]
                    } else {
                        let val = undefined
                        if (value2 === undefined) {
                            ;[val, emsg] = this.variables.GetNumeric1DArray(
                                tokenstr,
                                value as number
                            )
                        } else {
                            ;[val, emsg] = this.variables.GetNumeric2DArray(
                                tokenstr,
                                value as number,
                                value2 as number
                            )
                        }
                        return [val as ExprVal, emsg]
                    }
                } else {
                    // Simple variable
                    if (token == Token.STRINGVAR) {
                        let [val, emsg] = this.variables.getString(tokenstr)
                        if (emsg === '') {
                            return [val, undefined]
                        }
                        return [val, emsg]
                    }
                    let [numval, emsg] = this.variables.GetNumbericVar(tokenstr)
                    if (numval === undefined) {
                        numval = 0
                    }
                    if (emsg === '') {
                        return [numval, undefined]
                    }
                    return [numval, emsg]
                }
        }
        return ['0', 'SY-ERR UNRECOGNIZED TOKEN']
    }

    public EvalExpression2(source: Tokenizer): [ExprVal, ErrMsg] {
        const token = this.MatchToken(source, [Token.PLUS, Token.MINUS])
        let [value, emsg] = this.EvalExpression1(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        if (token === Token.MINUS) {
            ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
            if (typeof value === 'number') {
                value = -value
            }
        }
        return [value, undefined]
    }

    public EvalExpression3(source: Tokenizer): [ExprVal, ErrMsg] {
        let [value, emsg] = this.EvalExpression2(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        const token = this.MatchToken(source, [Token.CARET])
        if (token !== Token.INVALID) {
            ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
            if (emsg !== undefined) {
                return [value, emsg]
            }
            let [value2, emsg2] = this.EvalExpression3(source)
            ;[value2, emsg2] = this.CheckType(value2, emsg2, 'numeric', '')
            if (emsg2 !== undefined) {
                return [value2, emsg2]
            }
            // Evaluate the expression
            value = Math.pow(value as number, value2 as number)
        }
        return [value, undefined]
    }
    public EvalExpression4(source: Tokenizer): [ExprVal, ErrMsg] {
        let [value, emsg] = this.EvalExpression3(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        const token = this.MatchToken(source, [Token.STAR, Token.SLASH])
        if (token !== Token.INVALID) {
            ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
            if (emsg !== undefined) {
                return [value, emsg]
            }
            let [value2, emsg2] = this.EvalExpression4(source)
            ;[value2, emsg2] = this.CheckType(value2, emsg2, 'numeric', '')
            if (emsg2 !== undefined) {
                return [value2, emsg2]
            }
            // Evaluate the expression
            switch (token) {
                case Token.STAR:
                    value = (value as number) * (value2 as number)
                    break
                case Token.SLASH:
                    value = (value as number) / (value2 as number)
                    break
            }
        }
        return [value, undefined]
    }
    public EvalExpression5(source: Tokenizer): [ExprVal, ErrMsg] {
        let [value, emsg] = this.EvalExpression4(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        const token = this.MatchToken(source, [Token.PLUS, Token.MINUS])
        if (token !== Token.INVALID) {
            ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
            if (emsg !== undefined) {
                return [value, emsg]
            }
            let [value2, emsg2] = this.EvalExpression5(source)
            ;[value2, emsg2] = this.CheckType(value2, emsg2, 'numeric', '')
            if (emsg2 !== undefined) {
                return [value2, emsg2]
            }
            // Evaluate the expression
            switch (token) {
                case Token.PLUS:
                    value = (value as number) + (value2 as number)
                    break
                case Token.MINUS:
                    value = (value as number) - (value2 as number)
                    break
            }
        }
        return [value, undefined]
    }

    public EvalExpression6(source: Tokenizer): [ExprVal, ErrMsg] {
        let [value, emsg] = this.EvalExpression5(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        const token = this.MatchToken(source, [
            Token.EQUAL,
            Token.LESS,
            Token.GREATER,
            Token.GREATEREQUAL,
            Token.NOTEQUAL,
        ])
        if (token !== Token.INVALID) {
            const [value2, emsg2] = this.EvalExpression6(source)
            if (emsg2 !== undefined) {
                return [value2, emsg2]
            }
            // Evaluate the expression
            switch (token) {
                case Token.EQUAL:
                    value = value == value2 ? 1 : 0
                    break
                case Token.LESS:
                    value = value < value2 ? 1 : 0
                    break
                case Token.GREATER:
                    value = value > value2 ? 1 : 0
                    break
                case Token.GREATEREQUAL:
                    value = value >= value2 ? 1 : 0
                    break
                case Token.NOTEQUAL:
                    value = value != value2 ? 1 : 0
                    break
            }
        }
        return [value, undefined]
    }
    public EvalExpression7(source: Tokenizer): [ExprVal, ErrMsg] {
        let [value, emsg] = this.EvalExpression6(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        const token = this.MatchToken(source, [Token.AND])
        if (token == Token.AND) {
            ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
            if (emsg !== undefined) {
                return [value, emsg]
            }
            let [value2, emsg2] = this.EvalExpression7(source)
            ;[value2, emsg2] = this.CheckType(value2, emsg2, 'numeric', '')
            if (emsg2 !== undefined) {
                return [value2, emsg2]
            }
            // Evaluate the AND
            value = (value as number) && (value2 as number) ? 1 : 0
        }
        return [value, undefined]
    }
    /**
     *
     * @param source
     * @returns
     */
    public EvalExpression(source: Tokenizer): [ExprVal, ErrMsg] {
        let [value, emsg] = this.EvalExpression7(source)
        if (emsg !== undefined) {
            return [value, emsg]
        }
        const token = this.MatchToken(source, [Token.OR])
        if (token === Token.OR) {
            ;[value, emsg] = this.CheckType(value, emsg, 'numeric', '')
            if (emsg !== undefined) {
                return [value, emsg]
            }
            let [value2, emsg2] = this.EvalExpression(source)
            ;[value2, emsg2] = this.CheckType(value2, emsg2, 'numeric', '')
            if (emsg2 !== undefined) {
                return [value2, emsg2]
            }
            // Evaluate the OR
            value = (value as number) || (value2 as number) ? 1 : 0
        }
        return [value, undefined]
    }
    /**
     * Parse source code using a given syntax structure
     * @param source Source code line to parse
     * @param syntax Syntax elements to parse against
     * @returns map of values parsed
     */
    public Parse(source: Tokenizer, syntax: SyntaxElem[]): ParseResult {
        let result: ParseResult = {}
        for (let syntaxElem of syntax) {
            if (syntaxElem.tok !== undefined) {
                let tokenstr: ExprVal = ''
                let token = Token.INVALID
                if (syntaxElem.tok === Token.EXPRESSION) {
                    let emsg = undefined
                    ;[tokenstr, emsg] = this.EvalExpression(source)
                    if (syntaxElem.epxtype !== undefined) {
                        ;[tokenstr, emsg] = this.CheckType(tokenstr, emsg, syntaxElem.epxtype, '')
                    }

                    if (emsg !== undefined) {
                        result['error'] = emsg
                        return result
                    }
                    if (syntaxElem.val !== undefined) {
                        result[syntaxElem.val] = tokenstr
                    }
                } else {
                    ;[tokenstr, token] = source.getToken()

                    if (token === Token.STRINGVAR && syntaxElem.tok === Token.VARIABLE) {
                        if (syntaxElem.val !== undefined) {
                            result[syntaxElem.val + '_type'] = Token.STRINGVAR
                        }
                        token = Token.VARIABLE
                    }
                    if (token !== syntaxElem.tok) {
                        // The token doesn't match so we need to generate an error and skip out
                        result[
                            'error'
                        ] = `SY-ERR SYNTAX ERROR: EXPECTED ${syntaxElem.tok} BUT FOUND ${tokenstr}/${token}`
                        return result
                    }
                }
                if (syntaxElem.val !== undefined) {
                    result[syntaxElem.val] = tokenstr
                }
            }
            if (syntaxElem.include !== undefined) {
                let subData = this.Parse(source, syntaxElem.include)
                result = { ...result, ...subData }
                if (result['error'] !== undefined) {
                    return result
                }
            }
            if (syntaxElem.optional !== undefined) {
                if (syntaxElem.val === undefined || result[syntaxElem.val] === undefined) {
                    const saveState = source.saveState()
                    let subData = this.Parse(source, syntaxElem.optional)
                    if (subData['error'] === undefined || syntaxElem.needed) {
                        result = { ...result, ...subData }
                        if (syntaxElem.val !== undefined) {
                            result[syntaxElem.val] = '1'
                        }
                    } else {
                        source.restoreState(saveState)
                    }
                }
            }
        }
        return result
    }
}
