# Tabelas-verdade da lógica ternária balanceada

## Símbolos

| Símbolo | Valor |
|---|---:|
| N | -1 |
| 0 | 0 |
| P | +1 |
| X | indefinido/conflito |

## TINV

| A | TINV(A) |
|---:|---:|
| N | P |
| 0 | 0 |
| P | N |
| X | X |

## TMIN

| A \ B | N | 0 | P |
|---:|---:|---:|---:|
| **N** | N | N | N |
| **0** | N | 0 | 0 |
| **P** | N | 0 | P |

## TMAX

| A \ B | N | 0 | P |
|---:|---:|---:|---:|
| **N** | N | 0 | P |
| **0** | 0 | 0 | P |
| **P** | P | P | P |

## TMUX3

| SEL | Saída |
|---:|---|
| N | entrada `n` |
| 0 | entrada `z` |
| P | entrada `p` |
| X | X |

## TADD

| A | B | Cin | Sum | Cout |
|---:|---:|---:|---:|---:|
| N | N | N | 0 | N |
| N | N | 0 | P | N |
| N | N | P | N | 0 |
| N | 0 | N | P | N |
| N | 0 | 0 | N | 0 |
| N | 0 | P | 0 | 0 |
| N | P | N | N | 0 |
| N | P | 0 | 0 | 0 |
| N | P | P | P | 0 |
| 0 | N | N | P | N |
| 0 | N | 0 | N | 0 |
| 0 | N | P | 0 | 0 |
| 0 | 0 | N | N | 0 |
| 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | P | P | 0 |
| 0 | P | N | 0 | 0 |
| 0 | P | 0 | P | 0 |
| 0 | P | P | N | P |
| P | N | N | N | 0 |
| P | N | 0 | 0 | 0 |
| P | N | P | P | 0 |
| P | 0 | N | 0 | 0 |
| P | 0 | 0 | P | 0 |
| P | 0 | P | N | P |
| P | P | N | P | 0 |
| P | P | 0 | N | P |
| P | P | P | 0 | P |
