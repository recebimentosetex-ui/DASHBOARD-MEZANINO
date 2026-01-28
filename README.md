# Portal de Estoque

## Configuração do Banco de Dados (Supabase)

Para o sistema funcionar corretamente e corresponder a todos os campos da interface (incluindo código do material, máquina fornecida e data de saída), execute o seguinte comando no **SQL Editor** do Supabase:

### Instalação Limpa (Se não tiver a tabela)

```sql
-- Criação da tabela de inventário
create table inventory (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Campos Obrigatórios e Estruturais
  category text not null,       -- 'INK', 'FIBER' ou 'PACKAGING'
  material text not null,       -- Descrição do Material
  qtd numeric default 0,        -- Quantidade
  status text default 'EM ESTOQUE', -- Status (EM ESTOQUE, PAGO)
  
  -- Campos de Identificação
  codigo text,                  -- Código do Material
  lote text,                    -- Lote
  
  -- Campos de Logística/Armazenamento
  sala text,                    -- Rua / Sala
  prateleira text,              -- Prateleira
  fileira text,                 -- Posição / Fileira
  
  -- Campos de Rastreabilidade de Saída
  responsavel text,             -- Responsável pelo material
  maquina_fornecida text,       -- Máquina Fornecida
  data_saida text,              -- Data de Saída
  sm text                       -- SM (Solicitação de Material)
);

-- Habilitar Row Level Security (RLS)
alter table inventory enable row level security;

-- Política de Acesso Público (Permite Leitura e Escrita para todos)
create policy "Acesso Publico Total"
on inventory for all
using (true)
with check (true);
```

### Solução de Problemas / Migração (Erro "Could not find column")

Se você receber o erro **"Could not find the 'codigo' column..."**, significa que sua tabela já existe mas está desatualizada. Execute este comando no SQL Editor para adicionar os campos faltantes:

```sql
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS maquina_fornecida text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS data_saida text;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS sm text;

-- Atualizar cache da API do Supabase
NOTIFY pgrst, 'reload config';
```

## Variáveis de Ambiente (Vercel)

Configure as seguintes variáveis no seu projeto Vercel:

- `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave pública (anon) do seu projeto.