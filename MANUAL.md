\# Manual do Digital Ternary Logic



O \*\*Digital Ternary Logic\*\* é um simulador visual de lógica ternária balanceada, inspirado conceitualmente no Digital Logic Sim.



Neste simulador, os sinais podem assumir os seguintes estados:



| Símbolo | Valor lógico | Significado                             |

| ------- | -----------: | --------------------------------------- |

| `N`     |           -1 | Negativo                                |

| `0`     |            0 | Neutro                                  |

| `P`     |           +1 | Positivo                                |

| `X`     |   Indefinido | Conflito, desconexão ou estado inválido |



Os valores reais da lógica ternária balanceada são `N`, `0` e `P`.

O estado `X` é usado pelo simulador para indicar indefinição ou conflito.



\---



\## 1. Portas primitivas



As portas primitivas são a base da lógica ternária balanceada no simulador.



\### TINV



A porta `TINV` é o inversor ternário.



Ela troca `N` por `P`, troca `P` por `N` e mantém `0`.



| Entrada | Saída |

| ------: | ----: |

|     `N` |   `P` |

|     `0` |   `0` |

|     `P` |   `N` |

|     `X` |   `X` |



Exemplos:



```text

TINV(P) = N

TINV(N) = P

TINV(0) = 0

```



\---



\### TMIN



A porta `TMIN` recebe dois sinais ternários e retorna o menor deles.



A ordem usada é:



```text

N < 0 < P

```



Tabela:



|   A |   B | TMIN |

| --: | --: | ---: |

| `N` | `N` |  `N` |

| `N` | `0` |  `N` |

| `N` | `P` |  `N` |

| `0` | `N` |  `N` |

| `0` | `0` |  `0` |

| `0` | `P` |  `0` |

| `P` | `N` |  `N` |

| `P` | `0` |  `0` |

| `P` | `P` |  `P` |



A `TMIN` funciona como uma espécie de AND ternário.



\---



\### TMAX



A porta `TMAX` recebe dois sinais ternários e retorna o maior deles.



Tabela:



|   A |   B | TMAX |

| --: | --: | ---: |

| `N` | `N` |  `N` |

| `N` | `0` |  `0` |

| `N` | `P` |  `P` |

| `0` | `N` |  `0` |

| `0` | `0` |  `0` |

| `0` | `P` |  `P` |

| `P` | `N` |  `P` |

| `P` | `0` |  `P` |

| `P` | `P` |  `P` |



A `TMAX` funciona como uma espécie de OR ternário.



\---



\## 2. Entradas e saídas



\### INPUT



O componente `INPUT` permite escolher manualmente um sinal ternário.



Ele pode alternar entre:



```text

N → 0 → P

```



É usado para alimentar o circuito.



Exemplo:



```text

INPUT = P

INPUT conectado em TINV

saída da TINV = N

```



\---



\### OUTPUT



O componente `OUTPUT` mostra o valor recebido.



Ele pode exibir:



```text

N

0

P

X

```



É usado para visualizar o resultado final de um circuito.



Exemplo:



```text

INPUT P → TINV → OUTPUT N

```



\---



\## 3. Barramentos de 3 trits



Um \*\*trit\*\* é o equivalente ternário de um bit.



```text

bit  = pode valer 0 ou 1

trit = pode valer N, 0 ou P

```



Um barramento de 3 trits transporta três sinais ternários ao mesmo tempo.



Exemplo:



```text

P0N

```



Isso representa:



```text

primeiro trit = P

segundo trit  = 0

terceiro trit = N

```



Em ternário balanceado, `P0N` pode ser interpretado como:



```text

P0N = (+1 × 9) + (0 × 3) + (-1 × 1)

P0N = 8

```



\---



\## 4. MERGE3



O componente `MERGE3` junta três sinais ternários individuais em um barramento de 3 trits.



Entradas:



```text

A

B

C

```



Saída:



```text

ABC

```



Exemplo:



```text

A = P

B = 0

C = N

```



Resultado:



```text

MERGE3 = P0N

```



O `MERGE3` é usado para montar pequenas palavras ternárias.



\---



\## 5. SPLIT3



O componente `SPLIT3` faz o processo contrário do `MERGE3`.



Ele recebe um barramento de 3 trits e separa em três saídas individuais.



Entrada:



```text

P0N

```



Saídas:



```text

A = P

B = 0

C = N

```



