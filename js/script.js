document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const analyzeImplicitCheckbox = document.getElementById("analyze-implicit");
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    const useQuestionsCheckbox = document.getElementById("use-questions");
    const questionsPanel = document.getElementById("questions-panel");
    const questionsContainer = document.getElementById("questions-container");
    const userPromptDisplay = document.getElementById('user-prompt-display');
    const llmResultsContainer = document.getElementById('llm-results-container');

    // --- FUNÇÕES ---
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

    // --- EVENT LISTENERS ---
    useQuestionsCheckbox.addEventListener("change", () => {
        questionsPanel.style.display = useQuestionsCheckbox.checked ? "flex" : "none";
    });

    sendBtn.addEventListener("click", () => {
        const userText = userInput.value;
        if (!userText) {
            alert("Por favor, preencha a descrição da funcionalidade.");
            return;
        }
        
        userPromptDisplay.textContent = userText;
        userPromptDisplay.style.display = 'block';
        llmResultsContainer.innerHTML = '';

        let extraContext = "";
        if (useQuestionsCheckbox.checked) {
            questions.forEach((category) => {
                category.questions.forEach((question, index) => {
                    const answerInput = document.getElementById(`question-${category.category}-${index}`);
                    if (answerInput && answerInput.value) {
                        extraContext += `- ${question}\n  Resposta: ${answerInput.value}\n\n`;
                    }
                });
            });
        }

        const requestBody = {
            message: userText,
            analyze_implicit: analyzeImplicitCheckbox.checked,
            extra_context: extraContext
        };
        
        const apiEndpoints = {
            "Groq (Llama 4)": "https://lucasgcheld.pythonanywhere.com/chat/groq",
            "Google (Gemini 1.5 Flash)": "https://lucasgcheld.pythonanywhere.com/chat/gemini",
            "Mistral (Mistral Small)": "https://lucasgcheld.pythonanywhere.com/chat/mistral"
        };

        for (const [modelName, endpoint] of Object.entries(apiEndpoints)) {
            
            const block = document.createElement('div');
            block.className = 'response-block';

            const title = document.createElement('h6');
            title.textContent = modelName;

            const content = document.createElement('div');
            content.className = 'llm-message';
            content.innerHTML = `Processando...`;

            block.appendChild(title);
            block.appendChild(content);
            llmResultsContainer.appendChild(block);

            fetch(endpoint, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" },
            })
            .then(response => response.json())
            .then(data => {
                content.innerHTML = marked.parse(data.response || "Erro ou nenhuma resposta recebida.");
            })
            .catch(error => {
                content.innerHTML = `<span style="color: red;">Ocorreu um erro ao chamar ${modelName}.</span>`;
                console.error(`Erro na requisição para ${modelName}:`, error);
            });
        }
    });

    clearHistoryBtn.addEventListener("click", () => {
        userPromptDisplay.style.display = 'none';
        llmResultsContainer.innerHTML = '';
    });

    // --- INICIALIZAÇÃO ---
    generateQuestionForm();
});
