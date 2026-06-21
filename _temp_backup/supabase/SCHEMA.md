# 🗺️ SCHEMA.md - DriverOS

> **Fonte de Verdade:** Este documento é o GPS do sistema. Mantenha-o atualizado sempre que houver mudanças estruturais no banco de dados.

---

## 📊 Status do Banco de Dados

**Estado Atual:** ✅ **DriverOS - Completo e em Producao**  
**Ultima Atualizacao:** 2026-06-20  
**Versao da Migration:** `20260620000004_create_audit_confirmations`

---

## 🧩 Diagrama de Relacionamentos

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK "Gerenciado pelo Supabase Auth"
        string email
        timestamp created_at
    }

    ORGS {
        uuid id PK
        string name
        string plan "free | pro | enterprise"
        timestamp created_at
    }

    PROFILES {
        uuid id PK "FK auth.users"
        uuid org_id FK "NULL para B2C"
        string full_name
        string phone
        timestamp created_at
        timestamp updated_at
    }

    VEHICLES {
        uuid id PK
        uuid org_id FK
        uuid user_id FK
        string brand
        string model
        int year
        string plate
        string fuel_type
        numeric current_odometer_km
        timestamp created_at
        timestamp updated_at
    }

    VEHICLE_COMPONENTS {
        uuid id PK
        uuid vehicle_id FK
        string name
        string category
        numeric estimated_lifespan_km
        numeric current_wear_percent
        timestamp created_at
    }

    SHIFTS {
        uuid id PK
        uuid user_id FK
        uuid vehicle_id FK
        numeric initial_odometer_km
        numeric final_odometer_km
        string status "active | completed | cancelled"
        timestamp started_at
        timestamp ended_at
    }

    TRIPS {
        uuid id PK
        uuid shift_id FK
        uuid vehicle_id FK
        string category "passenger_dropoff | passenger_pickup | repositioning | refueling | personal | unpaid_detour"
        string status "in_progress | completed | cancelled"
        numeric distance_km
        numeric fare_amount
        jsonb start_location
        jsonb end_location
        timestamp started_at
        timestamp ended_at
    }

    TRIP_LOCATIONS {
        uuid id PK
        uuid trip_id FK
        numeric latitude
        numeric longitude
        numeric speed
        numeric accuracy
        timestamp recorded_at
    }

    REFUELINGS {
        uuid id PK
        uuid vehicle_id FK
        uuid user_id FK
        numeric liters
        numeric total_cost
        numeric odometer_km
        string station_name
        timestamp created_at
    }

    MAINTENANCES {
        uuid id PK
        uuid vehicle_id FK
        string type "preventive | corrective | oil_change | tire_change | other"
        string description
        numeric cost
        numeric odometer_km
        numeric next_due_km
        timestamp created_at
    }

    VEHICLE_EXPENSES {
        uuid id PK
        uuid vehicle_id FK
        string category "ipva | insurance | licensing | financing | rent | other"
        string description
        numeric amount
        string frequency "daily | weekly | monthly | quarterly | yearly"
        timestamp due_date
        timestamp created_at
    }

    RIDE_APPS {
        uuid id PK
        string name
        string label
        string color
    }

    USER_RIDE_APPS {
        uuid id PK
        uuid user_id FK
        uuid ride_app_id FK
        numeric earnings_goal
    }

    DRIVER_SNAPSHOTS {
        uuid id PK
        uuid user_id FK
        date snapshot_date
        string period_type "daily | weekly | monthly"
        numeric total_km
        numeric paid_km
        numeric unpaid_km
        numeric total_earnings
        numeric total_expenses
        numeric net_profit
        numeric efficiency_percent
        int trip_count
    }

    CONFIRMATIONS {
        uuid id PK
        string record_type "shift_end | trip_cancel | expense_delete"
        uuid record_id
        uuid user_id FK
        timestamp created_at
    }

    AUTH_USERS ||--o{ PROFILES : "possui"
    AUTH_USERS ||--o{ VEHICLES : "possui"
    AUTH_USERS ||--o{ SHIFTS : "inicia"
    AUTH_USERS ||--o{ REFUELINGS : "registra"
    AUTH_USERS ||--o{ USER_RIDE_APPS : "usa"
    AUTH_USERS ||--o{ DRIVER_SNAPSHOTS : "gera"
    AUTH_USERS ||--o{ CONFIRMATIONS : "confirma"
    ORGS ||--o{ PROFILES : "contem"
    ORGS ||--o{ VEHICLES : "contem"
    VEHICLES ||--o{ VEHICLE_COMPONENTS : "tem"
    VEHICLES ||--o{ SHIFTS : "utilizado em"
    VEHICLES ||--o{ TRIPS : "utilizado em"
    VEHICLES ||--o{ REFUELINGS : "recebe"
    VEHICLES ||--o{ MAINTENANCES : "recebe"
    VEHICLES ||--o{ VEHICLE_EXPENSES : "tem"
    SHIFTS ||--o{ TRIPS : "contem"
    TRIPS ||--o{ TRIP_LOCATIONS : "registra"
    RIDE_APPS ||--o{ USER_RIDE_APPS : "vinculado"
```

---

## 🛠️ Extensões Instaladas

| Extensão | Versão | Schema | Descrição |
|----------|--------|--------|-----------|
| **uuid-ossp** | Latest | `extensions` | Geração de UUIDs (v4) para chaves primárias |
| **pg_net** | Latest | `extensions` | Requisições HTTP assíncronas (webhooks, integrações) |
| **vector** (pgvector) | Latest | `extensions` | Suporte a embeddings e busca semântica (IA/ML) |

---

## 🔧 Funções Globais

### `update_timestamp()`

**Descrição:** Atualiza automaticamente o campo `atualizado_em` em qualquer tabela.

**Uso:**
```sql
-- Adicione este trigger em todas as tabelas que rastreiam modificações
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON sua_tabela
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

**Exemplo Completo:**
```sql
CREATE TABLE exemplo (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    nome TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Adiciona o trigger de atualização automática
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON exemplo
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

---

## 📋 Tabelas do Sistema

### `auth.users` (Gerenciado pelo Supabase)

Tabela de autenticação gerenciada automaticamente pelo Supabase Auth.

**Campos Principais:**
- `id` (UUID) - Chave primária
- `email` (TEXT) - Email do usuário
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização

**⚠️ IMPORTANTE:** Nunca modifique esta tabela diretamente. Use as APIs do Supabase Auth.

---

## 🔐 Row Level Security (RLS)

**Status:** ⚠️ Nenhuma política configurada (banco limpo)

**Protocolo Obrigatório:**
Quando você criar sua primeira tabela:

1. **SEMPRE habilite RLS:**
   ```sql
   ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;
   ```

2. **Crie políticas apropriadas:**
   ```sql
   -- Exemplo: Usuários só veem seus próprios dados
   CREATE POLICY "Users can view their own data"
   ON sua_tabela
   FOR SELECT
   USING (auth.uid() = user_id);

   -- Exemplo: Usuários só inserem seus próprios dados
   CREATE POLICY "Users can insert their own data"
   ON sua_tabela
   FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```

---

## 🚀 Próximos Passos

### Como Criar Sua Primeira Tabela

1. **Nunca use SQL manual.** Sempre gere uma migration:
   ```powershell
   npx supabase migration new create_sua_tabela
   ```

2. **Edite o arquivo gerado em `./supabase/migrations/`:**
   ```sql
   CREATE TABLE sua_tabela (
       id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       nome TEXT NOT NULL,
       criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
       atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
   );

   -- Habilita RLS
   ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;

   -- Adiciona políticas
   CREATE POLICY "Users can manage their own data"
   ON sua_tabela
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);

   -- Adiciona trigger de atualização
   CREATE TRIGGER set_timestamp
   BEFORE UPDATE ON sua_tabela
   FOR EACH ROW
   EXECUTE FUNCTION update_timestamp();
   ```

3. **Aplique a migration:**
   ```powershell
   npx supabase db reset
   ```

4. **Sincronize os tipos TypeScript:**
   ```powershell
   .\sync-db.ps1
   ```

5. **Atualize este SCHEMA.md:**
   - Adicione a tabela ao diagrama Mermaid
   - Documente relacionamentos
   - Liste políticas RLS

---

## 📚 Referências

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Extensions](https://www.postgresql.org/docs/current/contrib.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Mermaid ER Diagrams](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)

---

**🎯 Lembre-se:** Este é um **Template Universal**. Não adicione lógica de negócio aqui. Mantenha apenas infraestrutura reutilizável.
