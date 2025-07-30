document.addEventListener("DOMContentLoaded", () => {
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


    // --- FUNÇÃO PARA GERAR O FORMULÁRIO ---
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

    // 1. Controla a visibilidade da coluna de perguntas
    useQuestionsCheckbox.addEventListener("change", () => {
        if (useQuestionsCheckbox.checked) {
            questionsPanel.style.display = "flex";
        } else {
            questionsPanel.style.display = "none";
        }
    });

    // 2. Envia os dados para o back-end com a nova lógica
    sendBtn.addEventListener("click", () => {
        const userText = userInput.value;
        if (!userText) {
            alert("Por favor, preencha a descrição da funcionalidade.");
            return;
        }
        
        // Mostra a pergunta do usuário no topo e limpa a área
        userPromptDisplay.textContent = userText;
        userPromptDisplay.style.display = 'block';
        llmResultsContainer.innerHTML = '<div class="text-muted p-3">Disparando requisições para as 3 IAs... O processo pode levar alguns segundos.</div>';

        const analyzeImplicit = analyzeImplicitCheckbox.checked;
        const useQuestions = useQuestionsCheckbox.checked;

        let extraContext = "";
        if (useQuestions) {
            questions.forEach((category) => {
                category.questions.forEach((question, index) => {
                    const answerInput = document.getElementById(`question-${category.category}-${index}`);
                    if (answerInput && answerInput.value) {
                        extraContext += `- ${question}\n  Resposta: ${answerInput.value}\n\n`;
                    }
                });
            });
        }

        // Dispara a ÚNICA requisição para a rota principal do back-end
        fetch("https://lucasgcheld.pythonanywhere.com/chat", {
            method: "POST",
            body: JSON.stringify({
                message: userText,
                analyze_implicit: analyzeImplicit,
                extra_context: extraContext
            }),
            headers: { "Content-Type": "application/json" },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro de servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            llmResultsContainer.innerHTML = ''; // Limpa a mensagem de "carregando"

            // Nomes "bonitos" para exibir nos títulos
            const modelNames = {
                "groq_response": "Groq (Llama 3)",
                "gemini_response": "Google (Gemini)",
                "openai_response": "OpenAI (GPT-3.5)"
            };

            // Itera sobre o "relatório" recebido do back-end
            for (const [modelKey, result] of Object.entries(data)) {
                // Cria o 'bloco' principal
                const block = document.createElement('div');
                block.className = 'response-block';
                if (result.status === 'error') {
                    block.style.borderColor = '#dc3545'; // Borda vermelha se deu erro
                }

                // Cria o título (h6)
                const title = document.createElement('h6');
                title.textContent = modelNames[modelKey] || modelKey;

                // Cria o conteúdo com a resposta da IA
                const content = document.createElement('div');
                content.className = 'llm-message';
                content.innerHTML = marked.parse(result.response || "Resposta vazia.");

                // Cria o rodapé com o tempo e o status
                const statusFooter = document.createElement('div');
                statusFooter.className = 'response-status';
                statusFooter.textContent = `Tempo: ${result.time_taken}s`;
                if (result.status === 'error') {
                    statusFooter.classList.add('error');
                    statusFooter.textContent = `Falhou em ${result.time_taken}s`;
                }
                
                // Monta o bloco completo e o adiciona na tela
                block.appendChild(title);
                block.appendChild(content);
                block.appendChild(statusFooter);
                llmResultsContainer.appendChild(block);
            }
        })
        .catch(error => {
            llmResultsContainer.innerHTML = `<div class="llm-message" style="background-color: #f8d7da; color: #721c24;">Ocorreu um erro geral. Verifique o console.</div>`;
            console.error("Erro na requisição:", error);
        });
    });

    // 3. Limpa a tela de resultados
    clearHistoryBtn.addEventListener("click", () => {
        userPromptDisplay.style.display = 'none';
        llmResultsContainer.innerHTML = '';
    });

    // --- INICIALIZAÇÃO ---
    generateQuestionForm();
});
