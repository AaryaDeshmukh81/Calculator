
const resultDisplay = document.getElementById("result");
const expressionDisplay = document.getElementById("expression");
const keypad = document.querySelector(".keypad");

let expression = "";
let justCalculated = false;

function updateDisplay() {
    expressionDisplay.textContent = expression
        ? expression.replace(/\*/g, " × ").replace(/\//g, " ÷ ")
        : "Ready to calculate";

    if (!expression) {
        resultDisplay.textContent = "0";
        return;
    }

    try {
        const value = evaluateExpression(expression);
        resultDisplay.textContent =
            value === null ? "0" : formatNumber(value);
    } catch {
        resultDisplay.textContent = "—";
    }
}

function formatNumber(number) {
    if (!Number.isFinite(number)) return "Error";

    const rounded = Number(number.toPrecision(12));
    return String(rounded);
}

// Safely evaluate arithmetic without eval() or Function().
function evaluateExpression(input) {
    const tokens = input.match(
        /(?:\d+\.?\d*|\.\d+)|[+\-*/%()]/g
    );

    if (!tokens || tokens.join("") !== input) {
        throw new Error("Invalid expression");
    }

    let position = 0;

    function parseExpression() {
        let value = parseTerm();

        while (tokens[position] === "+" ||
               tokens[position] === "-") {
            const operator = tokens[position++];
            const right = parseTerm();

            value = operator === "+"
                ? value + right
                : value - right;
        }

        return value;
    }

    function parseTerm() {
        let value = parseUnary();

        while (["*", "/", "%"].includes(tokens[position])) {
            const operator = tokens[position++];
            const right = parseUnary();

            if ((operator === "/" || operator === "%") &&
                right === 0) {
                throw new Error("Cannot divide by zero");
            }

            if (operator === "*") value *= right;
            if (operator === "/") value /= right;
            if (operator === "%") value %= right;
        }

        return value;
    }

    function parseUnary() {
        if (tokens[position] === "+") {
            position++;
            return parseUnary();
        }

        if (tokens[position] === "-") {
            position++;
            return -parseUnary();
        }

        if (tokens[position] === "(") {
            position++;
            const value = parseExpression();

            if (tokens[position++] !== ")") {
                throw new Error("Missing closing parenthesis");
            }

            return value;
        }

        const token = tokens[position++];

        if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
            throw new Error("Invalid number");
        }

        const number = Number(token);

        if (!Number.isFinite(number)) {
            throw new Error("Invalid number");
        }

        return number;
    }

    const value = parseExpression();

    if (position !== tokens.length || !Number.isFinite(value)) {
        throw new Error("Invalid expression");
    }

    return value;
}

function appendValue(value) {
    if (justCalculated) {
        if (/[0-9.]/.test(value)) {
            expression = "";
        }
        justCalculated = false;
    }

    const operators = ["+", "-", "*", "/", "%"];
    const last = expression.slice(-1);

    if (/[0-9]/.test(value)) {
        expression += value;
    } else if (value === ".") {
        const currentNumber = expression.split(/[+\-*/%()]/).pop();

        if (!currentNumber.includes(".")) {
            expression += currentNumber ? "." : "0.";
        }
    } else if (operators.includes(value)) {
        if (!expression && value !== "-") return;

        if (operators.includes(last)) {
            if (value === "-" && last !== "-") {
                expression += value;
            } else {
                expression = expression.slice(0, -1) + value;
            }
        } else {
            expression += value;
        }
    }

    updateDisplay();
}

function calculate() {
    if (!expression) return;

    try {
        const answer = evaluateExpression(expression);
        expressionDisplay.textContent =
            expression.replace(/\*/g, " × ").replace(/\//g, " ÷ ");
        resultDisplay.textContent = formatNumber(answer);
        expression = formatNumber(answer);
        justCalculated = true;
    } catch {
        resultDisplay.textContent = "Error";
        expressionDisplay.textContent = "Invalid calculation";
        expression = "";
        justCalculated = false;
    }
}

function clearCalculator() {
    expression = "";
    justCalculated = false;
    updateDisplay();
}

function deleteLast() {
    if (justCalculated) {
        clearCalculator();
        return;
    }

    expression = expression.slice(0, -1);
    updateDisplay();
}

function toggleSign() {
    if (!expression) {
        expression = "-";
    } else if (/^-?\d*\.?\d+$/.test(expression)) {
        expression = expression.startsWith("-")
            ? expression.slice(1)
            : "-" + expression;
    } else {
        expression = "-(" + expression + ")";
    }

    justCalculated = false;
    updateDisplay();
}

keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.value !== undefined) {
        appendValue(button.dataset.value);
        return;
    }

    switch (button.dataset.action) {
        case "clear":
            clearCalculator();
            break;
        case "delete":
            deleteLast();
            break;
        case "sign":
            toggleSign();
            break;
        case "calculate":
            calculate();
            break;
    }
});

// Keyboard support: numbers, operators, Enter, Backspace and Escape.
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        appendValue(key);
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
        appendValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape" || key === "Delete") {
        clearCalculator();
    }
});

updateDisplay();
