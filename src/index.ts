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
import { Terminal } from 'xterm'
import LocalEchoController from 'local-echo'
import { createDocumentElement, htmlToElement } from './common/htmldom'
import './style.css'
import { Basic } from './basic'
import { InitStorage } from './common/jtstore'
import { SeekType } from './io'

let jtstorage = InitStorage()
let unitpos: number[] = [0]

function getUnitName(unitnum: number): string {
    return `UNIT${unitnum}`
}

function readUnit(unit: number): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
        let content = jtstorage.get(getUnitName(unit))
        let pos = unitpos[unit]
        if (pos >= content.length) {
            return resolve(undefined)
        }
        let endpos = content.indexOf('\n', pos)
        if (endpos < 0) {
            endpos = content.length
        }
        let result = content.substring(pos, endpos)
        unitpos[unit] = endpos + 1
        return resolve(result)
    })
}

function writeUnit(unit: number, val: string): void {
    let unitName = getUnitName(unit)
    let content = jtstorage.get(unitName)
    content = content.slice(0, unitpos[unit]) + val.replace(/\r\n/g, '\n')
    unitpos[unit] = content.length
    jtstorage.set(unitName, content)
}

function seekUnit(unit: number, record: number, type: SeekType) {
    let unitName = getUnitName(unit)
    let content = jtstorage.get(unitName)
    if (type === 'absolute') {
        if (record === 0) {
            unitpos[unit] = 0
        } else if (record === -1) {
            unitpos[unit] = content.length
        } else {
            console.log('Need to implement absolute record seek unit')
        }
    } else {
        console.log('Need to implement relative seek unit')
        // relative
    }
}
function setupLogicalUnits(basic: Basic): void {
    let unitElemSel = document.getElementById('unit') as HTMLSelectElement
    let unitTextArea = document.getElementById('unittext') as HTMLTextAreaElement
    if (unitElemSel !== null) {
        unitElemSel.onchange = () => {
            console.log(`Changed to Unit ${unitElemSel.value}`)
            unitTextArea.value = jtstorage.get(getUnitName(Number(unitElemSel.value)))
        }
    }
    if (unitTextArea !== null) {
        unitTextArea.onchange = () => {
            console.log(`Changed text to ${unitTextArea.value} from  ${unitElemSel.value}`)
            jtstorage.set(getUnitName(Number(unitElemSel.value)), unitTextArea.value)
        }
    }
    for (let i = 1; i <= 15; i++) {
        unitpos.push(0)
        basic.io.OpenUnit(
            i,
            (): Promise<string | undefined> => {
                return readUnit(i)
            },
            (str) => {
                writeUnit(i, str)
                if (Number(unitElemSel.value) === i) {
                    unitTextArea.value = jtstorage.get(getUnitName(Number(unitElemSel.value)))
                }
            },
            (record: number, type: SeekType) => {
                seekUnit(i, record, type)
            }
        )
    }
}

async function runInterpreter(term: Terminal, localEcho: any): Promise<void> {
    const basic = new Basic()
    setupLogicalUnits(basic)
    basic.io.OpenUnit(
        5,
        (): Promise<string | undefined> => {
            return localEcho.read('')
        },
        (str) => term.write(str)
    )
    term.write('Interdata 7/16 Basic\r\n')
    term.onKey((evt) => {
        if (
            evt.domEvent.key === 'c' &&
            evt.domEvent.ctrlKey &&
            !evt.domEvent.shiftKey &&
            !evt.domEvent.metaKey
        ) {
            console.log('BREAK REQUESTED')
            basic.Break()
        }
    })

    do {
        try {
            const input = await localEcho.read('')
            console.log(`Input: '${input}'`)
            await basic.execute(input)
        } catch (error) {
            console.log(`Error reading: ${error}`)
        }
    } while (true)
}

window.addEventListener('load', function () {
    let content = document.getElementById('content')
    if (content !== undefined && content !== null) {
        const terminal = createDocumentElement('div', {
            id: 'terminal',
        })
        content.appendChild(terminal)

        content.appendChild(
            htmlToElement(`<div id="unitdef">   
<label for="unit" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select an option</label>
<select id="unit" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
  <option value="1">Logical Unit 1</option>
  <option value="2">Logical Unit 2</option>
  <option value="3">Logical Unit 3</option>
  <option value="4">Logical Unit 4</option>
  <option value="5" disabled="disabled">Logical Unit 5 - Terminal</option>
  <option value="6">Logical Unit 6</option>
  <option value="7">Logical Unit 7</option>
  <option value="8">Logical Unit 8</option>
  <option value="9">Logical Unit 9</option>
  <option value="10">Logical Unit 10</option>
  <option value="11">Logical Unit 11</option>
  <option value="12">Logical Unit 12</option>
  <option value="13">Logical Unit 13</option>
  <option value="14">Logical Unit 14</option>
  <option value="15">Logical Unit 15</option>
</select>
<textarea id="unittext"></textarea>
</div>`)
        )

        var term = new Terminal({ cursorBlink: true, cursorStyle: 'block' })
        term.open(terminal)

        const localEcho = new LocalEchoController()
        term.loadAddon(localEcho)
        runInterpreter(term, localEcho)
    }
})
