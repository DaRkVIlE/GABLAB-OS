import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export class NotFoundError extends McpError {
  constructor(recurso: string, id: string) {
    super(ErrorCode.InvalidParams, `${recurso} não encontrado: ${id}`);
  }
}

export class ValidationError extends McpError {
  constructor(campo: string, motivo: string) {
    super(ErrorCode.InvalidParams, `Validação falhou em '${campo}': ${motivo}`);
  }
}

export class ServiceUnavailableError extends McpError {
  constructor(servico: string, detalhes?: string) {
    super(
      ErrorCode.InternalError,
      `Serviço '${servico}' indisponível${detalhes ? ': ' + detalhes : ""}`
    );
  }
}

// Wrapper para capturar erros inesperados
export function toMcpError(erro: unknown): McpError {
  if (erro instanceof McpError) return erro;
  const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
  return new McpError(ErrorCode.InternalError, mensagem);
}
