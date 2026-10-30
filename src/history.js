import { validate as validateNumbers } from "./stats.js";

// Checks structural completeness only. The provenance and freshness of the
// underlying source must be audited separately by the data-ingestion process.
function isISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateHistoricalSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Snapshot histórico inválido.");
  }
  if (snapshot.schemaVersion !== 1 || snapshot.modality !== "megasena") {
    throw new Error("Formato ou modalidade não suportados.");
  }
  if (!snapshot.source || typeof snapshot.source.publisher !== "string" ||
      !["pending","verified"].includes(snapshot.source.verification)) {
    throw new Error("Proveniência e estado de verificação são obrigatórios.");
  }
  if (typeof snapshot.collectedAt !== "string" ||
      !Number.isFinite(Date.parse(snapshot.collectedAt))) {
    throw new Error("Data de coleta inválida.");
  }
  const {firstContest,lastContest,recordCount,records}=snapshot;
  if (firstContest !== 1 || !Number.isSafeInteger(lastContest) ||
      lastContest < 1 || !Number.isSafeInteger(recordCount) ||
      recordCount !== lastContest || !Array.isArray(records) ||
      records.length !== recordCount) {
    throw new Error("Acervo incompleto ou metadados inconsistentes.");
  }
  for (let index=0; index<records.length; index++) {
    const record=records[index];
    if (!record || record.contest !== index+1 ||
        !isISODate(record.date) || !Array.isArray(record.numbers)) {
      throw new Error("Lacuna, ordem ou data inválida no concurso "+(index+1)+".");
    }
    validateNumbers(record.numbers);
  }
  return {
    records:records.map(row=>({
      contest:row.contest,
      date:row.date,
      numbers:[...row.numbers]
    })),
    metadata:{
      firstContest,
      lastContest,
      recordCount,
      collectedAt:snapshot.collectedAt,
      publisher:snapshot.source.publisher,
      verification:snapshot.source.verification
    }
  };
}

export function requireVerifiedHistory(snapshot) {
  const parsed=validateHistoricalSnapshot(snapshot);
  if(parsed.metadata.verification !== "verified") {
    throw new Error("Histórico não foi verificado pela rotina de dados.");
  }
  return parsed;
}