O `SPLIT3` é usado quando é necessário manipular separadamente cada trit de uma palavra ternária.



\---



\## 6. Detecção de conflito em fios



O simulador detecta conflito quando mais de uma saída tenta controlar o mesmo fio com valores diferentes.



Exemplos sem conflito:



```text

P + P → P

0 + 0 → 0

N + N → N

```



Exemplos com conflito:



```text

P + N → X

P + 0 → X

N + 0 → X

```



Tabela:



| Fonte A | Fonte B | Resultado |

| ------: | ------: | --------: |

|     `P` |     `P` |       `P` |

|     `0` |     `0` |       `0` |

|     `N` |     `N` |       `N` |

|     `P` |     `0` |       `X` |

|     `P` |     `N` |       `X` |

|     `0` |     `N` |       `X` |



O estado `X` indica que o circuito está em situação inválida ou indefinida.



\---



\## 7. TRIBUF



O `TRIBUF` é um buffer ternário controlado.



Ele possui:



```text

entrada de dados

entrada de controle

saída

```



Funcionamento:



| Controle | Saída                        |

| -------: | ---------------------------- |

|      `P` | passa o valor da entrada     |

|      `0` | alta impedância / indefinido |

|      `N` | alta impedância / indefinido |

|      `X` | `X`                          |



Exemplo:



```text

Dados = P

Controle = P

Saída = P

```



Mas:



```text

Dados = P

Controle = 0

Saída = X

```



O `TRIBUF` é útil para barramentos, pois permite que apenas um componente controle o fio por vez.



\---



\## 8. TDEC



O `TDEC` é um decodificador ternário.



Ele recebe um sinal ternário e ativa uma das três saídas.



Entrada:



```text

N, 0 ou P

```



Saídas:



```text

OUT\_N

OUT\_0

OUT\_P

```



Tabela:



| Entrada | OUT\_N | OUT\_0 | OUT\_P |

| ------: | ----: | ----: | ----: |

|     `N` |   `P` |   `N` |   `N` |

|     `0` |   `N` |   `P` |   `N` |

|     `P` |   `N` |   `N` |   `P` |

|     `X` |   `X` |   `X` |   `X` |



Uso típico:



```text

se entrada = N, ativa OUT\_N

se entrada = 0, ativa OUT\_0

se entrada = P, ativa OUT\_P

```



O `TDEC` é útil para seleção, controle e endereçamento.



\---



\## 9. TMUX3



O `TMUX3` é um multiplexador ternário.



Ele escolhe uma entre três entradas, de acordo com um seletor ternário.



Entradas:



```text

A\_N

A\_0

A\_P

SEL

```



Saída:



```text

Y

```



Tabela:



| SEL | Saída |

| --: | ----- |

| `N` | `A\_N` |

| `0` | `A\_0` |

| `P` | `A\_P` |

| `X` | `X`   |



Exemplo:



```text

A\_N = N

A\_0 = 0

A\_P = P

SEL = P

```



Resultado:



```text

Y = P

```



O `TMUX3` é uma das peças mais importantes do simulador, pois permite construir funções ternárias por tabela de decisão.



\---



\## 10. TEQ



O `TEQ` é um comparador de igualdade ternária.



Ele compara dois sinais ternários.



Entradas:



```text

A

B

```



Saída:



```text

P se forem iguais

N se forem diferentes

X se algum valor for indefinido

```



Tabela:



|   A |        B | TEQ |

| --: | -------: | --: |

| `N` |      `N` | `P` |

| `0` |      `0` | `P` |

| `P` |      `P` | `P` |

| `N` |      `0` | `N` |

| `N` |      `P` | `N` |

| `0` |      `P` | `N` |

| `X` | qualquer | `X` |



Exemplos:



```text

TEQ(P, P) = P

TEQ(P, N) = N

```



O `TEQ` é útil para comparadores, controle de fluxo e lógica condicional.



\---



\## 11. TADD



O `TADD` é um somador completo ternário balanceado.



Ele soma três valores ternários:



```text

A

B

Cin

```



E gera:



```text

Sum

Cout

```



Onde:



```text

Cin  = carry de entrada

Cout = carry de saída

```



A lógica é:



```text

total = A + B + Cin

```



Se o total for maior que `+1`, o circuito gera carry positivo.



Se o total for menor que `-1`, o circuito gera carry negativo.



Tabela de exemplos:



