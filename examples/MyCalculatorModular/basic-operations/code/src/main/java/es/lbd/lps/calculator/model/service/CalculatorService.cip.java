package es.lbd.lps.calculator.model.service;

import org.springframework.stereotype.Component;

import es.lbd.lps.calculator.controller.custom.Operation;

@Component
public class CalculatorService {

	public float calculate(float first, float second, Operation operation) {
		
		switch (operation) {
		/*→ codeInsertionPoint1 ←*/
		/*% if (feature.add) { %*/
		case ADD:
			return add(first, second);/*% } if (feature.multiply) { %*/
		case MULTIPLY:
			return multiply(first, second);/*% } if (feature.subtract) { %*/
		case SUBTRACT:
			return subtract(first, second);/*% } %*/
		/*→ codeInsertionPoint1 ←*/
		}
		return 0;
	}

	/*→ codeInsertionPoint2 ←*/
	/*% if (feature.add) { %*/
	private float add(float first, float second) {

		return first + second;
	}/*% } if (feature.subtract) { %*/
	
	private float subtract(float first, float second) {

		return first - second;
	}/*% } if (feature.multiply) { %*/
	
	private float multiply(float first, float second) {

		return first * second;
	}/*% } %*/
	/*→ codeInsertionPoint2 ←*/
}
