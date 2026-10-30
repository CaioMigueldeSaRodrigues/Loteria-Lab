# ADR-001 — Histórico público integral como única base analítica

**Status:** aprovado como requisito do produto; **implementação pendente**.

## Decisão

A experiência principal do Loteria Lab será um painel educacional que carrega **automaticamente um acervo público de resultados históricos**. Nenhum arquivo do visitante é necessário para abrir e explorar as estatísticas. A funcionalidade de importação CSV/TXT da versão v0.1 não será a fonte principal e deve ser removida da jornada pública ao implementar este ADR.

O escopo inicial é exclusivamente histórico da Mega-Sena, a partir do primeiro concurso e até o mais recente **confirmado pelo pipeline**. A aplicação não sugere apostas, não oferece palpites nem atribui capacidade preditiva a frequências anteriores.

## Fonte e proveniência

- O acervo canônico deve ser obtido de resultados publicados pelo operador oficial, para uso estritamente informativo/educacional.
- A publicação do acervo precisa registrar origem, instante de coleta, concurso inicial, concurso final, data do último registro, quantidade de concursos e identificador da versão.
- Uma fonte espelhada não deve ser anunciada como informação oficial sem conferência; os metadados distinguem a **origem dos resultados** da **plataforma que os compilou**.
- A aplicação lê um snapshot versionado em seu próprio host, em modo somente leitura. Não depende de requisições de cada visitante a serviços externos.
- Atualização em lote por um processo de ingestão supervisionado, independente dos usuários.

## Contrato recomendado do snapshot

```json
{
  "schemaVersion": 1,
  "modality": "megasena",
  "source": {
    "publisher": "CAIXA",
    "verification": "pending | verified"
  },
  "collectedAt": "ISO-8601 UTC",
  "firstContest": 1,
  "lastContest": 0,
  "recordCount": 0,
  "records": [
    {
      "contest": 1,
      "date": "AAAA-MM-DD",
      "numbers": [1, 2, 3, 4, 5, 6]
    }
  ]
}
```

O exemplo é **um contrato**, não dados reais. Não publicar um snapshot com `verification=pending` como histórico verificado.

## Critérios bloqueadores de publicação

1. O conjunto cobre todos os concursos de `1` a `lastContest`, sem lacunas nem duplicatas.
2. Cada concurso tem data válida, seis dezenas inteiras e distintas dentro do intervalo 1–60.
3. `recordCount` corresponde exatamente ao número de entradas e `lastContest` ao maior concurso.
4. O pipeline confronta o último concurso com a origem publicada, registra a atualização e preserva a última versão íntegra se uma coleta falhar.
5. As análises do mapa, frequências e distribuições usam **exclusivamente** esse snapshot, salvo escolha explícita do usuário por uma janela menor dentro dele.
6. O cabeçalho exibe alcance (primeiro e último concurso), data de atualização e estado da verificação.
7. Se o snapshot não for encontrado ou não estiver verificado, mostrar indisponibilidade explicativa e **não substituir silenciosamente por dados sintéticos ou parciais**.
8. Testes automatizados cobrem integralidade, datas, números inválidos, duplicatas, versionamento, falha de atualização e visualização de indisponibilidade.
9. Nenhum upload do visitante é necessário para a jornada normal.

## Não objetivos

- Não oferecer jogos, recomendações de dezenas, formas de apostar, pagamentos ou integrações com serviços de apostas.
- Não prometer aumento da probabilidade de acerto ou de premiação individual.
- Não extrapolar estatística descritiva como previsão de concursos futuros.

## Próxima entrega

Produzir um snapshot histórico íntegro e auditável com base em registros publicados, testar a verificação e integrar seu carregamento automático à UI. **Até isso ocorrer, a v0.1 segue como protótipo com importação, não como produto homologado para histórico completo.**
