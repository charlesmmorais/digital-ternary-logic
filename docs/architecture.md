# Arquitetura do Digital Ternary Logic

O projeto tem três camadas principais.

## 1. Núcleo ternário

Arquivo: `src/core/trit.js`

Responsabilidades:

- Normalizar valores `N`, `0`, `P` e `X`.
- Implementar `TINV`, `TMIN`, `TMAX`, `TMUX3`, `TEQ`.
- Implementar o somador completo ternário balanceado.
- Converter decimal ↔ ternário balanceado.
- Mesclar múltiplas fontes em uma mesma entrada e detectar conflitos.

## 2. Modelo e simulação de circuito

Arquivo: `src/core/circuit.js`

Responsabilidades:

- Definir os tipos de componentes.
- Criar nós e fios.
- Executar simulação iterativa até estabilização.
- Atualizar elementos sequenciais com `Tick`.
- Implementar `REGISTER`, `RAM9` e `ROM9`.
- Implementar chips compostos.

A simulação funciona em ciclos:

1. Avalia saídas iniciais.
2. Propaga sinais pelos fios.
3. Mescla múltiplos drivers por entrada.
4. Reavalia os nós.
5. Repete até estabilizar ou atingir o limite de iterações.
6. Se houver `Tick`, atualiza estados internos e reavalia.

## 3. Interface visual

Arquivos:

- `src/ui/app.js`
- `src/ui/styles.css`
- `index.html`

Responsabilidades:

- Editor visual em canvas.
- Paleta de componentes.
- Inspetor de propriedades.
- Exportação/importação JSON.
- Salvamento local.
- Criação de chips compostos.

## Detecção de conflito

Uma entrada pode receber vários fios.

A regra é:

- Nenhuma fonte útil → `X`.
- Uma fonte → valor da fonte.
- Várias fontes iguais → valor comum.
- Várias fontes diferentes → `X` e conflito reportado.

`X` também representa alta impedância, indefinição ou desconexão.

## Estado sequencial

`REGISTER` e `RAM9` não atualizam a cada frame de simulação. Eles atualizam somente quando o usuário pressiona **Tick**.

Isso torna o comportamento previsível e facilita estudar circuitos sequenciais.
