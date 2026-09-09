import { normalizarNome } from "./normalizar";
import type { DisciplinaFormatada } from "./portal";

/**
 * Agrupamento das disciplinas por area do conhecimento.
 *
 * O casamento e' por trecho do nome normalizado, e nao por lista fechada,
 * porque a grade muda entre fundamental, EJA e curso tecnico -- "LINGUA
 * PORTUGUESA" e "PORTUGUES" precisam cair no mesmo lugar, e uma disciplina
 * nova nao pode sumir da tela: o que nao casa vai para Diversificadas.
 *
 * A ORDEM IMPORTA: "EDUCACAO FISICA" contem "FISICA", entao Linguagens e'
 * testada antes de Natureza, senao Educacao Fisica viraria ciencia da
 * natureza.
 */
export type IdDaArea = "linguagens" | "humanas" | "natureza" | "diversificadas";

export interface Area {
  id: IdDaArea;
  nome: string;
  termos: string[];
}

export const AREAS: Area[] = [
  {
    id: "linguagens",
    nome: "Linguagens",
    termos: [
      "EDUCACAO FISICA",
      "ED FISICA",
      "EDUC FISICA",
      "PORTUGUES",
      "INGLES",
      "ARTE",
      "REDACAO",
      "LITERATURA",
    ],
  },
  {
    id: "humanas",
    nome: "Humanas",
    termos: ["GEOGRAFIA", "HISTORIA"],
  },
  {
    id: "natureza",
    nome: "Natureza e Matemática",
    termos: ["MATEMATICA", "CIENCIA", "QUIMICA", "FISICA", "BIOLOGIA"],
  },
];

export function areaDaDisciplina(disciplina: string): IdDaArea {
  const nome = normalizarNome(disciplina);
  for (const area of AREAS) {
    if (area.termos.some((termo) => nome.includes(termo))) return area.id;
  }
  return "diversificadas";
}

export interface GrupoDeDisciplinas {
  id: IdDaArea;
  nome: string;
  disciplinas: DisciplinaFormatada[];
}

/** Grupos na ordem das areas, sem os que ficaram vazios. */
export function agruparPorArea(
  disciplinas: DisciplinaFormatada[]
): GrupoDeDisciplinas[] {
  const porArea = new Map<IdDaArea, DisciplinaFormatada[]>();

  for (const disciplina of disciplinas) {
    const id = areaDaDisciplina(disciplina.disciplina);
    const atual = porArea.get(id);
    if (atual) atual.push(disciplina);
    else porArea.set(id, [disciplina]);
  }

  const ordem: { id: IdDaArea; nome: string }[] = [
    ...AREAS.map((a) => ({ id: a.id, nome: a.nome })),
    { id: "diversificadas", nome: "Diversificadas" },
  ];

  return ordem
    .map(({ id, nome }) => ({
      id,
      nome,
      disciplinas: (porArea.get(id) ?? []).sort((a, b) =>
        a.disciplina.localeCompare(b.disciplina, "pt-BR")
      ),
    }))
    .filter((grupo) => grupo.disciplinas.length > 0);
}
