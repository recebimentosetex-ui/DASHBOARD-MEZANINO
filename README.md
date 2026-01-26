# Portal de Estoque

## Configuração do Banco de Dados (Supabase)

Para o sistema funcionar, rode este comando no SQL Editor do Supabase:

```sql
create table inventory (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null,
  material text not null,
  qtd numeric default 0,
  status text,
  responsavel text,
  data_saida text,
  sm text,
  lote text,
  sala text,
  prateleira text,
  fileira text,
  maquina_fornecida text
);

alter table inventory enable row level security;

create policy "Acesso Publico"
on inventory for all
using (true)
with check (true);
```

## Variáveis de Ambiente (Vercel)

Configure as seguintes variáveis no seu projeto Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
