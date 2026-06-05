import { supabase } from './supabase';
import { toast } from 'sonner';

const REQUIRED_SPECIALTIES = [
  'Clínica Geral',
  'Cardiologia',
  'Dermatologia',
  'Pediatria',
  'Ginecologia',
  'Ortopedia',
  'Endocrinologia',
  'Gastroenterologia',
  'Neurologia',
  'Psiquiatria'
];

export const initSpecialties = async () => {
  try {
    // Check connection first
    const { data: existing, error: fetchError } = await supabase
      .from('specialties')
      .select('name');

    if (fetchError) {
      console.error('Supabase connection error:', fetchError);
      let userMsg = 'Não foi possível conectar ao Supabase.';
      if (fetchError.message?.includes('relation') && fetchError.message?.includes('does not exist')) {
        userMsg = 'A tabela "specialties" não existe no seu novo banco de dados! Certifique-se de executar o arquivo SQL (supabase_schema.sql) no Painel do Supabase para criar as tabelas.';
      } else if (fetchError.code === 'PGRST116' || fetchError.code === 'PGRST301') {
        userMsg = 'Código de erro no Supabase: ' + fetchError.message;
      }
      return { success: false, message: userMsg, error: fetchError };
    }

    const existingNames = existing?.map(s => s.name) || [];
    const toInsert = REQUIRED_SPECIALTIES.filter(name => !existingNames.includes(name));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('specialties')
        .insert(toInsert.map(name => ({ name })));

      if (insertError) {
        console.error('Insert safety error:', insertError);
        let insertMsg = `Não foi possível cadastrar as especialidades padrão: ${insertError.message}`;
        if (insertError.message?.includes('row-level security') || insertError.message?.includes('policy')) {
          insertMsg = 'A tabela "specialties" existe, mas as políticas de RLS estão ativas e impedindo a inserção. Por favor, execute as linhas de "ALTER TABLE ... DISABLE ROW LEVEL SECURITY;" do arquivo supabase_schema.sql ou adicione uma política de inserção livre!';
        }
        return { success: false, message: insertMsg, error: insertError };
      }
      console.log(`${toInsert.length} novas especialidades cadastradas.`);
      return { success: true, message: `${toInsert.length} novas especialidades cadastradas!`, updated: true };
    }

    return { success: true, message: 'Conexão OK e especialidades já estão atualizadas.', updated: false };
  } catch (error: any) {
    console.error('Error initializing specialties:', error);
    return { success: false, message: `Erro na inicialização: ${error.message}`, error };
  }
};
