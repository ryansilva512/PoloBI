define({ "api": [
  {
    "type": "post",
    "url": "/api/base-conhecimento/buscar-contexto",
    "title": "buscarContextoPergunta",
    "description": "<p>Busca a lista de contextos para uma pergunta</p>",
    "name": "buscarContextoPergunta",
    "group": "Base_Conhecimento",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"pergunta\": \"Como instalar uma impressora na rede?\",   \n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n   {\n       \"id\": 1820,\n       \"artigo\": \"\"\n   },\n   {\n       \"id\": 1821,\n       \"artigo\": \"\"\n   }\n]",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/baseConhecimentoController.js",
    "groupTitle": "Base_Conhecimento"
  },
  {
    "type": "post",
    "url": "/api/base-conhecimento/perguntar-contexto",
    "title": "perguntarComContexto",
    "description": "<p>Faz pergunta e devolve resposta baseada no contexto da base de conhecimento. É preciso ter integração com IA habilitada e tokenização na base de conhecimento.</p>",
    "name": "perguntarComContexto",
    "group": "Base_Conhecimento",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"pergunta\": \"Como instalar uma impressora na rede?\",   \n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"status_code\": 200,\n    \"resposta\": \"\",\n    \"prompt\": \"\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/baseConhecimentoController.js",
    "groupTitle": "Base_Conhecimento"
  },
  {
    "type": "post",
    "url": "/api/chamado/acompanhamento/criar",
    "title": "criarAcompanhamento",
    "description": "<p>Cria um novo acompanhamento para o chamado</p>",
    "name": "criarAcompanhamento",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n\t    \"acompanhamento_ticket\": \"2270\",\n\t    \"acompanhamento_descricao\": \"teste 1 hora externa nao comercial\",\n\t    \"acompanhamento_privado\": false,\n\t    \"atendimento_total_horas\": \"01:00\",\n\t    \"atendimento_valor_deslocamento\": 0,\n\t    \"atendimento_horario_comercial\": false,\n\t    \"atendimento_externo\": true\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 204 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "post",
    "url": "/api/chamado/anexo/criar/:chamado",
    "title": "criarAnexo",
    "description": "<p>Cria um novo anexo para o chamado (formData)</p>",
    "name": "criarAnexo",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "\"anexo\": \"file\"",
          "type": "formData"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 204 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "post",
    "url": "/api/chamado/criar",
    "title": "criarChamado",
    "description": "<p>Cria um novo chamado para o cliente</p>",
    "name": "criarChamado",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"cliente_id\": \"{TOKEN_DO_CLIENTE}\",\n     \"chamado_assunto\": \"Teste\",\n     \"chamado_descricao\": \"Teste\",\n     \"chamado_email\": \"teste@milvus.com.br\",\n     \"chamado_telefone\": \"(11) 1234-1234\",\n     \"chamado_contato\": \"Teste\",\n     \"chamado_tecnico\": \"teste@teste.com.br\",\n     \"chamado_mesa\": \"Mesa padrão\",\n     \"chamado_setor\": \"Setor padrão\",\n     \"chamado_categoria_primaria\": \"Backup\",\n     \"chamado_categoria_secundaria\": \"Verificar\",\n     \"categoria_id\": 1,\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n123",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "put",
    "url": "/api/chamado/finalizar",
    "title": "finalizarChamado",
    "description": "<p>Finaliza o chamado</p>",
    "name": "finalizarChamado",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"chamado_codigo\": \"1234\",\n     \"chamado_servico_realizado\": \"Teste\",\n     \"chamado_equipamento_retirado\": \"Teste\",\n     \"chamado_material_utilizado\": \"Teste\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n123",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "post",
    "url": "/api/chamado/listagem",
    "title": "listagemChamados",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>**  A opção true ordenará do maior para o menor e false ao contrário, o padrão é true (Decresente) **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"assunto\"",
              "\"codigo\"",
              "\"nome_contato\"",
              "\"email_conferencia\""
            ],
            "optional": true,
            "field": "order_by",
            "description": "<p>** É possível ordenar por todos os campos de filtro, se não informado o padrão é codigo **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100",
              "200"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 e o limite máximo é de 1000 registros por requisição **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n \"filtro_body\": {\n     \"assunto\": \"\",\n     \"codigo\": \"\",\n     \"nome_contato\": \"\",\n     \"email_conferencia\": \"\",\n     \"data_criacao\": \"\",\n     \"data_solucao\": \"\",\n     \"cliente_token\": \"\",\n     \"cliente_id\": \"\",\n     \"status\": \"\",\n     \"tecnico\": \"\",\n     \"cliente\": \"\",\n     \"mesa_trabalho\": \"\",\n     \"categoria_primaria\": \"\",\n     \"categoria_secundaria\": \"\",\n     \"categorias_id\": [256],\n     \"total_avaliacao\": 5,\n     \"descricao_avaliacao\" : \"Tudo certo!\",\n     \"setor\": \"\",\n     \"tipo_ticket\": \"\",\n     \"dispositivo\": \"asus\",\n     \"possui_avaliacao\": true,\n     \"prioridade\": 1,\n     \"data_hora_criacao_inicial\": \"2022-12-04 12:45:00\",\n     \"data_hora_criacao_final\": \"2022-12-16 17:50:00\",\n     \"data_hora_solucao_inicial\": \"2022-12-04 12:45:00\",\n     \"data_hora_solucao_final\": \"2022-12-16 17:50:00\",\n     \"apresentar_conciliados\": false,\n     \"somente_conciliados\": false\n }\n}\n\n---------------Opções de filtro status (filtrar pelo id ou texto---------------\n{A fazer - 1 ou \"AgAtendimento\" }\n{Atendendo - 2 ou \"Atendendo\"}\n{Pausado - 3 ou \"Pausado\"}\n{Finalizado - 4 ou \"Finalizado\"}\n{Conferência - 5 ou \"Conferencia\"}\n{Agendado - 6 ou \"Agendado\"}\n{Expirado - 7 ou \"Expirado\"}\n{Tickets abertos - 9 ou \"ChamadosAbertos\"}\n{Tickets abertos com tarefas expiradas - 22 ou \"ChamadosAbertosTarefasExpiradas\"}\n{Tickets abertos com tarefas agendadas - 23 ou \"ChamadosAbertosTarefasAgendadas\"}\n{Todos - 10 ou \"Todos\"}\n{Ag. solução - 11 ou \"AgSolucao\"}\n{Tickets aguardando atendimento ou não agendados - 13 ou \"AbertosNaoAgendados\"}\n{Sem técnico - 14 ou \"SemTecnico\"}\n--------------------------------------------------------------------------------",
          "type": "json"
        }
      ]
    },
    "description": "<p>Listagem de chamados</p>",
    "name": "listagemChamados",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n     \"meta\": {\n         \"paginate\": {\n             \"current_page\": \"1\",\n             \"total\": 1,\n             \"to\": 50,\n             \"from\": 1,\n             \"last_page\": 1,\n             \"per_page\": 50\n         }\n     },\n     \"lista\": [{\n         \"categoria_primaria\": \"Hardware\",\n         \"categoria_secundaria\": \"Troca de peça\",\n         \"categorias\": \"Hardware/Troca de peça\",\n         \"total_avaliacao\": null,\n         \"descricao_avaliacao\": null,\n         \"tecnico\": \"Favio Ramos\",\n         \"mesa_trabalho\": \"mesa favio teste\",\n         \"data_solucao\": \"2020-10-05 17:30:42\",\n         \"dispositivo_vinculado\": null,\n         \"servico_realizado\": \"teste\",\n         \"data_agendamento\": null,\n         \"data_resposta\": \"2020-10-05 17:30:04\",\n         \"equipamento_retirado\": null,\n         \"material_utilizado\": null,\n         \"setor\": null,\n         \"prioridade\": \"Crítico\",\n         \"codigo\": 857,\n         \"id\": 884790,\n         \"cliente\": \"MILVUS MILVUS\",\n         \"cliente_token\": \"ASSDF\",\n         \"assunto\": \"teste de  automatização\",\n         \"descricao\": \"teste de ticket automatico\",\n         \"contato\": \"favio\",\n         \"email_conferencia\": \"favio.ramos@milvus.com.br\",\n         \"telefone\": \"\",\n         \"data_criacao\": \"2019-11-13 06:00:02\",\n         \"data_modificacao\": \"2020-10-05 17:30:42\",\n         \"conciliado\": false,\n         \"codigo_do_conciliado\": \"10\",\n         \"total_horas\": \"00:00:00\",\n         \"origem\": \"Tickets pré-programados\",\n         \"status\": \"Conferência\",\n         \"impacto\": \"Não possui\",\n         \"urgencia\": \"Não possui\",\n         \"ultima_log\": {\n             \"tecnico\": \"julio fatec\",\n             \"texto\": \"Ticket finalizado: aaaaaa\",\n             \"texto_html\": null,\n             \"data\": \"2021-04-05 11:13:34\"\n         },\n         \"ultimas_cinco_logs\": [],\n         \"motivo_pausa\": \"\",\n         \"email_tecnico\": \"favio.ramos@milvus.com.br\",\n         \"sla\": {\n             \"is_sla_pausada\": false,\n             \"total_sla_resposta_programado\": \"02:00\",\n             \"total_sla_solucao_programado\": \"04:00\",\n             \"total_pausas_sla\": 0,\n             \"data_expiracao_sla\": \"2020-10-07 09:20:00\",\n             \"status_sla_resposta\": \"Estourado\",\n             \"status_sla_solucao\": \"Em conformidade\",\n             \"resposta\": {\n                 \"status\": \"Estourado\",\n                 \"tempo_gasto\": \"1931:20\",\n                 \"tempo_restante\": null,\n                 \"porcentagem\": 100\n             },\n             \"solucao\": {\n                 \"status\": \"Em conformidade\",\n                 \"tempo_gasto\": \"00:00\",\n                 \"tempo_restante\": null,\n                 \"porcentagem\": \"0.0\"\n             }\n         },\n         \"status_sla_resposta\": \"Estourado\",\n         \"status_sla_solucao\": \"Em conformidade\"\n     }]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "get",
    "url": "/api/chamado/acompanhamento/{chamado_codigo}",
    "title": "listarAcompanhamentos",
    "description": "<p>Lista acompanhamentos do chamado por técnicos e clientes</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"comentarios\"",
              "\"interacoes\"",
              "\"sla\"",
              "\"criacoes\"",
              "\"pausas\"",
              "\"finalizacoes\"",
              "\"anexos\"",
              "\"email\"",
              "\"ligacoes\"",
              "\"excluidos\""
            ],
            "optional": true,
            "field": "tipo",
            "description": "<p>** Se não informado, mostra todos os tipos **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"true\"",
              "\"false\""
            ],
            "optional": true,
            "field": "privado",
            "description": "<p>** Se não informado, mostra todos **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"tecnico\"",
              "\"cliente\""
            ],
            "optional": true,
            "field": "perfil",
            "description": "<p>** Filtra acompanhamentos pelo perfil **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "pessoa",
            "description": "<p>** Filtra pelo nome do técnico ou cliente **</p>"
          }
        ]
      }
    },
    "name": "listarAcompanhamentos",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n     \"status_code\": 200,\n     \"retorno\": [{\n         \"pessoa\": \"Milvus\",\n         \"perfil\": \"tecnico\",\n         \"texto\": \"teste\",\n         \"texto_html\": \"<p>teste</p>\",\n         \"data\": \"2021-06-24 16:43:19\",\n         \"privado\": true,\n         \"log_tipo_id\": 6,\n         \"log_tipo_text\": \"Novo\",\n         \"tipo\": \"comentarios\",\n         \"is_excluido\": false\n     }]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "get",
    "url": "/api/chamado/acompanhamento/tecnico/{chamado_codigo}",
    "title": "listarAcompanhamentosTecnicos",
    "description": "<p>Lista todos os acompanhamentos feito por técnicos</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"comentarios\"",
              "\"interacoes\"",
              "\"sla\"",
              "\"criacoes\"",
              "\"pausas\"",
              "\"finalizacoes\"",
              "\"anexos\"",
              "\"email\"",
              "\"ligacoes\"",
              "\"excluidos\""
            ],
            "optional": true,
            "field": "tipo",
            "description": "<p>** Se não informado, mostra todos os tipos **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"true\"",
              "\"false\""
            ],
            "optional": true,
            "field": "privado",
            "description": "<p>** Se não informado, mostra todos **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"nome do tecnico\""
            ],
            "optional": true,
            "field": "tecnico",
            "description": "<p>** Se não informado, mostra de todos os tecnicos **</p>"
          }
        ]
      }
    },
    "name": "listarAcompanhamentosTecnicos",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n     \"status_code\": 200,\n     \"retorno\": [{\n         \"tecnico\": \"Milvus\",\n         \"texto\": \"teste\",\n         \"texto_html\": \"<p>teste</p>\",\n         \"data\": \"2021-06-24 16:43:19\",\n         \"privado\": true\n\t\t    \"log_tipo_id\": 6,\n         \"log_tipo_text\": \"Novo\",\n         \"tipo\": \"comentarios\",\n         \"is_excluido\": false\n     }]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "post",
    "url": "/api/chamado/ligacao",
    "title": "salvarLigacao",
    "description": "<p>Salva os dados de ligação</p>",
    "name": "salvarLigacao",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n\t    \"start_at\":\"2020-04-23 15:51:26\",\n\t    \"end_at\":\"2020-04-23 15:51:26\", \n\t    \"status\":\"200\",\n\t    \"record_url\": \"https://www.google.com.br/\",\n\t    \"id_ticket\":\"885425\",\n\t    \"duration\":\"00:00:02\",\n\t    \"ramal\":\"8383\",\n\t    \"user_milvus\": 123\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "get",
    "url": "/api/chamado/validar-abertura-contrato",
    "title": "validarAberturaContrato",
    "description": "<p>Verifica abertura de chamados baseado no contrato através do token do cliente</p>",
    "name": "validarAberturaContratoToken",
    "group": "Chamado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "cliente_token",
            "description": "<p>Token do cliente.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n     \"pode_abrir_chamado\": true,\n     \"is_retencao\": false,\n     \"limite_contrato\": null,\n     \"mensagem_erro\": \"\",\n     \"possui_contrato\": true,\n     \"mostra_aviso_cliente_sem_contrato\": true,\n     \"cobrancas\": []\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chamadoController.js",
    "groupTitle": "Chamado"
  },
  {
    "type": "post",
    "url": "/api/chat/listagem",
    "title": "listagemChats",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>**  A opção true ordenará do maior para o menor e false ao contrário, o padrão é true (Decresente) **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"assunto\"",
              "\"codigo\"",
              "\"nome_contato\"",
              "\"email_conferencia\""
            ],
            "optional": true,
            "field": "order_by",
            "description": "<p>** É possível ordenar por todos os campos de filtro, se não informado o padrão é codigo **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 e o limite máximo é de 100 registros por requisição **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"filtro_body\" : {\n         \"contato\": \"teste\",\n         \"fila_atendimento\": \"Suporte\",\n         \"widget\": \"Whatsapp\",\n         \"tabulacao\": \"Apenas dúvidas\",\n         \"tecnico_ativo\": \"teste@milvus.com.br\"\n         \"status\": 1,\n         \"total_avaliacao\": 1,\n         \"data_criacao\": \"2016-01-01\",\n         \"data_finalizacao\": \"2016-02-18\",\n         \"data_atendimento\": \"2016-01-01\",\n         \"data_criacao_inicial\": \"2016-02-04\",\n         \"data_criacao_final\": \"2016-02-17\",\n         \"data_finalizacao_inicial\": \"2016-02-04\",\n         \"data_finalizacao_final\": \"2016-02-17\",\n         \"data_atendimento_inicial\": \"2016-02-04\",\n         \"data_atendimento_final\": \"2016-02-17\",\n     }\n}",
          "type": "json"
        }
      ]
    },
    "description": "<p>Listagem de chats</p>",
    "name": "listagemChats",
    "group": "Chat",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"meta\": {\n        \"paginate\": {\n            \"current_page\": \"1\",\n            \"total\": 3,\n            \"to\": 1,\n            \"from\": 1,\n            \"last_page\": 3,\n            \"per_page\": \"1\"\n        }\n    },\n    \"lista\": [\n        {\n            \"iniciado_pelo_operador\": true,\n            \"is_whatsapp\": true,\n            \"possui_mensagens_nao_lidas\": false,\n            \"is_finalizado_inatividade\": false,\n            \"is_telegram\": false,\n            \"whatsapp_oficial\": true,\n            \"tempo_total\": \"00:11\",\n            \"tempo_atendimento\": \"00:11\",\n            \"modo_avaliacao_ligado\": false,\n            \"is_finalizado_cliente\": false,\n            \"descricao_finalizacao\": \"adasd\",\n            \"data_final\": \"2024-10-23T20:33:18.000Z\",\n            \"data_ultima_interacao\": \"2024-10-23T20:33:18.000Z\",\n            \"whatsapp_numero_valido\": \"5511962299724\",\n            \"data_inicio_atendimento\": \"2024-10-23 17:23:10\",\n            \"fila_enviada\": true,\n            \"data_atendimento_fila\": \"2024-10-23 17:23:10\",\n            \"tecnico_ativo\": \"Teste\",\n            \"status\": \"Finalizado\",\n            \"numero_contato\": \"5511911111111\",\n            \"numero_empresa\": \"5511922222222\",\n            \"possui_fila_atribuida\": true,\n            \"tabulacao\": \"Apenas dúvidas\",\n            \"cliente\": \"A. CLIENTE GRUPO CATEGORIAS\",\n            \"nome_contato\": \"Teste \",\n            \"email_contato\": null,\n            \"ultima_mensagem\": \"Obrigado, até logo.\",\n            \"data_mensagem\": \"23/10/2024 17:33:18\",\n            \"fila_atendimento\": \"Geral Transf\",\n            \"widget\": \"Whatsapp111\",\n            \"chamado_vinculado\": 64015,\n            \"mensagens\": [\n                {\n                    \"data_mensagem\": \"2024-10-23 17:33:18\",\n                    \"tipo_mensagem\": \"Automatica\",\n                    \"body\": \"Obrigado, até logo.\",\n                    \"status_mensagem\": 1,\n                    \"tipo\": \"botao\",\n                    \"enviado_por\": \"robo\",\n                    \"autor_nome\": \"milvus\",\n                    \"autor_foto\": \"https://milvus-publico.s3.sa-east-1.amazonaws.com/logos/milvus-robo-chat.png\",\n                    \"autor_tipo\": \"Bot\"\n                },\n                {\n                    \"data_mensagem\": \"2024-10-23 17:33:18\",\n                    \"tipo_mensagem\": \"Automatica\",\n                    \"body\": \"Por favor, nos conte como foi o seu atendimento.\\n\\n1.😔 Péssimo\\n\\n2.🙁 Ruim\\n\\n3.😐 Regular\\n\\n4.😀 Bom\\n\\n5.🤩 Excelente\\n\\n9.❌ Não avaliar\",\n                    \"status_mensagem\": 1,\n                    \"tipo\": \"botao\",\n                    \"enviado_por\": \"robo\",\n                    \"autor_nome\": \"milvus\",\n                    \"autor_foto\": \"https://milvus-publico.s3.sa-east-1.amazonaws.com/logos/milvus-robo-chat.png\",\n                    \"autor_tipo\": \"Bot\"\n                },\n                {\n                    \"data_mensagem\": \"2024-10-23 17:23:33\",\n                    \"tipo_mensagem\": \"Comum\",\n                    \"body\": \"Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us.\",\n                    \"status_mensagem\": 1,\n                    \"tipo\": \"texto\",\n                    \"enviado_por\": \"tecnico\",\n                    \"autor_nome\": \"Teste\",\n                    \"autor_foto\": null,\n                    \"autor_tipo\": \"Tecnico\"\n                }\n            ],\n            \"id\": \"67195b2fcbf4bf4ae87ff0ac\"\n        }\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/chatController.js",
    "groupTitle": "Chat"
  },
  {
    "type": "get",
    "url": "/api/cliente/busca",
    "title": "ListarCliente",
    "description": "<p>Busca clientes caso seja informado o valor do parâmetro &quot;documento&quot; com base no ID. Caso esse parâmetro não seja repassado, será retornada a listagem de todos os clientes. A resposta contém todos os campos do cliente, exceto os campos de controle.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"59759145000108\""
            ],
            "optional": false,
            "field": "documento",
            "description": "<p>(Não Obrigatório).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"Teste\""
            ],
            "optional": false,
            "field": "nome_fantasia",
            "description": "<p>(Não Obrigatório). Página da listagem.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "allowedValues": [
              "1",
              "2",
              "3"
            ],
            "optional": false,
            "field": "status",
            "description": "<p>(Não Obrigatório). Caso não informado, o padrão utilizado é &quot;1&quot; (filtra clientes Ativos). Valores permitidos: &quot;1&quot; (filtra somente Ativos), &quot;2&quot; (filtra somente Bloqueados) ou &quot;3&quot; (filtra Ativos e Bloqueados).</p>"
          }
        ]
      }
    },
    "name": "ListarCliente",
    "group": "Cliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"lista\": [\n    {\n      \"id\": 30753,\n      \"razao_social\": \"Teste cliente 1\",\n      \"nome_fantasia\": \"Teste cliente 1\",\n      \"cnpj_cpf\": \"111111000111\",\n      \"inscricao_estadual\": \"123\",\n      \"site\": \"www.site.com\",\n      \"sexo\": null,\n      \"is_fisica\": false,\n      \"is_ativo\": true,\n      \"data_nascimento\": null,\n      \"observacao\": \"obs\",\n      \"is_sla\": true,\n      \"is_esporadico\": false,\n      \"token\": \"KEN7B5\",\n      \"timezone\": \"America/Sao_Paulo\",\n      \"idioma\": 1,\n      \"bc_cliente_id\": null,\n      \"tipo_tempo_sla_id\": 1,\n      \"pais_id\": null,\n      \"cliente_matriz_id\": null,\n      \"motivo_bloqueio\": null,\n      \"tipo_moeda\": null,\n      \"is_visivel\": true,\n      \"equipes\": [\"EQUIPE 1\", \"EQUIPE 2\"],\n      \"grupo_categorias\": [\"Categoria 1\", \"Categoria 2\"]\n    }\n  ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/clienteController.js",
    "groupTitle": "Cliente"
  },
  {
    "type": "put",
    "url": "/api/cliente/alterar/:id",
    "title": "alterarCliente",
    "description": "<p>Altera um cliente com base no id</p>",
    "name": "alterarCliente",
    "group": "Cliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"cliente_documento\": 11123445667,\n     \"cliente_site\": \"www.site.com\",\n     \"cliente_observacao\": \"teste\",\n     \"cliente_ativo\": true,\n     \"cliente_id_integracao\": 123,\n     \"cliente_pessoa_fisica\": {\n         \"nome\": \"teste\",\n         \"data_nascimento\": \"2019-09-09\",\n         \"sexo\": \"F\"\n     },\n     \"cliente_pessoa_juridica\": {\n         \"nome_fantasia\": \"teste\",\n         \"razao_social\": \"teste\",\n         \"inscricao_estadual\": \"\"\n     }\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 204 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/clienteController.js",
    "groupTitle": "Cliente"
  },
  {
    "type": "post",
    "url": "/api/cliente/criar",
    "title": "criarCliente",
    "description": "<p>Cria um novo cliente e atribui ele para todas as equipes ativas</p>",
    "name": "criarCliente",
    "group": "Cliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"cliente_documento\": 11123445667,\n     \"cliente_site\": \"www.site.com\",\n     \"cliente_observacao\": \"teste\",\n     \"cliente_ativo\": true,\n     \"cliente_id_integracao\": 0* Para cadastro sequencial de clientes.  \n     \"cliente_pessoa_fisica\": {\n         \"nome\": \"teste\",\n         \"data_nascimento\": \"2019-09-09\",\n         \"sexo\": \"F\"\n     },\n     \"cliente_pessoa_juridica\": {\n         \"nome_fantasia\": \"teste\",\n         \"razao_social\": \"teste\",\n         \"inscricao_estadual\": \"\"\n     },\n     \"cliente_enderecos\": [{\n         \"endereco_padrao\": true,\n         \"endereco_descricao\" : \"exemplo 1\",\n         \"endereco_cep\" : \"00000000\",\n         \"endereco_logradouro\" : \"Rua exemplo 1\",\n         \"endereco_numero\" : \"123\",\n         \"endereco_complemento\": \"Andar exemplo 3\",\n         \"endereco_bairro\": \"exemplo 4\",\n         \"endereco_cidade\": \"exemplo 5\",\n         \"endereco_estado\": \"SP\"\n     }],\n     \"cliente_contatos\": [{\n         \"contato_padrao\": true,\n         \"contato_descricao\": \"Teste\",\n         \"contato_email\": \"cassiano@teste.com.br\",\n         \"contato_telefone\": \"(11) 1234-5678\",\n         \"contato_celular\": \"(11) 97654-3210\",\n         \"contato_observacao\": \"teste de obs\"\n     }]\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n123",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/clienteController.js",
    "groupTitle": "Cliente"
  },
  {
    "type": "post",
    "url": "/api/cliente/contato/criar",
    "title": "criarContato",
    "description": "<p>Cria um novo contato para o cliente</p>",
    "name": "criarContato",
    "group": "Cliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"cliente_id\": \"ABC123\",\n     \"contato_descricao\": \"Teste\",\n     \"contato_email\": \"teste@milvus.com.br\",\n     \"contato_telefone\": \"(11) 1234-1234\",\n     \"contato_celular\": \"(11) 91234-1234\",\n     \"contato_observacao\": \"Teste\",\n     \"is_padrao\": \"false\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n1234",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/clienteController.js",
    "groupTitle": "Cliente"
  },
  {
    "type": "delete",
    "url": "/api/cliente/excluir/:id",
    "title": "excluirCliente",
    "description": "<p>Exclui um cliente com base no id</p>",
    "name": "excluirCliente",
    "group": "Cliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 204 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/clienteController.js",
    "groupTitle": "Cliente"
  },
  {
    "type": "get",
    "url": "/api/cliente/contato/pesquisar",
    "title": "pesquisarContatos",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"(11) 12345-6789\""
            ],
            "optional": true,
            "field": "telefone",
            "description": "<p>** Para perquisar por telefone **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"teste@hotmail.com\""
            ],
            "optional": true,
            "field": "email",
            "description": "<p>** Para perquisar por Email **</p>"
          }
        ]
      }
    },
    "description": "<p>Busca todos os contatos que tenham o parametro informado na pesquisa</p>",
    "name": "pesquisarContatos",
    "group": "Cliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n    {\n        \"cliente_nome\": \"Milvus\",\n        \"cliente_id\": \"ABC123\",\n        \"contato_descricao\": \"Milvus\",\n        \"contato_email\": \"contato@milvus.com.br\",\n        \"observacao\": \"Milvus\",\n        \"contato_telefone\": \"11123456789\",\n        \"contato_celular\": \"11123456789\"\n    }\n]",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/clienteController.js",
    "groupTitle": "Cliente"
  },
  {
    "type": "get",
    "url": "/api/dispositivos/logs/{dispositivo_id}",
    "title": "buscaLogsPorDispositivo",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_paginate",
            "description": "<p>** Se não informado o padrão é true **</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>** Se não informado o padrão é false **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"id\"",
              "\"nome\""
            ],
            "optional": true,
            "field": "order_by",
            "description": "<p>** Se não informado o padrão é descricao **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      }
    },
    "description": "<p>Lista todas as logs do dispositivo</p>",
    "name": "buscaLogsPorDispositivo",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"meta\": {\n        \"paginate\": {\n            \"current_page\": 1,\n            \"total\": 2,\n            \"to\": 1,\n            \"from\": 1,\n            \"last_page\": 2,\n            \"per_page\": \"1\"\n        }\n    },\n    \"lista\": [\n        {\n            \"data_criacao\": \"2020-05-27T14:45:39.218Z\",\n            \"log\": \"A licença do sistema operacional foi alterada de [] para [W269N-WFGWX-YVC9B-4J6C9-T83GX]\"\n        }\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "get",
    "url": "/api/dispositivos/buscar",
    "title": "buscarDispositivo",
    "description": "<p>Busca os dispositivos por patrimonio, serial, id e cliente</p>",
    "name": "buscarDispositivo",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "142"
            ],
            "optional": true,
            "field": "id",
            "description": "<p>** Filtra por ID de dispositivo</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "1456"
            ],
            "optional": true,
            "field": "cliente",
            "description": "<p>** Filtra por cliente</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "PR1234"
            ],
            "optional": true,
            "field": "patrimonio",
            "description": "<p>** Filtra por patrimonio</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "SR1234"
            ],
            "optional": true,
            "field": "serial",
            "description": "<p>** Filtra por serial</p>"
          }
        ]
      }
    },
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "post",
    "url": "/api/dispositivos/",
    "title": "criaDispositivo",
    "description": "<p>Cria dispositivo</p>",
    "name": "criaDispositivo",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n   \"--CAMPOS OBRIGATÓRIOS--\": {},  \n   \"apelido\": \"Computador X\",\n   \"cliente_id\": 1456,\n   \"hostname\": \"ASU-45000\",\n   \"tipo_dispositivo_id\": 2,      \n    \n   \"--CAMPOS OPCIONAIS--\": {},  \n  \"armazenamento\": null,\n  \"arquitetura_sistema_operacional\": null,\n  \"cod_tercerizada\": null,\n  \"cpu_usage\": null,\n  \"data_compra\": \"2020-04-16T00:00:00.000Z\",\n  \"data_exclusao\": null,\n  \"data_garantia\": \"2020-04-30T00:00:00.000Z\",\n  \"dispositivo_locado_id\": null,\n  \"dominio\": null,\n  \"fabricante\": \"teste\",\n  \"firewall_ativo\": null,\n  \"gps_latitude\": null,\n  \"gps_longitude\": null,\n  \"grupo_dispositivo_id\": null,\n  \"ip_externo\": null,\n  \"ip_interno\": \"192.168.0.149\",\n  \"is_agent\": false,\n  \"is_ativo\": true,\n  \"is_gerenciavel\": false,\n  \"is_locado\": false,\n  \"is_nobreak\": false,\n  \"is_notebook\": false,\n  \"is_servidor\": false,\n  \"is_tablet\": false,\n  \"is_usb\": false,\n  \"is_vm\": false,\n  \"is_wireless\": false,\n  \"localizacao\": \"Escritorio\",\n  \"macaddres\": \"12:34:12:54:45:12\",\n  \"marca\": \"ASU\",\n  \"mobile_bateria_porcentagem\": null,\n  \"mobile_bateria_temperatura\": null,\n  \"mobile_blueetooth_nome\": null,\n  \"mobile_blueetooth_status\": null,\n  \"mobile_bssid\": null,\n  \"mobile_conexao_movel\": null,\n  \"mobile_dhcp_server\": null,\n  \"mobile_dns_primario\": null,\n  \"mobile_dns_secundario\": null,\n  \"mobile_fabricante\": null,\n  \"mobile_gateway\": null,\n  \"mobile_hardware\": null,\n  \"mobile_ip\": null,\n  \"mobile_is_dual_chip\": false,\n  \"mobile_is_tablet\": false,\n  \"mobile_is_view_block_app\": null,\n  \"mobile_macaddress\": null,\n  \"mobile_memoria_disponivel\": null,\n  \"mobile_memoria_total\": null,\n  \"mobile_memoria_utilizada\": null,\n  \"mobile_modelo\": null,\n  \"mobile_netmask\": null,\n  \"mobile_numero_sim1\": null,\n  \"mobile_numero_sim2\": null,\n  \"mobile_processador\": null,\n  \"mobile_roaming\": null,\n  \"mobile_serial\": null,\n  \"mobile_sim1_correiodevoz\": null,\n  \"mobile_sim1_imei\": null,\n  \"mobile_sim1_is_ativo\": false,\n  \"mobile_sim1_is_roaming\": false,\n  \"mobile_sim1_iso\": null,\n  \"mobile_sim1_operadora\": null,\n  \"mobile_sim1_rede\": null,\n  \"mobile_sim2_correiodevoz\": null,\n  \"mobile_sim2_imei\": null,\n  \"mobile_sim2_is_ativo\": false,\n  \"mobile_sim2_is_roaming\": false,\n  \"mobile_sim2_iso\": null,\n  \"mobile_sim2_operadora\": null,\n  \"mobile_sim2_rede\": null,\n  \"mobile_ssid\": null,\n  \"mobile_storage_externo_disponivel\": null,\n  \"mobile_storage_externo_total\": null,\n  \"mobile_storage_externo_utilizado\": null,\n  \"mobile_storage_interno_disponivel\": null,\n  \"mobile_storage_interno_total\": null,\n  \"mobile_storage_interno_utilizado\": null,\n  \"mobile_sync_tempo\": null,\n  \"mobile_sync_tipo\": null,\n  \"mobile_tecnologia_transmissao\": null,\n  \"mobile_versao_android\": null,\n  \"mobile_versao_firmware\": null,\n  \"mobile_versao_ios\": null,\n  \"mobile_versao_windows_phone\": null,\n  \"mobile_view_inventario\": null,\n  \"mobile_view_novo_chamado\": null,\n  \"mobile_wifi_status\": null,\n  \"modelo\": null,\n  \"modelo_notebook\": null,\n  \"nobreak_id\": 708,\n  \"numero_serial\": \"1234\",\n  \"numero_serie_bateria\": \"123\",\n  \"numero_telefone\": null,\n  \"observacao\": null,\n  \"patrimonio\": null,\n  \"periferico_rede_id\": null,\n  \"placa_mae\": null,\n  \"placa_mae_modelo\": null,\n  \"placa_mae_product\": \"\",\n  \"placa_mae_serial\": null,\n  \"porta_sip\": null,\n  \"portas_rtp\": null,\n  \"possui_antivirus\": false,\n  \"possui_display\": false,\n  \"potencia\": \"4500w\",\n  \"processador\": null,\n  \"proxy_endereco\": null,\n  \"proxy_porta\": null,\n  \"proxy_senha\": null,\n  \"proxy_usuario\": null,\n  \"qtd_portas\": null,\n  \"ram_total\": null,\n  \"ram_usage\": null,\n  \"ramal\": null,\n  \"rede\": null,\n  \"senha\": null,\n  \"servidor_voip\": null,\n  \"sistema_operacional\": \"Windows\",\n  \"sistema_operacional_atualizado\": null,\n  \"sistema_operacional_disco\": null,\n  \"sistema_operacional_licenca\": null,\n  \"sistema_operacional_servicepack\": null,\n  \"sistema_operacional_versao_build\": null,\n  \"status_vulnerabilidade_id\": null,\n  \"teamviewer_id\": null,\n  \"temperatura_cpu\": null,\n  \"tempo_de_troca_bateria\": \"12\",\n  \"TipoNobreak_id\": null,\n  \"TipoPerifericoRede\": null,\n  \"TipoPerifericoRedeVelocidade\": null,\n  \"total_alertas\": 0,\n  \"total_maximo_slots\": null,\n  \"total_processadores\": null,\n  \"update_ativo\": null,\n  \"usuario\": null,\n  \"usuario_logado\": null,\n  \"versao_client\": null,\n  \"voltagem_entrada\": null,\n  \"voltagem_saida\": null,\n  \"wireless_senha\": null,\n  \"wireless_ssid\": null\n }",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  dispositivo_id: 626\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "put",
    "url": "/api/dispositivos/",
    "title": "editarDispositivo",
    "description": "<p>Edita dispositivo</p>",
    "name": "editarDispositivo",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": " {\n    \"id\": 626,\n    \"cliente_id\": 1456,\n    \"grupo_dispositivo_id\": null,\n    \"hostname\": \"ASU-45000\",\n    \"ip_interno\": \"192.168.0.149\",\n    \"mobile_is_tablet\": false,\n    \"ip_externo\": null,\n    \"cpu_usage\": null,\n    \"is_vm\": false,\n    \"dominio\": null,\n    \"sistema_operacional\": \"\",\n    \"sistema_operacional_licenca\": null,\n    \"sistema_operacional_servicepack\": null,\n    \"ram_total\": null,\n    \"ram_usage\": null,\n    \"placa_mae\": null,\n    \"placa_mae_serial\": null,\n    \"processador\": null,\n    \"macaddres\": \"12:34:12:54:45:12\",\n    \"versao_client\": null,\n    \"temperatura_cpu\": null,\n    \"observacao\": null,\n    \"is_servidor\": false,\n    \"teamviewer_id\": null,\n    \"is_ativo\": true,\n    \"is_tablet\": false,\n    \"gps_latitude\": null,\n    \"gps_longitude\": null,\n    \"mobile_sync_tipo\": null,\n    \"mobile_sync_tempo\": null,\n    \"mobile_bateria_porcentagem\": null,\n    \"mobile_bateria_temperatura\": null,\n    \"mobile_versao_android\": null,\n    \"mobile_versao_ios\": null,\n    \"mobile_versao_windows_phone\": null,\n    \"mobile_fabricante\": null,\n    \"mobile_modelo\": null,\n    \"mobile_processador\": null,\n    \"mobile_versao_firmware\": null,\n    \"mobile_hardware\": null,\n    \"mobile_serial\": null,\n    \"mobile_macaddress\": null,\n    \"mobile_ip\": null,\n    \"mobile_gateway\": null,\n    \"mobile_netmask\": null,\n    \"mobile_dhcp_server\": null,\n    \"mobile_dns_primario\": null,\n    \"mobile_dns_secundario\": null,\n    \"mobile_conexao_movel\": null,\n    \"mobile_ssid\": null,\n    \"mobile_bssid\": null,\n    \"mobile_blueetooth_nome\": null,\n    \"mobile_memoria_total\": null,\n    \"mobile_memoria_utilizada\": null,\n    \"mobile_memoria_disponivel\": null,\n    \"mobile_storage_interno_total\": null,\n    \"mobile_storage_interno_utilizado\": null,\n    \"mobile_storage_interno_disponivel\": null,\n    \"mobile_storage_externo_total\": null,\n    \"mobile_storage_externo_utilizado\": null,\n    \"mobile_storage_externo_disponivel\": null,\n    \"mobile_is_dual_chip\": false,\n    \"mobile_sim1_is_ativo\": false,\n    \"mobile_sim2_is_ativo\": false,\n    \"mobile_sim1_operadora\": null,\n    \"mobile_sim2_operadora\": null,\n    \"mobile_sim1_imei\": null,\n    \"mobile_sim2_imei\": null,\n    \"mobile_sim1_rede\": null,\n    \"mobile_sim2_rede\": null,\n    \"mobile_sim1_iso\": null,\n    \"mobile_sim2_iso\": null,\n    \"mobile_tecnologia_transmissao\": null,\n    \"mobile_roaming\": null,\n    \"mobile_numero_sim1\": null,\n    \"mobile_numero_sim2\": null,\n    \"mobile_sim1_correiodevoz\": null,\n    \"mobile_sim2_correiodevoz\": null,\n    \"mobile_sim1_is_roaming\": false,\n    \"mobile_sim2_is_roaming\": false,\n    \"mobile_wifi_status\": null,\n    \"mobile_blueetooth_status\": null,\n    \"mobile_view_novo_chamado\": null,\n    \"mobile_view_inventario\": null,\n    \"mobile_is_view_block_app\": null,\n    \"usuario_logado\": null,\n    \"apelido\": \"ASU-45000\",\n    \"is_agent\": false,\n    \"total_processadores\": null,\n    \"arquitetura_sistema_operacional\": null,\n    \"data_exclusao\": null,\n    \"possui_antivirus\": false,\n    \"numero_serial\": \"1234\",\n    \"proxy_endereco\": null,\n    \"proxy_porta\": null,\n    \"proxy_usuario\": null,\n    \"proxy_senha\": null,\n    \"sistema_operacional_versao_build\": null,\n    \"sistema_operacional_disco\": null,\n    \"is_notebook\": false,\n    \"total_alertas\": 0,\n    \"placa_mae_product\": \"\",\n    \"total_maximo_slots\": null,\n    \"placa_mae_modelo\": null,\n    \"data_compra\": \"2020-04-16T00:00:00.000Z\",\n    \"data_garantia\": \"2020-04-30T00:00:00.000Z\",\n    \"modelo_notebook\": null,\n    \"nobreak_id\": 708,\n    \"localizacao\": \"Escritorio\",\n    \"TipoNobreak_id\": 2,\n    \"is_nobreak\": true,\n    \"potencia\": \"4500w\",\n    \"voltagem_entrada\": \"220\",\n    \"voltagem_saida\": \"127\",\n    \"fabricante\": \"teste\",\n    \"numero_serie_bateria\": \"123\",\n    \"tempo_de_troca_bateria\": \"12\",\n    \"periferico_rede_id\": null,\n    \"is_wireless\": false,\n    \"wireless_ssid\": null,\n    \"wireless_senha\": null,\n    \"is_usb\": false,\n    \"patrimonio\": null,\n    \"marca\": \"ASU\",\n    \"modelo\": null,\n    \"cod_tercerizada\": null,\n    \"rede\": null,\n    \"qtd_portas\": null,\n    \"TipoPerifericoRedeVelocidade\": null,\n    \"TipoPerifericoRede\": null,\n    \"is_gerenciavel\": false,\n    \"armazenamento\": null,\n    \"dispositivo_locado_id\": null,\n    \"is_locado\": false,\n    \"firewall_ativo\": null,\n    \"sistema_operacional_atualizado\": null,\n    \"status_vulnerabilidade_id\": null,\n    \"tipo_dispositivo_id\": 5,\n    \"porta_sip\": null,\n    \"servidor_voip\": null,\n    \"numero_telefone\": null,\n    \"ramal\": null,\n    \"possui_display\": false,\n    \"portas_rtp\": null,\n    \"usuario\": null,\n    \"senha\": null,\n    \"update_ativo\": null\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n\"Dispositivo atualizado com sucesso\"",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "delete",
    "url": "/api/dispositivos/{id}",
    "title": "excluirDispositivo",
    "description": "<p>Deleta um dispositivo e suas dependências</p>",
    "name": "excluirDispositivo",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n\"Dispositivo excluido\"",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "post",
    "url": "/api/dispositivos/listagem",
    "title": "listagemDispositivos",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_paginate",
            "description": "<p>** Se não informado o padrão é true **</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>** Se não informado o padrão é false **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"id\"",
              "\"nome\""
            ],
            "optional": true,
            "field": "order_by",
            "description": "<p>** Se não informado o padrão é descricao **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 e o limite máximo é de 1000 registros por requisição **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n    \"filtro_body\": {\n        \"tipo_dispositivo_id\": 1,\n        \"hostname\": \"teste\",\n        \"apelido\": \"teste\",\n        \"ip_interno\": 10.0.0.1,\n        \"ip_externo\": 200.201.8.125,\n        \"macaddress\": \"te:st:et:es:te\",\n        \"usuario_logado\": \"teste\",\n        \"data_criacao\": \"19/05/2020\"\n    }\n}",
          "type": "json"
        }
      ]
    },
    "description": "<p>Lista dispositivos</p>",
    "name": "listagemDispositivos",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{\n    \"meta\": {\n        \"paginate\": {\n            \"current_page\": 1,\n            \"total\": 95,\n            \"to\": 1,\n            \"from\": 1,\n            \"last_page\": 95,\n            \"per_page\": \"1\"\n        }\n    },\n    \"lista\": [\n        {\n            \"id\": 276417,\n            \"hostname\": \"PHILIPS-TV\",\n            \"apelido\": null,\n            \"ip_interno\": \"192.168.0.108\",\n            \"macaddres\": \"5C:C9:D3:8F:93:15\",\n            \"marca\": null,\n            \"fabricante\": null,\n            \"is_ativo\": true,\n            \"data_criacao\": \"2020-05-27T17:44:25.000Z\",\n            \"ip_externo\": \"170.80.86.83\",\n            \"data_ultima_atualizacao\": \"2020-05-27T17:50:55.000Z\",\n            \"dominio\": \"\",\n            \"sistema_operacional\": \"Microsoft Windows 10 Pro\",\n            \"sistema_operacional_licenca\": \"W269N-WFGWX-YVC9B-4J6C9-T83GX\",\n            \"placa_mae\": \"Acer\",\n            \"placa_mae_serial\": \"NXGMFAL006748855889501\",\n            \"processador\": \"Intel(R) Core(TM) i3-6006U CPU @ 2.00GHz\",\n            \"versao_client\": \"78.64.57.66\",\n            \"observacao\": null,\n            \"usuario_logado\": \"Matheus Cassimiro\",\n            \"total_processadores\": 2,\n            \"numero_serial\": \"NXGMFAL006748855889501\",\n            \"placa_mae_modelo\": \"\",\n            \"data_compra\": null,\n            \"data_garantia\": null,\n            \"modelo_notebook\": \"Aspire ES1-572\",\n            \"nome_fantasia\": \"111 Sem Endereço\",\n            \"tipo_dispositivo_text\": \"Notebook\",\n            \"tipo_dispositivo_icone\": \"mdi mdi-laptop-windows\"\n        }\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "get",
    "url": "/api/dispositivos/lista/tipo-dispositivo",
    "title": "listarTipoDispositivo",
    "description": "<p>Lista os tipos de dispositivo</p>",
    "name": "listarTipoDispositivo",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n  {\n  \"lista\": [\n      {\n        \"id\": 34,\n        \"descricao\": \"SMART TV\"\n      },\n      {\n      \"id\": 35,\n      \"descricao\": \"setsetset\"\n      },\n      {\n      \"id\": 40,\n      \"descricao\": \"NET\"\n      }  \n      ]\n  }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "get",
    "url": "/api/dispositivos/status/{dispositivo_id}",
    "title": "obterStatus",
    "description": "<p>Obtem o status do dispositivo (Online/Offline)</p>",
    "name": "obterStatus",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"hostname\": \"PHILIPS-TV\",\n    \"status\": \"Offline\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "get",
    "url": "/api/dispositivos/softwares/{dispositivo_id}",
    "title": "softwaresDispositivos",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_paginate",
            "description": "<p>** Se não informado o padrão é true **</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>** Se não informado o padrão é false **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"id\"",
              "\"nome\""
            ],
            "optional": true,
            "field": "order_by",
            "description": "<p>** Se não informado o padrão é descricao **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      }
    },
    "description": "<p>Lista softwares instalados dispositivo</p>",
    "name": "softwaresDispositivos",
    "group": "Dispositivos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{\n    \"meta\": {\n        \"paginate\": {\n            \"current_page\": 1,\n            \"total\": 61,\n            \"to\": 1,\n            \"from\": 1,\n            \"last_page\": 61,\n            \"per_page\": \"1\"\n        }\n    },\n    \"lista\": [\n        {\n            \"key_licenca\": \"Não encontrada\",\n            \"chaveRegistro\": \"HKEY_LOCAL_MACHINE\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\7-Zip\",\n            \"software_geral_id\": 85893,\n            \"versao\": \"19.00\",\n            \"descricao\": \"7-Zip 19.00 (x64)\",\n            \"empresa\": \"Igor Pavlov\"\n        }\n    ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/dispositivoController.js",
    "groupTitle": "Dispositivos"
  },
  {
    "type": "post",
    "url": "/api/relatorio-atendimento/exporta",
    "title": "exportarRelatorioAtendimentoArquivos",
    "description": "<p>Exportação de relatorios de atendimentos para xls ou csv</p>",
    "name": "exportarRelatorioAtendimentoArquivos",
    "group": "Relatorio_Atendimentos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n \"filtro_body\": {\n   \"nome_tecnico\": \"teste\",\n   \"data_inicial\": \"2022-06-13\",\n   \"data_final\": \"2022-07-13\",\n   \"codigo\": \"\",\n   \"tipo_arquivo\": \"csv\"\n   \"token\": \"AASSYY\"\n }\n}\n\n\"--EXEMPLOS PARA PREENCHER OS CAMPOS--\"\n\"codigo\": {\"codigo do ticket\"}\n\"token\": {\"token do cliente\"}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/routes/relatorioAtendimento.routes.js",
    "groupTitle": "Relatorio_Atendimentos"
  },
  {
    "type": "post",
    "url": "/api/relatorio-atendimento/listagem",
    "title": "relatorioAtendimentoListagem",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>**  A opção true ordenará do maior para o menor e false ao contrário, o padrão é true (Decresente) **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100",
              "200"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 e o limite máximo é de 1000 registros por requisição **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n  \"filtro_body\":{\n    \"data_inicial\":\"2022-03-01\",\n    \"data_final\":\"2022-03-01\",\n    \"token\": \"O5NHAA\",\n    \"is_externo\": true,\n    \"is_comercial\": true,\n    \"motivo_pausa\": \"teste\"\n    \"codigo\": 5353,\n    \"nome_tecnico\": \"teste\",\n    \"nome_mesa\": \"mesa padrao\"\n  }\n}\n\n\"-- EXEMPLOS PARA PREENCHIMENTO DOS CAMPOS --\"\n\"codigo\": {\"codigo do ticket\"}\n\"token\": {\"token do cliente\"}\n\n\"-- EXEMPLOS PARA PREENCHIMENTO DOS CAMPOS --\"\n\"codigo\": {\"codigo do ticket\"}\n\"token\": {\"token do cliente\"}}",
          "type": "json"
        }
      ]
    },
    "description": "<p>Relatorio listagem de atendimentos - via integração</p>",
    "name": "relatorioAtendimentoListagem",
    "group": "Relatorio_Atendimentos",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"meta\":{\n      \"paginate\":{\n         \"current_page\":\"1\",\n         \"total\":1,\n         \"to\":10,\n         \"from\":1,\n         \"last_page\":1,\n         \"per_page\":\"10\"\n      }\n   },\n   \"lista\":[\n      {\n         \"id\":830606,\n         \"codigo\":7391,\n         \"assunto\":\"teste de consulta\",\n         \"nome_fantasia\":\"A. PRATES - COMBUSTIVEIS - EIRELI\",\n         \"nome\":\"Cassiano\",\n         \"sobrenome\":\"Oliveira\",\n         \"data_inicial\":\"2022-03-21 19:48:15\",\n         \"data_final\":\"2022-03-22 13:21:14\",\n         \"tipo_hora\":\"Atendimento\",\n         \"is_externo\":false,\n         \"tecnico\":\"Cassiano Oliveira\",\n         \"total_horas_atendimento\":\"07:10\",\n         \"descricao\":null,\n         \"is_comercial\":true,\n         \"contato\":\"Contato 1\",\n         \"mesa_trabalho\":{\n            \"id\":8740,\n            \"text\":\"Mesa Padrão\"\n         },\n         \"tipo_chamado\":{\n            \"id\":null,\n            \"text\":\"Não possui\"\n         },\n         \"categoria_primaria\":{\n            \"id\":null,\n            \"text\":\"Não possui\"\n         },\n         \"categoria_secundaria\":{\n            \"id\":null,\n            \"text\":\"Não possui\"\n         },\n         \"status\":{\n            \"id\":4,\n            \"text\":\"Finalizado\"\n         },\n         \"data_criacao\":\"2022-03-21 11:37:08\",\n         \"data_solucao\":\"2022-03-22 13:21:14\",\n         \"setor\":{\n            \"id\":null,\n            \"text\":\"Não possui\"\n         },\n         \"motivo_pausa\":{\n            \"text\":\"Não possui\"\n         },\n         \"data_saida\":null,\n         \"data_chegada\":null\n      }\n   ],\n   \"resumo\":{\n      \"total_chamados\":1,\n      \"total_horas\":\"00:00\",\n      \"total_horas_expediente\":\"07:10\",\n      \"total_horas_fora_expediente\":\"00:00\",\n      \"total_horas_atendimento\":\"07:10\",\n      \"total_horas_internas\":\"07:10\",\n      \"total_horas_externas\":\"00:00\"\n   }\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/routes/relatorioAtendimento.routes.js",
    "groupTitle": "Relatorio_Atendimentos"
  },
  {
    "type": "post",
    "url": "/api/relatorio-personalizado/exportar",
    "title": "exportarRelatorio",
    "description": "<p>Exporta o relatorio personalizado por tipo</p>",
    "name": "exportarRelatorio",
    "group": "Relatorio_Personalizado",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token de autenticação.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"nome\": \"Relatorio Teste\",\n     \"tipo\": \"csv\"\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/relatorioPersonalizadoController.js",
    "groupTitle": "Relatorio_Personalizado"
  },
  {
    "type": "put",
    "url": "/api/usuario-cliente",
    "title": "Atualizar",
    "description": "<p>Altera um usuario cliente existente</p>",
    "name": "Atualizar",
    "group": "UsuarioCliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n   \"usuarioCliente\" : {\n       \"--CAMPOS OBRIGATÓRIOS--\":\"{}\",\n       \"id\":1\n\n       \"CAMPOS OPCIONAIS--\":\"{}\",\n       \"nome\": \"Teste 1\",\n       \"sobrenome\": \"Teste 1\",\n       \"password\": \"teste\",\n       \"setor\": \"Financeiro\"\n       \"perfil\": \"CEO || Gestor || Colaborador || DPO\",\n       \"status\": \"Ativo || Inativo\"\n    }   \t\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/usuarioClienteController.js",
    "groupTitle": "UsuarioCliente"
  },
  {
    "type": "post",
    "url": "/api/usuario-cliente",
    "title": "Criar",
    "description": "<p>Grava um novo Usuario Cliente</p>",
    "name": "Criar",
    "group": "UsuarioCliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n   \"usuarioCliente\" : {\n       \"--CAMPOS OBRIGATÓRIOS--\":\"{}\",\n       \"cliente_token\": \"3MENJ7\" OU \"cliente_nome\": \"Milvus\",\n       \"perfil\": \"CEO || Gestor || Colaborador || DPO\",\n       \"nome\": \"Teste 1\",\n       \"username\": \"teste@teste.com\",\n       \"password\"   : \"teste\",\n\n       \"CAMPOS OPCIONAIS--\":\"{}\",\n       \"sobrenome\"  : \"Teste 1\",\n       \"observacao\"   : \"teste2\",\n       \"setor\": \"Financeiro\"\n   }   \t\n}",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/usuarioClienteController.js",
    "groupTitle": "UsuarioCliente"
  },
  {
    "type": "delete",
    "url": "/api/usuario-cliente/{usuario_id}",
    "title": "Excluir",
    "description": "<p>Exclui um usuario cliente existente por id</p>",
    "name": "Excluir",
    "group": "UsuarioCliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 204 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/usuarioClienteController.js",
    "groupTitle": "UsuarioCliente"
  },
  {
    "type": "post",
    "url": "/api/usuario-cliente/importar/{delimitador}",
    "title": "importarUsuariosCliente",
    "description": "<p>Utiliza um arquivo csv para importar os usuarios clientes para o Milvus</p>",
    "name": "importarUsuariosCliente",
    "group": "UsuarioCliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "parameter": {
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n     \"DOWNLOAD CSV EXEMPLO--\":\"{}\",\nhttps://milvus-files.s3.sa-east-1.amazonaws.com/producao/empresa8214/documentosdiversos/20210527195936_ImportacaoCliente.csv\n     \n     \"cliente_nome\": \"MILVUS\" OU \"cliente_token\": \"3MENJ7\"\n     \"nome\": \"teste\"\n     \"sobrenome\": \"teste\",\n     \"email\": \"teste@teste.com\",\n     \"senha\": \"@Mudar123\",\n     \"perfil\": \"CEO\",\n     \"setor\": \"teste\",\n     \"situacao\": \"Ativo\"\n}",
          "type": "csv"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/usuarioClienteController.js",
    "groupTitle": "UsuarioCliente"
  },
  {
    "type": "post",
    "url": "/api/usuario-cliente/listar",
    "title": "listarUsuarios",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Boolean",
            "allowedValues": [
              "true",
              "false"
            ],
            "optional": true,
            "field": "is_descending",
            "description": "<p>** Se não informado o padrão é false **</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"nome\"",
              "\"email\"",
              "\"perfil\"",
              "\"cliente_nome\"",
              "\"cliente_token\"",
              "\"status\""
            ],
            "optional": true,
            "field": "order_by",
            "description": "<p>** Se não informado o padrão é nome **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "50",
              "100",
              "1000"
            ],
            "optional": true,
            "field": "total_registros",
            "description": "<p>** Se não informado o padrão é 50 e o limite máximo é de 1000 registros por requisição **</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "allowedValues": [
              "1",
              "2"
            ],
            "optional": true,
            "field": "pagina",
            "description": "<p>** Se não informado o padrão é 1 **</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{\n\t    \"filtro_body\": {\n\t    \t\"nome\": \"\",\n\t    \t\"email\": \"\",\n\t    \t\"perfil\": \"\",\n\t    \t\"cliente_nome\": \"\",\n\t    \t\"cliente_token\": \"\",\n\t    \t\"status\": \"\"\n\t    }\n}",
          "type": "json"
        }
      ]
    },
    "description": "<p>Lista todos usuarios com base no filtro</p>",
    "name": "listarUsuarios",
    "group": "UsuarioCliente",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Obrigatorio o uso do token.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n    \"meta\": {\n      \"paginate\": {\n        \"current_page\": 1,\n        \"total\": 13,\n        \"to\": 50,\n        \"from\": 1,\n        \"last_page\": 1,\n        \"per_page\": 50\n      }\n    },\n    \"lista\": [\n      {\n        \"id\": 100,\n        \"nome\": \"Nome\",\n        \"sobrenome\": \"sobrenome\",\n        \"status\": \"Inativo\",\n        \"cliente_nome\": \"Milvus TI\",\n        \"cliente_token\": \"3MENJ7\",\n        \"perfil\": \"CEO\",\n        \"email\": \"email@teste.com\"\n      }\n  ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "2-services/api-integracao/controllers/usuarioClienteController.js",
    "groupTitle": "UsuarioCliente"
  }
] });
