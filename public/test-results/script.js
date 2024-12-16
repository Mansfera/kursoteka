const testUuid = params.get("uuid");

async function loadTestResults() {
    try {
        const response = await fetch(`/api/test-details/${testUuid}?auth_key=${auth_key}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Update test info
        document.getElementById("test_name").textContent = `Тест ${data.test} (${data.test_type})`;
        document.getElementById("test_date").textContent = new Date(data.date).toLocaleDateString() + 
            " • " + new Date(data.date).toLocaleTimeString();
        document.getElementById("test_time").textContent = formatTime(data.time);
        document.getElementById("test_uuid").textContent = testUuid;
        
        // Update scores
        document.getElementById("total_score").textContent = `${Math.ceil(data.score)}%`;
        document.getElementById("abcd_score").textContent = `${Math.ceil(data.abcd_questions_accuracy)}%`;
        document.getElementById("vidp_score").textContent = `${Math.ceil(data.vidpovidnist_questions_accuracy)}%`;
        document.getElementById("hron_score").textContent = `${Math.ceil(data.hronology_questions_accuracy)}%`;
        document.getElementById("mul_ans_score").textContent = `${Math.ceil(data.mul_ans_questions_accuracy)}%`;

        // Show incorrect answers
        const questionsList = document.getElementById("questions_list");
        data.questions.forEach((question, index) => {
            if (!question.isCorrect) {
                const questionElement = createQuestionDisplay(question, index + 1);
                questionsList.appendChild(questionElement);
            }
        });

        // Hide loading screen
        document.getElementById("initial_black_screen").classList.add("display-none");
    } catch (error) {
        console.error("Error loading test results:", error);
        document.getElementById("initial_black_screen-text").textContent = "Помилка завантаження результатів";
    }
}

function createQuestionDisplay(question, number) {
    const container = document.createElement("div");
    container.className = "question-container";

    // Question text section
    const textSection = document.createElement("div");
    textSection.className = "main_wrapper-question_text_rows";

    if (question.top_question) {
        const topLine = document.createElement("div");
        topLine.className = "question_text_rows-top_line white_text bold";
        topLine.textContent = question.top_question;
        textSection.appendChild(topLine);
    }

    if (question.middle_rows) {
        const middleLines = document.createElement("div");
        middleLines.className = "question_text_rows-middle_lines";
        question.middle_rows.forEach(row => {
            const p = document.createElement("p");
            p.className = "middle_lines-element";
            p.textContent = row;
            middleLines.appendChild(p);
        });
        textSection.appendChild(middleLines);
    }

    if (question.bottom_question) {
        const bottomLine = document.createElement("div");
        bottomLine.className = "question_text_rows-bottom_line white_text subtitle_text bold";
        bottomLine.textContent = question.bottom_question;
        textSection.appendChild(bottomLine);
    }

    container.appendChild(textSection);

    // Answers section
    const answersSection = document.createElement("div");
    answersSection.className = "main_wrapper-question_answers_list";

    if (question.q_type === "abcd") {
        const wrapper = document.createElement("div");
        wrapper.className = "question_answers_list-element-wrapper left";

        question.answers.forEach((answer, i) => {
            const row = document.createElement("div");
            row.className = "question_answers_list-element-row";

            const letter = document.createElement("div");
            letter.className = "question_answers_list-element-text bold subtitle_text";
            letter.textContent = ['А', 'Б', 'В', 'Г'][i];

            const text = document.createElement("div");
            text.className = "question_answers_list-element-text";
            text.textContent = answer.text;
            if (answer.text === question.selected) {
                text.classList.add("incorrect");
            } else if (answer.correct) {
                text.classList.add("correct");
            }

            row.appendChild(letter);
            row.appendChild(text);
            wrapper.appendChild(row);
        });

        answersSection.appendChild(wrapper);
    } else if (question.q_type === "vidp" || question.q_type === "hron") {
        const wrapper = document.createElement("div");
        wrapper.className = "question_answers_list-element-wrapper";

        // Add fields from f1 to f5 if they exist
        for (let i = 1; i <= 5; i++) {
            if (question[`f${i}`]) {
                const row = document.createElement("div");
                row.className = "question_answers_list-element-row";
                
                const num = document.createElement("div");
                num.className = "question_answers_list-element-text bold subtitle_text";
                num.textContent = i;

                const text = document.createElement("div");
                text.className = "question_answers_list-element-text";
                text.textContent = question[`f${i}`];
                
                row.appendChild(num);
                row.appendChild(text);
                wrapper.appendChild(row);
            }
        }

        // Add selected and correct sequences
        const resultDiv = document.createElement("div");
        resultDiv.className = "sequence-results";
        resultDiv.innerHTML = `
            <div class="sequence-row">
                <span class="sequence-label">Ваша відповідь:</span>
                <span class="sequence-value incorrect">${question.selected}</span>
            </div>
            <div class="sequence-row">
                <span class="sequence-label">Правильна відповідь:</span>
                <span class="sequence-value correct">${question.correct}</span>
            </div>
        `;
        wrapper.appendChild(resultDiv);

        answersSection.appendChild(wrapper);
    }

    container.appendChild(answersSection);
    return container;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

loadTestResults();
