import { exec } from 'node:child_process';
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { Agendar } from './src/agendar.js';

// Lendo config.json
let config = fs.readFileSync('./config.json');
config = JSON.parse(config);

let data = new Date();

// Ligando o Browser
const browser = await puppeteer.launch({
    args: [
      '--incognito',
    ],
  });
const page = await browser.newPage();
console.log('Ligou o Browser');

// Tentando Entrar no SIGAA.
let tentativas = 0;
let intervalos = [1000, 5000, 10000, 15000, 30000, 60000, 120000];

const tentarAcessarSite = async (resolve) => {
    while (tentativas < intervalos.length) {
        try {
            await page.goto('https://si3.ufc.br/sigaa/verTelaLogin.do');
            await page.screenshot({path: './screenshots/ru1.png'});
            console.log('Entrou no SIGAA');

            resolve()
            return 1;
        } catch (e) {
            console.log(`Erro ao acessar o SIGAA. Tentando novamente em ${intervalos[tentativas] / 1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, intervalos[tentativas]));
            tentativas++;
        }
    }

    console.log("Máximo de tentativas alcançado. Encerrando...");
    exec('cd assets && erro.png');
    process.exit();
};

await new Promise( (resolve) => tentarAcessarSite(resolve));

// Tamanho da tela do navegador.
await page.setViewport({width: 800, height: 600});

// Logar no SIGAA
await page.locator('tbody > tr:nth-child(1) > td > input[type=text]').fill(config.sigaa.user);
await page.locator('tbody > tr:nth-child(2) > td > input[type=password]').fill(config.sigaa.password);
await page.locator('input[type=submit]').click();
await page.screenshot({path: './screenshots/ru1.png'});
await page.waitForNavigation();
await page.screenshot({path: './screenshots/ru2.png'});

// Testando essa bomba
if (page.url() === 'https://si3.ufc.br/sigaa/logar.do?dispatch=logOn') {
    exec('cd assets && erro.png');
    throw new Error('Usuário e/ou senha inválidos || Servidor indisponível');
}

console.log("Logou no SIGAA");

if (page.url() === 'https://si3.ufc.br/sigaa/telaAvisoLogon.jsf') {
    let btnConfirmar = 'input[type=submit]';
    while (page.url() === 'https://si3.ufc.br/sigaa/telaAvisoLogon.jsf') {
        console.log('Tela de Aviso do SIGAA');
        try {
            await page.keyboard.press('PageDown');
            await page.locator(btnConfirmar).click();
            await page.waitForNavigation();
        } catch (e) {
            exec('cd assets && erro.png');
            console.error('Erro na tela de aviso do SIGAA')
        }
    }
}

if (page.url() === "https://si3.ufc.br/sigaa/progresso.jsf") {
    await page.waitForNavigation();
}

if (page.url() !== 'https://si3.ufc.br/sigaa/paginaInicial.do') {
    exec('cd assets && erro.png');
    throw new Error(`Erro "${page.url()}" esperado "https://si3.ufc.br/sigaa/paginaInicial.do"`);
}
    
// Entrar na pagina do discente
await page.locator('#portais > ul > li.discente.on > a').click()
await page.waitForNavigation();
console.log('Entrou na Pagina do Discente') 

// Procurar botão do RU as vezes eles mudam de lugar

let btnRestauranteUniversitario = "#cmAction-96";
let btnAgendarRefeicao = "#cmAction-97";
let botao;

botao = await page.evaluate((btnAgendarRefeicao) => {
    const button = document.querySelector(btnAgendarRefeicao);
    return button ? button.textContent.trim() : null
}, btnAgendarRefeicao);

if (botao != 'Agendar Refeição') {
    let botaoRu;
    let botaoAgenda;
    let found = false;
    console.warn("Mexeram no botão de agendamento :/");
    console.warn("Buscando o botão pela página pela página...");
    
    for (let i = 93; i <= 109 && !found; i++) {
        btnRestauranteUniversitario = `#cmAction-${i}`;
        btnAgendarRefeicao = `#cmAction-${i + 1}`;

        botaoRu = await page.evaluate(btnRestauranteUniversitario => {
            const button = document.querySelector(btnRestauranteUniversitario);
            return button ? button.textContent.trim() : null
        }, btnRestauranteUniversitario);

        console.log(`> ${botaoRu} <`);
        if (botaoRu !== "Restaurante Universitário") continue;

        
        botaoAgenda = await page.evaluate(btnAgendarRefeicao => {
            const button = document.querySelector(btnAgendarRefeicao);
            return button ? button.textContent.trim() : null
        }, btnAgendarRefeicao);
        
        if (botaoAgenda !== "Agendar Refeição") {
            console.log(`> ${botaoAgenda} <`);
            continue;
        }

        found = true;
        console.log(`\nAchado Restaurante Universitário: \n> ${botaoRu} <\n< id="${btnRestauranteUniversitario}" >`);
        console.log(`Achado Agendar Refeição: \n> ${botaoAgenda} <\n< id="${btnAgendarRefeicao}" >\n`);
        break;
    }

    if (!found) {
        exec('cd assets && erro.png');
        console.error(`Botão do RU não encontrado.`);
        process.exit();
    }
}

// Entrar no RU

await page.locator(btnRestauranteUniversitario).hover()
await page.locator(btnAgendarRefeicao).hover()
await page.locator(btnAgendarRefeicao).click()
await page.waitForNavigation()
console.log('Entrou no RU\n')
console.log("-- Primeiro, vou agendar os almoços e depois os jantares\n")

const tableData = await page.evaluate(() => {
    // Localize a tabela
    const table = document.querySelector('#formulario\\:listaHorariosEstagio > fieldset:nth-child(1) > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(3)');
    if (!table) return {
        almoco: [],
        janta: []
    };

    // Extrair dados da tabela
    const rows = table.querySelectorAll('tr');
    const data = {
        almoco: [],
        janta: []
    };

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const date = cells[0].innerText.trim().replace(/\//g, "");
            const refeicao = cells[1].innerText.trim().toLowerCase();

            if (refeicao === 'almoço') data.almoco.push(date);
            if (refeicao === 'jantar') data.janta.push(date);
        }
    });

    return data;
});

