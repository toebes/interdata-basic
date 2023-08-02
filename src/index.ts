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
import { Terminal } from 'xterm';
import LocalEchoController from 'local-echo';
import { createDocumentElement, htmlToElement } from './common/htmldom';
import './style.css';
import { Basic } from './basic';

function getSource(): string[] {
    const codeblock = document.getElementById('code');
    if (codeblock === null || codeblock === undefined) {
        return [';NO CODE FOUND'];
    }
    const codeblockarea = codeblock as HTMLTextAreaElement;
    const lines = codeblockarea.value.split(/[\n\r]/g);
    return lines;
}
function setDivContentLines(id: string, content: string[]) {
    const elem = document.getElementById(id);
    if (elem !== undefined && elem !== null) {
        const div = elem as HTMLDivElement;
        // Empty it out
        while (div.firstChild) {
            div.firstChild.remove();
        }
        content.forEach((line) => {
            const ldiv = createDocumentElement('div', {
                class: 'ldiv',
                textContent: line,
            });
            div.appendChild(ldiv);
        });
    }
}

async function runInterpreter(term: Terminal, localEcho: any): Promise<void> {
    const basic = new Basic();
    term.write('Interdata 7/16 Basic\r\n');
    term.onKey((evt) => {
        if (
            evt.domEvent.key === 'c' &&
            evt.domEvent.ctrlKey &&
            !evt.domEvent.shiftKey &&
            !evt.domEvent.metaKey
        ) {
            console.log('BREAK REQUESTED');
            term.write('*BREAK*\r\n');
        }
    });

    do {
        try {
            const input = await localEcho.read('');
            console.log(`Input: '${input}'`);
            basic.execute(input, (str: string) => term.write(str));
        } catch (error) {
            console.log(`Error reading: ${error}`);
        }
    } while (true);
}

window.addEventListener('load', function () {
    let content = document.getElementById('content');
    if (content !== undefined && content !== null) {
        const terminal = createDocumentElement('div', {
            id: 'terminal',
        });
        content.appendChild(terminal);

        var term = new Terminal({ cursorBlink: true, cursorStyle: 'block' });
        term.open(terminal);

        const localEcho = new LocalEchoController();
        term.loadAddon(localEcho);
        runInterpreter(term, localEcho);
    }
});
