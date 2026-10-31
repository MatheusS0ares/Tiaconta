
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "agenda_campos": {
                  Row: {
                    "ativo": boolean,"chave": string,"escola_id": string,"faixas": (Database["public"]['Enums']["faixa_etaria"])[] | null,"id": string,"multiplo": boolean,"opcoes": NonNullable<Json>,"ordem": number,"rotulo": string,"tipo": Database["public"]['Enums']["tipo_campo"],"visivel_responsavel": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"chave": string,"escola_id": string,"faixas"?: (Database["public"]['Enums']["faixa_etaria"])[] | null,"id"?: string,"multiplo"?: boolean,"opcoes"?: NonNullable<Json>,"ordem"?: number,"rotulo": string,"tipo": Database["public"]['Enums']["tipo_campo"],"visivel_responsavel"?: boolean
                  }
                  Update: {
                    "ativo"?: boolean,"chave"?: string,"escola_id"?: string,"faixas"?: (Database["public"]['Enums']["faixa_etaria"])[] | null,"id"?: string,"multiplo"?: boolean,"opcoes"?: NonNullable<Json>,"ordem"?: number,"rotulo"?: string,"tipo"?: Database["public"]['Enums']["tipo_campo"],"visivel_responsavel"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_campos_escola_id_fkey"
      columns: ["escola_id"]
isOneToOne: false
      referencedRelation: "escolas"
      referencedColumns: ["id"]
    }
                  ]
                },"agenda_dias": {
                  Row: {
                    "criado_em": string,"crianca_id": string,"data": string,"escola_id": string,"faltou": boolean,"finalizado_em": string | null,"finalizado_por": string | null,"id": string,"status": Database["public"]['Enums']["status_dia"]
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"crianca_id": string,"data": string,"escola_id": string,"faltou"?: boolean,"finalizado_em"?: string | null,"finalizado_por"?: string | null,"id"?: string,"status"?: Database["public"]['Enums']["status_dia"]
                  }
                  Update: {
                    "criado_em"?: string,"crianca_id"?: string,"data"?: string,"escola_id"?: string,"faltou"?: boolean,"finalizado_em"?: string | null,"finalizado_por"?: string | null,"id"?: string,"status"?: Database["public"]['Enums']["status_dia"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_dias_crianca_id_escola_id_fkey"
      columns: ["crianca_id","escola_id"]
isOneToOne: false
      referencedRelation: "criancas"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"agenda_leituras": {
                  Row: {
                    "agenda_dia_id": string,"escola_id": string,"lido_em": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agenda_dia_id": string,"escola_id": string,"lido_em"?: string,"user_id"?: string
                  }
                  Update: {
                    "agenda_dia_id"?: string,"escola_id"?: string,"lido_em"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_leituras_agenda_dia_id_escola_id_fkey"
      columns: ["agenda_dia_id","escola_id"]
isOneToOne: false
      referencedRelation: "agenda_dias"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"agenda_registros": {
                  Row: {
                    "agenda_dia_id": string,"atualizado_em": string | null,"atualizado_por": string | null,"campo_id": string,"escola_id": string,"id": string,"registrado_em": string,"registrado_por": string | null,"valor": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "agenda_dia_id": string,"atualizado_em"?: string | null,"atualizado_por"?: string | null,"campo_id": string,"escola_id": string,"id"?: string,"registrado_em"?: string,"registrado_por"?: string | null,"valor": NonNullable<Json>
                  }
                  Update: {
                    "agenda_dia_id"?: string,"atualizado_em"?: string | null,"atualizado_por"?: string | null,"campo_id"?: string,"escola_id"?: string,"id"?: string,"registrado_em"?: string,"registrado_por"?: string | null,"valor"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "agenda_registros_agenda_dia_id_escola_id_fkey"
      columns: ["agenda_dia_id","escola_id"]
isOneToOne: false
      referencedRelation: "agenda_dias"
      referencedColumns: ["id","escola_id"]
    },{
      foreignKeyName: "agenda_registros_campo_id_escola_id_fkey"
      columns: ["campo_id","escola_id"]
isOneToOne: false
      referencedRelation: "agenda_campos"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"criancas": {
                  Row: {
                    "ativa": boolean,"autoriza_imagem": boolean,"data_nascimento": string | null,"escola_id": string,"foto_path": string | null,"id": string,"nome": string,"observacoes_saude": string | null,"restricoes_alimentares": string | null,"turma_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativa"?: boolean,"autoriza_imagem"?: boolean,"data_nascimento"?: string | null,"escola_id": string,"foto_path"?: string | null,"id"?: string,"nome": string,"observacoes_saude"?: string | null,"restricoes_alimentares"?: string | null,"turma_id"?: string | null
                  }
                  Update: {
                    "ativa"?: boolean,"autoriza_imagem"?: boolean,"data_nascimento"?: string | null,"escola_id"?: string,"foto_path"?: string | null,"id"?: string,"nome"?: string,"observacoes_saude"?: string | null,"restricoes_alimentares"?: string | null,"turma_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "criancas_escola_id_fkey"
      columns: ["escola_id"]
isOneToOne: false
      referencedRelation: "escolas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "criancas_turma_id_escola_id_fkey"
      columns: ["turma_id","escola_id"]
isOneToOne: false
      referencedRelation: "turmas"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"escolas": {
                  Row: {
                    "agenda_visivel_antes_finalizar": boolean,"cor_primaria": string | null,"criado_em": string,"id": string,"logo_url": string | null,"modulos": NonNullable<Json>,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agenda_visivel_antes_finalizar"?: boolean,"cor_primaria"?: string | null,"criado_em"?: string,"id"?: string,"logo_url"?: string | null,"modulos"?: NonNullable<Json>,"nome": string,"slug": string
                  }
                  Update: {
                    "agenda_visivel_antes_finalizar"?: boolean,"cor_primaria"?: string | null,"criado_em"?: string,"id"?: string,"logo_url"?: string | null,"modulos"?: NonNullable<Json>,"nome"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"membros": {
                  Row: {
                    "ativo": boolean,"criado_em": string,"escola_id": string,"id": string,"papel": Database["public"]['Enums']["papel_membro"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"criado_em"?: string,"escola_id": string,"id"?: string,"papel": Database["public"]['Enums']["papel_membro"],"user_id": string
                  }
                  Update: {
                    "ativo"?: boolean,"criado_em"?: string,"escola_id"?: string,"id"?: string,"papel"?: Database["public"]['Enums']["papel_membro"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membros_escola_id_fkey"
      columns: ["escola_id"]
isOneToOne: false
      referencedRelation: "escolas"
      referencedColumns: ["id"]
    }
                  ]
                },"perfis": {
                  Row: {
                    "criado_em": string,"nome": string,"telefone": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"nome": string,"telefone"?: string | null,"user_id": string
                  }
                  Update: {
                    "criado_em"?: string,"nome"?: string,"telefone"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"responsaveis_criancas": {
                  Row: {
                    "crianca_id": string,"escola_id": string,"parentesco": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "crianca_id": string,"escola_id": string,"parentesco"?: string | null,"user_id": string
                  }
                  Update: {
                    "crianca_id"?: string,"escola_id"?: string,"parentesco"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "responsaveis_criancas_crianca_id_escola_id_fkey"
      columns: ["crianca_id","escola_id"]
isOneToOne: false
      referencedRelation: "criancas"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"turma_dias": {
                  Row: {
                    "atualizado_em": string,"autor": string | null,"data": string,"escola_id": string,"id": string,"mural": string | null,"turma_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"autor"?: string | null,"data": string,"escola_id": string,"id"?: string,"mural"?: string | null,"turma_id": string
                  }
                  Update: {
                    "atualizado_em"?: string,"autor"?: string | null,"data"?: string,"escola_id"?: string,"id"?: string,"mural"?: string | null,"turma_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "turma_dias_turma_id_escola_id_fkey"
      columns: ["turma_id","escola_id"]
isOneToOne: false
      referencedRelation: "turmas"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"turma_professoras": {
                  Row: {
                    "escola_id": string,"turma_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "escola_id": string,"turma_id": string,"user_id": string
                  }
                  Update: {
                    "escola_id"?: string,"turma_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "turma_professoras_turma_id_escola_id_fkey"
      columns: ["turma_id","escola_id"]
isOneToOne: false
      referencedRelation: "turmas"
      referencedColumns: ["id","escola_id"]
    }
                  ]
                },"turmas": {
                  Row: {
                    "ano_letivo": number,"ativa": boolean,"escola_id": string,"faixa": Database["public"]['Enums']["faixa_etaria"],"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ano_letivo"?: number,"ativa"?: boolean,"escola_id": string,"faixa": Database["public"]['Enums']["faixa_etaria"],"id"?: string,"nome": string
                  }
                  Update: {
                    "ano_letivo"?: number,"ativa"?: boolean,"escola_id"?: string,"faixa"?: Database["public"]['Enums']["faixa_etaria"],"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "turmas_escola_id_fkey"
      columns: ["escola_id"]
isOneToOne: false
      referencedRelation: "escolas"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "criar_campos_padrao":
{ Args: { "p_escola": string }; Returns: undefined
                           },
"fn_dia_editavel":
{ Args: { "p_dia": string }; Returns: boolean
                           },
"fn_dia_visivel_responsavel":
{ Args: { "p_dia": string }; Returns: boolean
                           },
"fn_e_equipe":
{ Args: { "p_escola": string }; Returns: boolean
                           },
"fn_e_gestor":
{ Args: { "p_escola": string }; Returns: boolean
                           },
"fn_e_membro":
{ Args: { "p_escola": string }; Returns: boolean
                           },
"fn_e_responsavel_de":
{ Args: { "p_crianca": string }; Returns: boolean
                           },
"fn_e_responsavel_na_turma":
{ Args: { "p_turma": string }; Returns: boolean
                           },
"fn_tem_papel":
{ Args: { "p_escola": string,"p_papeis": (Database["public"]['Enums']["papel_membro"])[] }; Returns: boolean
                           },
"registrar_em_lote":
{ Args: { "p_campo": string,"p_data": string,"p_exceto"?: (string)[],"p_turma": string,"p_valor": Json }; Returns: number
                           }
          }
          Enums: {
            "faixa_etaria": "bercario"|"maternal"|"pre_escola"|"fundamental","papel_membro": "gestor"|"professora"|"responsavel","status_dia": "rascunho"|"finalizado","tipo_campo": "opcao"|"sim_nao"|"evento"|"intervalo"|"quantidade"|"texto"|"checklist"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "faixa_etaria": ["bercario", "maternal", "pre_escola", "fundamental"],"papel_membro": ["gestor", "professora", "responsavel"],"status_dia": ["rascunho", "finalizado"],"tipo_campo": ["opcao", "sim_nao", "evento", "intervalo", "quantidade", "texto", "checklist"]
          }
        }
} as const
