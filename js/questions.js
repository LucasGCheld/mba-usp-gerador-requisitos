const questions = [
    {
        groupName: "Contexto do Usuário",
        categories: [
            {
                category: "Público-Alvo",
                questions: [
                    "Quem são os principais usuários desta funcionalidade? (Ex: Administrador, cliente, visitante)",
                    "Qual o principal objetivo que o usuário quer alcançar com esta funcionalidade?",
                    "Existe algum conhecimento técnico prévio esperado do usuário?"
                ]
            }
        ]
    },
    {
        groupName: "Dados e Regras de Negócio",
        categories: [
            {
                category: "Manipulação de Dados",
                questions: [
                    "Quais informações (dados) precisam ser exibidas na tela?",
                    "O usuário precisará inserir, editar ou apagar quais dados?",
                    "Existem regras ou validações específicas para os dados de entrada? (Ex: CPF válido, e-mail único)"
                ]
            }
        ]
    },
    {
        groupName: "Segurança e Permissões",
        categories: [
            {
                category: "Controle de Acesso",
                questions: [
                    "A funcionalidade deve ser acessível para todos ou apenas para usuários logados?",
                    "Existem diferentes níveis de permissão? (Ex: um 'gerente' pode ver mais coisas que um 'usuário comum')",
                    "Quais são os principais riscos de segurança a serem considerados?"
                ]
            }
        ]
    }
];
