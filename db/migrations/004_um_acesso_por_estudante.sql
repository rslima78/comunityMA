-- 004_um_acesso_por_estudante.sql
--
-- Simplificacao de seguranca: um login da acesso a exatamente um estudante.
--
-- O agrupamento por filiacao dependia dos nomes de mae e pai digitados na
-- secretaria. Enquanto ele era so' rotulo, um homonimo nao custava nada; a
-- partir do momento em que passou a decidir quem enxerga quem, um erro de
-- digitacao viraria vazamento de dado de menor. Responsavel com mais de um
-- filho passa a acessar um de cada vez, com o CPF de cada um.
--
-- As colunas nome_mae e nome_pai continuam em estudantes: elas vem do
-- cadastro da escola e sao dado do aluno, so' nao servem mais para agrupar.

DROP TABLE IF EXISTS estudante_familia;
DROP TABLE IF EXISTS familias;

-- Orfas desde a Etapa 3, quando o login passou para estudantes. Guardavam
-- cpf e senha_hash sem nunca terem sido usadas -- uma segunda tabela de
-- credenciais parada no banco e' um convite a ligar a autenticacao no lugar
-- errado mais tarde.
DROP TABLE IF EXISTS responsavel_estudante;
DROP TABLE IF EXISTS responsaveis;
