package es.lbd.lps.calculator.model.service;

import org.springframework.stereotype.Component;

import es.lbd.lps.calculator.controller.custom.Operation;

@Component
public class CalculatorService {

	public float calculate(float first, float second, Operation operation) {
		switch (operation) {
		case NONE:
			return 0;		
		/*→ codeInsertionPoint1 ←*/
		}
		return 0;
	}

	/*→ codeInsertionPoint2 ←*/
}