|   A |   B | Cin | Total | Sum | Cout |

| --: | --: | --: | ----: | --: | ---: |

| `P` | `P` | `0` |    +2 | `N` |  `P` |

| `P` | `P` | `P` |    +3 | `0` |  `P` |

| `N` | `N` | `0` |    -2 | `P` |  `N` |

| `N` | `N` | `N` |    -3 | `0` |  `N` |

| `P` | `N` | `0` |     0 | `0` |  `0` |



Exemplo:



```text

P + P + 0 = +2

```



Como `+2` não cabe em um único trit, o simulador representa o valor como:



```text

Sum = N

Cout = P

```



Porque:



```text

P × 3 + N = 3 - 1 = 2

```



O `TADD` é a base para construir:



```text

meio somador

somador completo

ALU ternária

contador ternário

processador ternário simples

```



\---



\## 12. Registrador ternário



O registrador guarda um valor ternário.



Ele possui:



```text

entrada de dados

saída

controle de atualização pelo botão Tick

```



O botão `Tick` representa um pulso de tempo.



Funcionamento:



```text

Antes do Tick:

a entrada pode mudar, mas a saída mantém o valor antigo.



Ao pressionar Tick:

o registrador copia a entrada para a saída.



Depois do Tick:

a saída mantém o valor salvo.

```



Exemplo:



```text

Entrada = P

Saída atual = 0



Pressiona Tick



Saída = P

```



Se depois a entrada mudar para `N`, a saída continua `P` até o próximo `Tick`.



O registrador permite criar circuitos sequenciais, como:



```text

registradores

contadores

memórias

máquinas de estado

CPU ternária

```



\---



\## 13. RAM9



A `RAM9` é uma memória ternária simples.



Ela possui:



```text

endereço

entrada de dados

sinal de escrita

saída de dados

```



Funcionamento básico:



```text

se Write estiver ativo:

&#x20;   salva o dado no endereço selecionado



se Write não estiver ativo:

&#x20;   mostra o dado armazenado no endereço selecionado

```



Exemplo:



```text

Endereço = 0

Dados = P

Write = P

Tick

```



Resultado:



```text

RAM\[0] = P

```



Depois:



```text

Endereço = 0

Write = N ou 0

Saída = P

```



A `RAM9` serve para criar:



```text

memória de dados

banco de registradores

armazenamento temporário

processadores ternários

```



\---



\## 14. ROM9



A `ROM9` é uma memória ternária editável de leitura.



Diferente da RAM, ela não é escrita pelo circuito durante a simulação.

O usuário edita os valores manualmente.



Ela possui:



```text

endereço

saída de dados

```



Funcionamento:



```text

Endereço selecionado → ROM retorna o valor gravado naquele endereço

```



Exemplo:



```text

ROM\[0] = P

ROM\[1] = 0

ROM\[2] = N

```



Se o endereço selecionado for `1`, a saída será:



```text

0

```



A `ROM9` é útil para:



```text

tabelas de verdade

microprogramas

instruções

constantes

programas de uma CPU ternária

```



\---



\## 15. Resumo dos componentes



| Componente | Função principal                              |

| ---------- | --------------------------------------------- |

| `TINV`     | Inverte `N` e `P`, mantendo `0`               |

| `TMIN`     | Retorna o menor valor ternário                |

| `TMAX`     | Retorna o maior valor ternário                |

| `INPUT`    | Gera sinal `N`, `0` ou `P`                    |

| `OUTPUT`   | Mostra o resultado                            |

| `MERGE3`   | Junta três trits em um barramento             |

| `SPLIT3`   | Separa um barramento em três trits            |

| `TRIBUF`   | Controla a passagem de sinal para barramentos |

| `TDEC`     | Decodifica um trit em três linhas de seleção  |

| `TMUX3`    | Escolhe uma entre três entradas               |

| `TEQ`      | Compara dois sinais ternários                 |

| `TADD`     | Soma ternária balanceada com carry            |

| `REGISTER` | Armazena um trit por Tick                     |

| `RAM9`     | Memória ternária gravável                     |

| `ROM9`     | Memória ternária editável de leitura          |



Em resumo:



```text

TINV, TMIN e TMAX constroem a lógica.

TDEC e TMUX3 constroem seleção.

TEQ constrói comparação.

TADD constrói aritmética.

REGISTER, RAM9 e ROM9 constroem memória.

```



