document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const userInput = document.getElementById("user-input");
    const personaInput = document.getElementById("persona-input");
    const sendBtn = document.getElementById("send-btn");
    const analyzeImplicitCheckbox = document.getElementById("analyze-implicit");
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    const resetOptionsBtn = document.getElementById("reset-options-btn");
    const useQuestionsCheckbox = document.getElementById("use-questions");
    const questionsPanel = document.getElementById("questions-panel");
    const questionsContainer = document.getElementById("questions-container");
    const userPromptDisplay = document.getElementById('user-prompt-display');
    const llmResultsContainer = document.getElementById('llm-results-container');
    const iaSelectionContainer = document.getElementById('ia-selection-container');
    const questionGroupsContainer = document.getElementById('question-groups-container');

    const apiEndpoints = {
        "Groq (Llama 4)": "https://lucasgcheld.pythonanywhere.com/chat/groq",
        "Google (Gemini 1.5 Flash)": "https://lucasgcheld.pythonanywhere.com/chat/gemini",
        "Mistral (Mistral Small)": "https://lucasgcheld.pythonanywhere.com/chat/mistral"
    };

    // --- LÓGICA DE SALVAR E CARREGAR (localStorage) ---

    function saveState(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function loadState(key, defaultValue) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    }

    // --- FUNÇÕES DE INICIALIZAÇÃO E GERAÇÃO DE UI ---

    function initializeIASelection() {
        const selectedIAs = loadState('selectedIAs', Object.keys(apiEndpoints)); // Todas selecionadas por padrão
        iaSelectionContainer.innerHTML = '';
        Object.keys(apiEndpoints).forEach(name => {
            const isChecked = selectedIAs.includes(name);
            const div = document.createElement('div');
            div.className = 'form-check form-check-inline';
            div.innerHTML = `
                <input class="form-check-input ia-checkbox" type="checkbox" id="ia-${name}" value="${name}" ${isChecked ? 'checked' : ''}>
                <label class="form-check-label" for="ia-${name}">${name}</label>
            `;
            iaSelectionContainer.appendChild(div);
        });
    }

    function generateQuestionForm() {
        const selectedGroups = loadState('selectedGroups', []); // Nenhum por padrão
        questionGroupsContainer.innerHTML = '';
        questionsContainer.innerHTML = '';

        // Cria os checkboxes dos grupos
        questions.forEach(group => {
            const isChecked = selectedGroups.includes(group.groupName);
            const div = document.createElement('div');
            div.className = 'form-check form-check-inline';
            div.innerHTML = `
                <input class="form-check-input group-checkbox" type="checkbox" id="group-${group.groupName}" value="${group.groupName}" ${isChecked ? 'checked' : ''}>
                <label class="form-check-label" for="group-${group.groupName}">${group.groupName}</label>
            `;
            questionGroupsContainer.appendChild(div);
        });

        // Cria as perguntas dos grupos
        questions.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.id = `questions-for-${group.groupName}`;
            groupDiv.className = 'question-group';
            // Mostra o grupo se ele estiver selecionado
            if (selectedGroups.includes(group.groupName)) {
                groupDiv.style.display = 'block';
            }

            let formHTML = "";
            group.categories.forEach((category) => {
                formHTML += `<div class="question-category">${category.category}</div>`;
                category.questions.forEach((question, index) => {
                    const questionId = `question-${group.groupName}-${category.category}-${index}`;
                    const savedAnswer = loadState(questionId, '');
                    formHTML += `
                        <div class="form-group question-item">
                            <label for="${questionId}">${question}</label>
                            <textarea class="form-control question-textarea" id="${questionId}" rows="2" placeholder="Ex: Admins, clientes, visitantes...">${savedAnswer}</textarea>
                        </div>
                    `;
                });
            });
            groupDiv.innerHTML = formHTML;
            questionsContainer.appendChild(groupDiv);
        });
    }
    
    function loadAllStates() {
        personaInput.value = loadState('persona', '');
        analyzeImplicitCheckbox.checked = loadState('analyzeImplicit', true);
        useQuestionsCheckbox.checked = loadState('useQuestions', false);
        questionsPanel.style.display = useQuestionsCheckbox.checked ? "flex" : "none";
        
        initializeIASelection();
        generateQuestionForm();
    }

    // --- EVENT LISTENERS ---

    // Salvar estado de qualquer checkbox ou campo de texto ao ser alterado
    document.body.addEventListener('change', (e) => {
        if (e.target.matches('.ia-checkbox')) {
            const selected = Array.from(document.querySelectorAll('.ia-checkbox:checked')).map(cb => cb.value);
            saveState('selectedIAs', selected);
        }
        if (e.target.matches('.group-checkbox')) {
            const selected = Array.from(document.querySelectorAll('.group-checkbox:checked')).map(cb => cb.value);
            saveState('selectedGroups', selected);
            generateQuestionForm(); // Regenera o form para mostrar/esconder grupos
        }
        if (e.target.matches('#analyze-implicit')) saveState('analyzeImplicit', e.target.checked);
        if (e.target.matches('#use-questions')) {
            saveState('useQuestions', e.target.checked);
            questionsPanel.style.display = e.target.checked ? "flex" : "none";
        }
    });

    document.body.addEventListener('input', (e) => {
        if (e.target.matches('#persona-input')) saveState('persona', e.target.value);
        if (e.target.matches('.question-textarea')) saveState(e.target.id, e.target.value);
    });
    
    // Botão Principal de Gerar
    sendBtn.addEventListener("click", () => {
        const userText = userInput.value;
        if (!userText) {
            alert("Por favor, preencha a descrição da funcionalidade.");
            return;
        }

        const selectedIAs = Array.from(document.querySelectorAll('.ia-checkbox:checked')).map(cb => cb.value);
        if (selectedIAs.length === 0) {
            alert("Por favor, selecione pelo menos uma IA.");
            return;
        }
        
        userPromptDisplay.textContent = userText;
        userPromptDisplay.style.display = 'block';
        llmResultsContainer.innerHTML = '';

        let extraContext = "";
        if (useQuestionsCheckbox.checked) {
            document.querySelectorAll('.question-textarea').forEach(textarea => {
                if(textarea.value) {
                    const label = document.querySelector(`label[for='${textarea.id}']`).textContent;
                    extraContext += `- ${label}\n  Resposta: ${textarea.value}\n\n`;
                }
            });
        }
        
        let fullUserText = personaInput.value ? `INSTRUÇÃO PADRÃO (PERSONA):\n${personaInput.value}\n\n---\n\nDESCRIÇÃO DA FUNCIONALIDADE:\n${userText}` : userText;

        const requestBody = {
            message: fullUserText,
            analyze_implicit: analyzeImplicitCheckbox.checked,
            extra_context: extraContext
        };

        selectedIAs.forEach(modelName => {
            const endpoint = apiEndpoints[modelName];
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
        });
    });

    // Botões de Limpeza
    clearHistoryBtn.addEventListener("click", () => {
        userInput.value = '';
        userPromptDisplay.style.display = 'none';
        llmResultsContainer.innerHTML = '';
    });

    resetOptionsBtn.addEventListener("click", () => {
        // Popup de confirmação
        const isConfirmed = confirm("Você tem certeza que deseja resetar todas as opções? Isso limpará a 'Instrução Padrão' e todas as respostas das perguntas detalhadas.");
        if (isConfirmed) {
            localStorage.removeItem('selectedIAs');
            localStorage.removeItem('persona');
            localStorage.removeItem('analyzeImplicit');
            localStorage.removeItem('useQuestions');
            localStorage.removeItem('selectedGroups');
            
            // Limpa todas as respostas de perguntas salvas
            questions.forEach(group => {
                group.categories.forEach(cat => {
                    cat.questions.forEach((q, index) => {
                        localStorage.removeItem(`question-${group.groupName}-${cat.category}-${index}`);
                    });
                });
            });
            
            location.reload(); // Recarrega a página para aplicar o estado padrão
        }
    });

    // --- INICIALIZAÇÃO ---
    loadAllStates();
});
