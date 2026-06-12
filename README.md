# Digital Ternary Logic

**Digital Ternary Logic** é um simulador visual de lógica ternária balanceada, inspirado na ideia pedagógica de construir circuitos digitais a partir de portas primitivas. Aqui os sinais assumem três valores:

| Símbolo | Valor | Significado |
|---|---:|---|
| `N` | -1 | negativo |
| `0` | 0 | neutro |
| `P` | +1 | positivo |
| `X` | indefinido | desconectado, alta impedância ou conflito |

O projeto usa **HTML + CSS + JavaScript puro**, sem framework e sem etapa de build. Pode ser publicado diretamente no GitHub Pages.

**Live Demo:** https://charlesmmorais.github.io/digital-ternary-logic/
 
## Recursos implementados

- Simulador visual em canvas.
- Portas primitivas de lógica ternária balanceada:
  - `TINV`: inversor ternário.
  - `TMIN`: mínimo ternário.
  - `TMAX`: máximo ternário.
- Constantes `N`, `0` e `P`.
- Entradas e saídas de 1 trit.
- Barramentos ternários de 3 trits com `MERGE3`, `SPLIT3`, `INPUT3` e `OUTPUT3`.
- Detecção de conflitos quando múltiplas fontes dirigem valores diferentes para a mesma entrada.
- `TRIBUF` para barramentos compartilhados.
- `TDEC`, `TMUX3` e `TEQ`.
- Somador completo ternário balanceado `TADD`.
- Registrador ternário de 1 trit, atualizado por `Tick`.
- `RAM9`: memória ternária de 9 células, endereçada por 2 trits balanceados.
- `ROM9`: memória somente leitura editável pelo inspetor.
- Chips compostos criados a partir de circuitos com `INPUT`/`OUTPUT` expostos.
- Exportação/importação JSON.
- Salvamento local no navegador.
- Exemplos prontos.
- Testes automatizados do núcleo lógico.

## Como executar

### Opção 1 — abrir localmente

Basta abrir `index.html` em um navegador moderno. Para evitar restrições de módulo ES em alguns navegadores, prefira iniciar um servidor local:

```bash
cd digital-ternary-logic
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

No Windows, se `python` não estiver no PATH:

```powershell
py -m http.server 8000
```

### Opção 2 — GitHub Pages

1. Envie este repositório ao GitHub.
2. Acesse **Settings → Pages**.
3. Em **Build and deployment**, escolha:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Salve.

O GitHub Pages publicará o simulador automaticamente.

## Como testar

O projeto não depende de pacotes externos. Basta executar:

```bash
npm test
```

Os testes cobrem:

- `TINV`, `TMIN`, `TMAX`.
- Somador ternário balanceado.
- Conversão decimal ↔ ternário balanceado.
- Conflitos em fios.
- Simulação de circuito.
- Registrador com `Tick`.
- RAM9.
- Chip composto.

## Como usar o simulador

1. Adicione componentes pela paleta lateral.
2. Arraste os blocos no canvas.
3. Clique em uma porta de saída e depois em uma porta de entrada para criar um fio.
4. Clique em um `INPUT` para alternar `N → 0 → P`.
5. Em `INPUT3`, use o inspetor para editar cada trit do barramento. Com `Shift + clique`, todos os trits alternam juntos.
6. Use `Tick` para atualizar registradores e gravar na RAM.
7. Dê duplo clique em um componente ou fio para excluir.
8. Use **Exportar JSON** para copiar o circuito.
9. Use **Importar JSON** para carregar um circuito salvo.
10. Use **Criar chip composto** para transformar o circuito atual em um componente reutilizável.

## Portas primitivas

### TINV

| Entrada | Saída |
|---:|---:|
| N | P |
| 0 | 0 |
| P | N |
| X | X |

### TMIN

`TMIN(a,b) = min(a,b)`, considerando `N < 0 < P`.

| A \ B | N | 0 | P |
|---:|---:|---:|---:|
| **N** | N | N | N |
| **0** | N | 0 | 0 |
| **P** | N | 0 | P |

### TMAX

`TMAX(a,b) = max(a,b)`, considerando `N < 0 < P`.

| A \ B | N | 0 | P |
|---:|---:|---:|---:|
| **N** | N | 0 | P |
| **0** | 0 | 0 | P |
| **P** | P | P | P |

## Somador ternário balanceado

O `TADD` recebe `A`, `B` e `Cin`, todos em `{-1, 0, +1}`, e produz `Sum` e `Cout`.

Regra:

```text
Total = A + B + Cin

Se Total > +1: Sum = Total - 3, Cout = +1
Se Total < -1: Sum = Total + 3, Cout = -1
Caso contrário: Sum = Total, Cout = 0
```

Exemplos:

| A | B | Cin | Total | Sum | Cout |
|---:|---:|---:|---:|---:|---:|
| P | P | 0 | +2 | N | P |
| P | P | P | +3 | 0 | P |
| N | N | 0 | -2 | P | N |
| N | N | N | -3 | 0 | N |
| P | N | 0 | 0 | 0 | 0 |

## Chips compostos

Um chip composto é criado a partir do circuito atual.

Regras:

- Cada `INPUT` ou `INPUT3` vira uma porta de entrada do chip composto.
- Cada `OUTPUT` ou `OUTPUT3` vira uma porta de saída do chip composto.
- O nome/rótulo do `INPUT` ou `OUTPUT` vira o nome da porta.
- O chip criado aparece na seção **Chips compostos**.

Exemplo:

1. Crie `INPUT` chamado `a`.
2. Ligue em `TINV`.
3. Ligue em `OUTPUT` chamado `y`.
4. Clique em **Criar chip composto** e dê o nome `NEGATE`.
5. O novo chip `NEGATE` aparece na paleta de chips compostos.

## Estrutura do projeto

```text
.
├── index.html
├── package.json
├── README.md
├── LICENSE
├── docs
│   ├── architecture.md
│   └── truth-tables.md
├── examples
│   ├── adder.json
│   ├── memory.json
│   └── primitives.json
├── src
│   ├── core
│   │   ├── circuit.js
│   │   └── trit.js
│   └── ui
│       ├── app.js
│       └── styles.css
└── tests
    └── run-tests.js
```

## Arquitetura

O núcleo do simulador está separado da interface:

- `src/core/trit.js`: operações ternárias puras.
- `src/core/circuit.js`: modelo de circuito, tipos de nó, simulação, memória e chips compostos.
- `src/ui/app.js`: editor visual em canvas, paleta, inspetor e ações de usuário.
- `src/ui/styles.css`: aparência da aplicação.

## Manual

A documentação dos componentes, sinais, portas primitivas, barramentos, somadores, registradores e memórias está disponível em:

[Manual do Digital Ternary Logic](MANUAL.md)


## Licença

MIT.
