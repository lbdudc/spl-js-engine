package es.lbd.lps.calculator.controller;

import javax.inject.Inject;
import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import es.lbd.lps.calculator.controller.custom.Operation;
import es.lbd.lps.calculator.controller.custom.RequestJSON;
import es.lbd.lps.calculator.controller.custom.ResultJSON;
import es.lbd.lps.calculator.model.service.CalculatorService;

@RestController
@RequestMapping("/api/calculator")
public class CalculatorResource {

	@Inject
	private CalculatorService calculatorService;

	@RequestMapping(method = RequestMethod.POST)
	public ResponseEntity<ResultJSON> calculate(@Valid @RequestBody RequestJSON request) {
		/*→ codeInsertionPoint1 ←*/
		
		return new ResponseEntity<ResultJSON>(new ResultJSON(calculatorService.calculate(request.getFirst(),
				request.getSecond(), request.getOperation())), HttpStatus.OK);
	}
}
