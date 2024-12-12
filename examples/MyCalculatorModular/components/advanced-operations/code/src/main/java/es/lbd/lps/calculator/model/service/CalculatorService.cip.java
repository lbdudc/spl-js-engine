package es.lbd.lps.calculator.model.service;

import org.springframework.stereotype.Component;

import es.lbd.lps.calculator.controller.custom.Operation;

@Component
public class CalculatorService {

	public float calculate(float first, float second, Operation operation) {

		switch (operation) {
		/*→ codeInsertionPoint1 ←*/
		/*% if (feature.divide) { %*/
		case DIVIDE:
			return divide(first, second);
		/*% } %*/
		/*% if (feature.power) { %*/
		case POWER:
			return power(first, second);
		/*% } %*/
		/*% if (feature.square_root) { %*/
		case SQUARE_ROOT:
			return square_root(first);
		/*% } %*/
		/*→ codeInsertionPoint1 ←*/
		}
		return 0;
	}

	/*→ codeInsertionPoint2 ←*/
	/*% if (feature.divide) { %*/	
	private float divide(float first, float second) {
		return first / second;
	}/*% } %*/
	/*% if (feature.power) { %*/	
	private float power(float first, float second) {
		return (float) Math.pow(first, second);
	}/*% } %*/
	/*% if (feature.square_root) { %*/	
	private float square_root(float first) {
		return (float) Math.sqrt(first);
	}/*% } %*/
	/*→ codeInsertionPoint2 ←*/

}
