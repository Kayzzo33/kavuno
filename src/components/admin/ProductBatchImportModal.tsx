"use client";

import React, { useState, useTransition, useRef } from "react";
import { importProductsBatchAction, type ImportProductItemInput } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ProductBatchImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [resultState, setResultState] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Estados de upload de arquivo e mapeamento
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ImportProductItemInput[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [step, setStep] = useState<"input" | "preview">("input");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsv = `Nome do Produto,Preco,Descricao
Suporte para Headset Gamer Dragon,95.00,Suporte resistente impresso em PETG
Action Figure Cyberpunk 2077,149.90,Pintura baseada em resina e PLA premium
Organizador de Cabos Modular,35.00,Kit com 4 pecas para organizacao de setup`;

  // Função inteligente para detectar delimitador CSV (, ; \t ou |)
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split("\n")[0] || "";
    const counts = {
      ";": (firstLine.match(/;/g) || []).length,
      ",": (firstLine.match(/,/g) || []).length,
      "\t": (firstLine.match(/\t/g) || []).length,
      "|": (firstLine.match(/\|/g) || []).length,
    };
    let best = ",";
    let maxCount = 0;
    for (const [delim, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        best = delim;
      }
    }
    return best;
  };

  // Parser flexível e inteligente para CSV / Linha por Linha / JSON
  const parseData = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setParsedItems([]);
      return;
    }

    // 1. Tenta interpretar JSON se começar com [
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          const items: ImportProductItemInput[] = [];
          const seenNames = new Set<string>();
          let duplicates = 0;

          for (const item of json) {
            const name = (item.name || item.nome || item.title || item.titulo || "").toString().trim();
            if (!name) continue;

            const lower = name.toLowerCase();
            if (seenNames.has(lower)) {
              duplicates++;
              continue;
            }
            seenNames.add(lower);

            const priceNum = Number(item.base_price || item.price || item.preco || item.valor || 89.0);
            const desc = (item.short_description || item.description || item.descricao || "").toString().trim();

            items.push({
              name,
              base_price: isNaN(priceNum) ? 89.0 : priceNum,
              short_description: desc,
              commercial_mode: "in_stock",
            });
          }

          setParsedItems(items);
          setDuplicatesCount(duplicates);
          setStep("preview");
          return;
        }
      } catch {
        // Prossegue para CSV
      }
    }

    // 2. CSV ou Delimitado por Linha
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const delimiter = detectDelimiter(trimmed);
    const firstLineCols = lines[0].split(delimiter).map((c) => c.trim().toLowerCase().replace(/["']/g, ""));

    // Verifica se a primeira linha é cabeçalho
    const hasHeader = firstLineCols.some((c) =>
      ["nome", "name", "produto", "product", "preco", "price", "valor", "descricao", "description"].includes(c)
    );

    let nameIdx = 0;
    let priceIdx = 1;
    let descIdx = 2;

    if (hasHeader) {
      firstLineCols.forEach((col, idx) => {
        if (["nome", "name", "produto", "product", "item"].includes(col)) nameIdx = idx;
        if (["preco", "price", "valor", "base_price"].includes(col)) priceIdx = idx;
        if (["descricao", "description", "detalhes", "desc"].includes(col)) descIdx = idx;
      });
    }

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const items: ImportProductItemInput[] = [];
    const seenNames = new Set<string>();
    let duplicates = 0;

    for (const rawLine of dataLines) {
      if (rawLine.startsWith("#") || rawLine.startsWith("//")) continue;

      // Suporte a aspas e delimitador
      let cols: string[] = [];
      if (rawLine.includes('"')) {
        // Separação com respeito a aspas simples/duplas
        const regex = new RegExp(`(?:^|${delimiter})("(?:[^"]|"")*"|[^${delimiter}]*)`, "g");
        let match;
        while ((match = regex.exec(rawLine)) !== null) {
          let val = match[1] || "";
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          cols.push(val.trim());
        }
      } else {
        cols = rawLine.split(delimiter).map((c) => c.trim());
      }

      const name = cols[nameIdx]?.trim();
      if (!name) continue;

      const lowerName = name.toLowerCase();
      if (seenNames.has(lowerName)) {
        duplicates++;
        continue;
      }
      seenNames.add(lowerName);

      const rawPrice = cols[priceIdx]?.replace("R$", "").replace(/\s/g, "").replace(",", ".").trim() || "";
      const price = parseFloat(rawPrice);
      const desc = cols[descIdx]?.trim() || "";

      items.push({
        name,
        base_price: isNaN(price) || price <= 0 ? 89.0 : price,
        short_description: desc,
        commercial_mode: "in_stock",
      });
    }

    setParsedItems(items);
    setDuplicatesCount(duplicates);
    setStep("preview");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseData(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleManualParse = () => {
    parseData(rawText);
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("batch_data", JSON.stringify(parsedItems));

      const res = await importProductsBatchAction(null, formData);
      if (res.success) {
        setResultState({ success: true, message: res.message });
        setStep("input");
        setParsedItems([]);
        setRawText("");
        setFileName(null);
      } else {
        setResultState({ success: false, error: res.error });
      }
    });
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setResultState(null);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "0.65rem 1.15rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        📥 Importar Arquivo / Lista (CSV, TXT)
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Entrada Inteligente
                </span>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
                  Importar Produtos em Lote (CSV, Excel ou Texto)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "1.25rem",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.8125rem",
                color: "#1e40af",
                lineHeight: 1.5,
              }}
            >
              🔒 <strong>Regra de Segurança:</strong> Todos os produtos são importados como <strong>RASCUNHO (Inativos)</strong>. Ficam concentrados na aba <em>&quot;Importados Recentemente&quot;</em> para que você possa conferir fotos, preços e ativá-los quando desejar.
            </div>

            {resultState?.error && <Alert type="error">{resultState.error}</Alert>}
            {resultState?.success && <Alert type="success">{resultState.message}</Alert>}

            {step === "input" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* 1. SELEÇÃO DE ARQUIVO */}
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "1.75rem 1rem",
                    textAlign: "center",
                    backgroundColor: "#f8fafc",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt,.json,.tsv"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                    {fileName ? `Arquivo carregado: ${fileName}` : "Clique para selecionar seu arquivo CSV / TXT"}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Compatível com separadores por vírgula (,), ponto e vírgula (;), tabulação ou pipe (|)
                  </div>
                </div>

                {/* 2. OU COLAR DIRETAMENTE */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                      Ou cole o conteúdo abaixo:
                    </label>
                    <button
                      type="button"
                      onClick={() => setRawText(sampleCsv)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.75rem",
                        color: "#4f46e5",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Preencher Modelo Exemplo
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Nome, Preco, Descricao..."
                    className="form-textarea"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.8125rem",
                      width: "100%",
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!rawText.trim()}
                    onClick={handleManualParse}
                  >
                    Analisar & Pré-Visualizar &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              /* ETAPA 2: PRÉ-VISUALIZAÇÃO COM DETECÇÃO DE DUPLICATAS */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Pré-visualização da Importação ({parsedItems.length} identificados)
                    </h3>
                    {duplicatesCount > 0 && (
                      <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 600 }}>
                        ⚠️ {duplicatesCount} item(ns) duplicado(s) descartado(s) automaticamente.
                      </span>
                    )}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => setStep("input")}>
                    Voltar & Modificar
                  </Button>
                </div>

                <div
                  style={{
                    maxHeight: "280px",
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem 0.8rem", color: "#64748b" }}>#</th>
                        <th style={{ padding: "0.6rem 0.8rem", color: "#64748b" }}>Nome do Produto</th>
                        <th style={{ padding: "0.6rem 0.8rem", color: "#64748b" }}>Preço (R$)</th>
                        <th style={{ padding: "0.6rem 0.8rem", color: "#64748b" }}>Descrição</th>
                        <th style={{ padding: "0.6rem 0.8rem", color: "#64748b", textAlign: "center" }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0.8rem", color: "#94a3b8" }}>{idx + 1}</td>
                          <td style={{ padding: "0.6rem 0.8rem", fontWeight: 600, color: "#0f172a" }}>{item.name}</td>
                          <td style={{ padding: "0.6rem 0.8rem", color: "#059669", fontWeight: 700 }}>
                            R$ {Number(item.base_price).toFixed(2).replace(".", ",")}
                          </td>
                          <td style={{ padding: "0.6rem 0.8rem", color: "#64748b", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.short_description || "-"}
                          </td>
                          <td style={{ padding: "0.6rem 0.8rem", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                              }}
                              title="Remover este item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <Button type="button" variant="secondary" onClick={() => setStep("input")}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    isLoading={isPending}
                    onClick={handleConfirmImport}
                  >
                    Confirmar Importação ({parsedItems.length} Produtos como Rascunho)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