// Ex.: 03082024, 02082024
let diasParaAgendarAlmoco = [];
let diasParaAgendarJanta = [];

let agendamentoAlmoco = Object.values(config.agendamento.almoco);
let agendamentoJanta = Object.values(config.agendamento.janta);

for (let i = 0; i < 7; i++) {
    data.setDate(data.getDate() + 1)
    
    let diaDaSemana = data.getDay()
    if (diaDaSemana == 0 || diaDaSemana == 6) continue;

    let dia = data.getDate();
    let mes = data.getMonth() + 1;
    let ano = data.getFullYear();
    
    dia = dia.toString().padStart(2, "0");
    mes = mes.toString().padStart(2, "0");

    if (agendamentoAlmoco[diaDaSemana - 1]) {
        diasParaAgendarAlmoco.push(`${dia}${mes}${ano}`);
    }

    if (agendamentoJanta[diaDaSemana - 1]) {
        diasParaAgendarJanta.push(`${dia}${mes}${ano}`);
    }
}

function proximoAlmoco() {
    return diasParaAgendarAlmoco.length == 0 ? '' : diasParaAgendarAlmoco.shift();
}

function proximaJanta() {
    return diasParaAgendarJanta.length == 0 ? '' : diasParaAgendarJanta.shift();
}

const agendar = new Agendar(page);

for (let i = 0; i < 7; i++) {
    let dataAgendarAlmoco = proximoAlmoco();
    if (dataAgendarAlmoco === '') continue;

    if (tableData.almoco.includes(dataAgendarAlmoco)) continue;
    
    await agendar.almoco(dataAgendarAlmoco);
}

for (let i = 0; i < 7; i++) {
    let dataAgendarJanta = proximaJanta();
    if (dataAgendarJanta === '') continue;
    if (tableData.janta.includes(dataAgendarJanta)) continue;

    await agendar.janta(dataAgendarJanta);
}

const element = await page.$('#formulario');

console.log("[ AGENDADO ]")

try {
    await element.screenshot({path: './screenshots/ru.png'});
} catch (e) {
    await browser.close();
    console.error(e)
}

exec('cd screenshots && ru.png');