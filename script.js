const calculator = (function () {
	const buttonsPart = document.querySelector(".calculator__buttons");
	const buttons = ["1", "2", "3", "+", "-", "4", "5", "6", "*", "/", "7",
		"8", "9", "(", ")", ".", "0", "00", "^", "sqrt", "cos", "sin", "C", "="];

	function fillCalculator() {
		buttons.forEach(value => {
			const input = document.createElement("input");
			input.type = "button";
			input.value = value;
			input.classList.add("calculator__item");

			const valueClass = value === "="
				? "equal-sign"
				: (!isNaN(value) || value === ".")
					? "number"
					: "operator";

			input.classList.add(valueClass);
			buttonsPart.append(input);
		});
	}

	function cacheDom() {
		return {
			historyBtn: document.querySelector(".history__btn"),
			historyBlock: document.querySelector(".history__block"),
			viewer: document.querySelector(".calculator__viewer"),
			numbers: document.querySelectorAll(".number"),
			operators: document.querySelectorAll(".operator"),
			equalSign: document.querySelector(".equal-sign"),
			modalElements: document.querySelector(".modal__elements"),
			modalCloseBtn: document.querySelector(".modal__close"),
			modalText: document.querySelector(".modal__text")
		}
	}

	//additional functions for events
	function history() {
		const operations = [];

		return function (expression, answer, historyBlock) {
			const expObject = { expression: expression, answer: answer };
			operations.push(expObject);
			historyBlock.textContent = "";
			operations.forEach((obj, index) => {
				const expElem = document.createElement("p");
				const answerElem = document.createElement("p");
				expElem.textContent = `${index + 1}) ${obj.expression}`;
				answerElem.textContent = obj.answer;
				historyBlock.append(expElem);
				historyBlock.append(answerElem);
			});
		}
	}

	function parseMathString(expression) {
		const expCopy = expression.replace(/\d+/g, "#").replace(/\./g, "");
		let numbersArray = expression.split(/[^\d\.]+/).filter(value => value !== "");
		let operatorsArray = expCopy.split("#").filter(value => value !== "");
		operatorsArray.forEach((operator, index, arr) => {
			if (operator.length > 1) {
				let splitOperators = operator.split("");
				arr.splice(index, 1, splitOperators);
			}
		});
		operatorsArray = operatorsArray.flat(1);

		const result = [];
		function getParticularArrayLenght() {
			return numbersArray.length > operatorsArray.length
				? numbersArray.length
				: operatorsArray.length;
		}

		let arraylength = getParticularArrayLenght();
		for (let i = 0; i < arraylength; i++) {
			const operator = operatorsArray[i];
			const number = numbersArray[i];
			if (operator === "(") {
				result.push(operator);
				numbersArray.splice(i, 0, "");
				arraylength = getParticularArrayLenght();
			} else if (operator === ")" && operatorsArray[i + 1] === ")") {
				result.push(number, operator);
				numbersArray.splice(i + 1, 0, "");
				arraylength = getParticularArrayLenght();
			} else if (operator === ")") {
				result.push(number);
				const nextOperator = operatorsArray[i + 1];
				nextOperator
					? result.push(operator, nextOperator)
					: result.push(operator);
				operatorsArray.splice(i + 1, 1, "");
				numbersArray.splice(i + 1, 0, "");
				arraylength = getParticularArrayLenght();
			} else {
				if (typeof number !== undefined && operator) result.push(number, operator);
				else if (typeof number !== undefined) result.push(number);
			}
		}
		return result.filter(value => value !== "");;
	}

	function replaceExtraFunctions(string) {
		let regex = /([a-z]{3,4})(\d+\.?\d*)|\d+(\^)\d+/;
		let matched = string.match(regex);
		while (matched) {
			matched = matched.filter(value => value !== undefined);
			let result;
			if (matched[1] === "^") {
				const numbers = matched[0].split("^");
				result = Math.pow(numbers[0], numbers[1]);
			} else result = Math[matched[1]](matched[2]);
			string = string.replace(matched[0], result);
			matched = string.match(regex);
		}
		return string;
	}

	function calculateString(string) {
		if (string.trim().length === 0) return;
		string = replaceExtraFunctions(string);
		const parsedString = parseMathString(string);
		// console.log(parsedString);
		if (parsedString.length === 1) return string;

		const operators = [
			{
				sign: "+",
				priority: 1,
				operation(a, b) {
					return a + b;
				}
			},
			{
				sign: "-",
				priority: 1,
				operation(a, b) {
					return a - b;
				}
			},
			{
				sign: "*",
				priority: 2,
				operation(a, b) {
					return a * b;
				}
			},
			{
				sign: "/",
				priority: 2,
				operation(a, b) {
					return a / b;
				}
			},
			{
				sign: "(",
				priority: 0
			}
		];
		const numberStack = [];
		const operatorStack = [];

		function getPreviousOperator() {
			return operators.find(operator => operator.sign === operatorStack[operatorStack.length - 1]);
		}

		parsedString.push("");
		parsedString.forEach(token => {
			let previousOperator = getPreviousOperator();
			let currentOperator = operators.find(operator => operator.sign === token);
			function calculate() {
				const secondNumber = +numberStack.pop();
				const firstNumber = +numberStack.pop();
				const result = previousOperator.operation(firstNumber, secondNumber);
				numberStack.push(result);
				operatorStack.pop();
				previousOperator = getPreviousOperator();
			}
			function checkPriority() {
				if (!currentOperator || !previousOperator) return false;	
				return currentOperator.priority === previousOperator.priority
					|| currentOperator.priority < previousOperator.priority;
			}

			if (token === "" && operatorStack.length) {
				while (operatorStack.length > 0) {
					calculate();
				}
			} else if (!isNaN(token)) numberStack.push(token);
			else if (operatorStack.length === 0
				|| token === "("
				|| (currentOperator && previousOperator && currentOperator.priority > previousOperator.priority)) {
					operatorStack.push(token);
			} else if (token === ")") {
				while (previousOperator.sign !== "(") {
					calculate();
				}
				operatorStack.pop();
			} else if (checkPriority()) {
				while (checkPriority()) {
					calculate();
				}
				operatorStack.push(currentOperator.sign);
			}
		});
		return numberStack[0];
	}

	function checkString(input) {
		const regex = /([a-z]{3,4})\(|\)(\^)|(\^)\(/;
		let matched = input.value.match(regex);
		if (matched) {
			matched = matched.filter(value => value);
			const message = matched[1] === "^"
				? `Please, remove brackets near the ${matched[1]} sign`
				: `Please, remove brackets after the ${matched[1]}`;
			return message;
		}
		return false;
	}
	function makeErrorHint(message, modalBlock, modalText) {
		modalText.textContent = message;
		modalBlock.style.display = "flex";
	}

	//event binding
	function bindEvent() {
		const dom = cacheDom();

		dom.historyBtn.addEventListener("click", () => {
			dom.historyBlock.classList.toggle("block");
		});
		dom.numbers.forEach(num => {
			num.addEventListener("click", () => {
				dom.viewer.value += num.value;
			});
		});
		dom.operators.forEach(operator => {
			operator.addEventListener("click", () => {
				if (operator.value === "C") dom.viewer.value = "";
				else dom.viewer.value += operator.value;
				const message = checkString(dom.viewer);
				if (message) makeErrorHint(message, dom.modalElements, dom.modalText);
			});
		});
		dom.viewer.addEventListener("input", () => {
			const message = checkString(dom.viewer);
			if (message) makeErrorHint(message, dom.modalElements, dom.modalText);
		});
		dom.modalCloseBtn.addEventListener("click", () => {
			dom.modalElements.style.display = "none";
		});

		const addToHistory = history();	//don't forget to add history and string check
		dom.equalSign.addEventListener("click", () => {
			const receivedString = dom.viewer.value;
			const stringCopy = receivedString;
			const calculatedNumber = calculateString(receivedString);
			dom.viewer.value = calculatedNumber;
			addToHistory(stringCopy, calculatedNumber, dom.historyBlock);
		});
	}

	(function init() {
		fillCalculator();
		bindEvent();
	})();
})();