// --- ELEMENTOS DO DOM ---
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const analyzeImplicitCheckbox = document.getElementById("analyze-implicit");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const useQuestionsCheckbox = document.getElementById("use-questions");
const questionsPanel = document.getElementById("questions-panel");
const questionsContainer = document.getElementById("questions-container");

// Novos elementos para o layout de resultados comparativos
const userPromptDisplay = document.getElementById('user-prompt-display');
const llmResultsContainer = document.getElementById('llm-results-container');


// --- FUNÇÃO PARA GERAR O FORMULÁRIO (sem alterações) ---
function generateQuestionForm() {
    let formHTML = "";
    questions.forEach((category) => {
        formHTML += `<div class="question-category">${category.category}</div>`;
        category.questions.forEach((question, index) => {
            formHTML += `
                <div class="form-group question-item">
                    <label for="question-${category.category}-${index}">${question}</label>
                    <textarea class="form-control" id="question-${category.category}-${index}" rows="2"></textarea>
                </div>
            `;
        });
    });
    questionsContainer.innerHTML = formHTML;
}

// --- EVENT LISTENERS (LÓGICA PRINCIPAL) ---

// 1. Controla a visibilidade da coluna de perguntas (sem alterações)
useQuestionsCheckbox.addEventListener("change", () => {
    if (useQuestionsCheckbox.checked) {
        questionsPanel.style.display = "flex";
    } else {
        questionsPanel.style.display = "none";
    }
});

// 2. Envia os dados para as IAs (LÓGICA ATUALIZADA E SIMULTÂNEA)
sendBtn.addEventListener("click", () => {
    const userText = userInput.value;
    if (!userText) {
        alert("Por favor, preencha a descrição da funcionalidade.");
        return;
    }
    
    // Mostra a pergunta do usuário no topo
    userPromptDisplay.textContent = userText;
    userPromptDisplay.style.display = 'block';
    llmResultsContainer.innerHTML = ''; // Limpa resultados antigos

    const analyzeImplicit = analyzeImplicitCheckbox.checked;
    const useQuestions = useQuestionsCheckbox.checked;

    let extraContext = "";
    if (useQuestions) {
        // ... (seu código para montar o extraContext, sem alterações) ...
    }

    // Corpo da requisição que será enviado para todas as IAs
    const requestBody = {
        message: userText,
        analyze_implicit: analyzeImplicit,
        extra_context: extraContext
    };

    // Objeto que define os endpoints e os elementos da tela
    const apiEndpoints = {
        "Groq (Llama 4)": "https://lucasgcheld.pythonanywhere.com/chat/groq",
        "Google (Gemini-1.5-flash)": "https://lucasgcheld.pythonanywhere.com/chat/gemini",
        "OpenAI (GPT-3.5)": "https://lucasgcheld.pythonanywhere.com/chat/openai"
    };

    // Itera sobre cada IA para criar o bloco de espera e disparar a requisição
    for (const [modelName, endpoint] of Object.entries(apiEndpoints)) {
        
        // --- 1. Cria os blocos com a mensagem de "Processando..." ---
        const block = document.createElement('div');
        block.className = 'response-block';
        block.id = `block-${modelName.replace(/[\s()]/g, '')}`; // Cria um ID único, ex: block-GroqLlama3

        const title = document.createElement('h6');
        title.textContent = modelName;

        const content = document.createElement('div');
        content.className = 'llm-message';
        content.innerHTML = `Processando a requisição... Você pode acompanhar o status no console do back-end.`;

        block.appendChild(title);
        block.appendChild(content);
        llmResultsContainer.appendChild(block);

        // --- 2. Dispara a requisição fetch para esta IA específica ---
        fetch(endpoint, {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: { "Content-Type": "application/json" },
        })
        .then(response => response.json())
        .then(data => {
            // Atualiza o conteúdo do bloco desta IA com a resposta real
            content.innerHTML = marked.parse(data.response || "Erro ou nenhuma resposta recebida.");
        })
        .catch(error => {
            content.innerHTML = `<span style="color: red;">Ocorreu um erro ao chamar ${modelName}.</span>`;
            console.error(`Erro na requisição para ${modelName}:`, error);
        });
    }
});

// 3. Limpa a tela de resultados (LÓGICA ATUALIZADA)
clearHistoryBtn.addEventListener("click", () => {
    userPromptDisplay.style.display = 'none'; // Esconde a pergunta do usuário
    llmResultsContainer.innerHTML = ''; // Limpa os blocos de resultado
});

// --- INICIALIZAÇÃO ---
generateQuestionForm();
